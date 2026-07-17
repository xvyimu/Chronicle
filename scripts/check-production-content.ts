import { getAllLinkCategories } from '../src/lib/links';
import { selectHomeLinkPreviewCategories } from '../src/lib/link-preview';
import { getAllPosts } from '../src/lib/posts';
import { getAllProjects, getFeaturedProjects } from '../src/lib/projects';
import { getAboutContent } from '../src/lib/about';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type HeaderExpectation = {
  name: string;
  validate(value: string | null): string | null;
};

export type PageExpectation = {
  label: string;
  path: string;
  contentTypeIncludes: string;
  mustContain: string[];
  requiredHeaders?: HeaderExpectation[];
  json?: {
    source: string;
    resultSlug: string;
  };
};

type CheckFailure = {
  label: string;
  message: string;
};

const DEFAULT_ATTEMPTS = 5;
const DEFAULT_RETRY_DELAY_MS = 3000;
const DEFAULT_TIMEOUT_MS = 10_000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';

function readBaseUrl(): string {
  const baseUrlFlag = process.argv.find((arg) => arg.startsWith('--base-url='));
  const rawUrl =
    baseUrlFlag?.slice('--base-url='.length) ??
    process.env.PRODUCTION_CONTENT_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL;

  if (!rawUrl) {
    throw new Error(
      'Set NEXT_PUBLIC_SITE_URL, PRODUCTION_CONTENT_BASE_URL, or pass --base-url=https://example.com.',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Production content base URL is invalid: ${rawUrl}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Production content base URL must use http(s): ${rawUrl}`);
  }

  return rawUrl.replace(/\/+$/, '');
}

function requireText(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Cannot build production content check: missing ${label}.`);
  }
  return value;
}

function firstMarkdownHeading(markdown: string): string | undefined {
  return /^\s*#{1,6}\s+(.+?)\s*#*\s*$/mu.exec(markdown)?.[1]?.trim();
}

function validateCsp(value: string | null): string | null {
  if (!value) return 'is missing';

  const directives = new Map(
    value
      .split(';')
      .map((directive) => directive.trim().split(/\s+/u))
      .filter((parts) => parts[0])
      .map(([name, ...sources]) => [name.toLowerCase(), sources]),
  );
  const defaultSources = directives.get('default-src') ?? [];
  const scriptSources = directives.get('script-src') ?? [];

  if (!defaultSources.includes("'self'")) {
    return "must include default-src 'self'";
  }
  if (!scriptSources.some((source) => /^'nonce-[^']+'$/u.test(source))) {
    return 'script-src must include a nonce source';
  }
  if (!scriptSources.includes("'strict-dynamic'")) {
    return "script-src must include 'strict-dynamic'";
  }
  if (scriptSources.includes("'unsafe-inline'")) {
    return "script-src must not include 'unsafe-inline'";
  }

  return null;
}

const HOME_SECURITY_HEADERS: HeaderExpectation[] = [
  {
    name: 'content-security-policy',
    validate: validateCsp,
  },
  {
    name: 'strict-transport-security',
    validate: (value) =>
      value?.toLowerCase().includes('max-age=31536000')
        ? null
        : 'must include max-age=31536000',
  },
  {
    name: 'x-content-type-options',
    validate: (value) =>
      value?.trim().toLowerCase() === 'nosniff' ? null : 'must equal nosniff',
  },
];

export function buildExpectations(baseUrl: string): PageExpectation[] {
  const posts = getAllPosts();
  const projects = getAllProjects();
  const featuredProjects = getFeaturedProjects();
  const linkCategories = getAllLinkCategories();

  const homePosts = [
    ...posts.filter((post) => post.featured),
    ...posts.filter((post) => !post.featured),
  ].slice(0, 6);
  const homeLinkCategory = selectHomeLinkPreviewCategories(linkCategories)[0];
  const firstLinkItem = linkCategories.find((category) => category.items.length > 0)
    ?.items[0];
  const aboutContent = requireText(getAboutContent() ?? undefined, 'About content');

  const firstPost = requireText(posts[0]?.title, 'blog post title');
  const firstPostSlug = requireText(posts[0]?.slug, 'blog post slug');
  const aboutHeading = requireText(
    firstMarkdownHeading(aboutContent),
    'About Markdown heading',
  );
  const homePost = requireText(homePosts[0]?.title, 'home article title');
  const firstProject = requireText(projects[0]?.title, 'project title');
  const homeProject = requireText(
    (featuredProjects[0] ?? projects[0])?.title,
    'home project title',
  );
  const linkCategory = requireText(homeLinkCategory?.title, 'link category title');
  const linkItem = requireText(firstLinkItem?.title, 'link item title');

  return [
    {
      label: 'home',
      path: '/',
      contentTypeIncludes: 'text/html',
      mustContain: [homePost, homeProject, linkCategory],
      requiredHeaders: HOME_SECURITY_HEADERS,
    },
    {
      label: 'blog',
      path: '/blog',
      contentTypeIncludes: 'text/html',
      mustContain: [firstPost],
    },
    {
      label: 'about',
      path: '/about',
      contentTypeIncludes: 'text/html',
      mustContain: [aboutHeading],
    },
    {
      label: 'article',
      path: `/blog/${firstPostSlug}`,
      contentTypeIncludes: 'text/html',
      mustContain: [firstPost],
    },
    {
      label: 'search',
      path: `/api/search?q=${encodeURIComponent(firstPost)}`,
      contentTypeIncludes: 'application/json',
      mustContain: [],
      json: {
        source: 'server',
        resultSlug: firstPostSlug,
      },
    },
    {
      label: 'projects',
      path: '/projects',
      contentTypeIncludes: 'text/html',
      mustContain: [firstProject],
    },
    {
      label: 'links',
      path: '/links',
      contentTypeIncludes: 'text/html',
      mustContain: [linkCategory, linkItem],
    },
    {
      label: 'sitemap',
      path: '/sitemap.xml',
      contentTypeIncludes: 'xml',
      mustContain: [`${baseUrl}/blog`, `${baseUrl}/projects`, `${baseUrl}/links`],
    },
    {
      label: 'feed',
      path: '/feed.xml',
      contentTypeIncludes: 'xml',
      mustContain: [firstPost],
    },
  ];
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type FetchOptions = {
  fetchImpl?: typeof fetch;
  attempts?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
};

export async function fetchResponseWithRetry(
  url: string,
  {
    fetchImpl = fetch,
    attempts = DEFAULT_ATTEMPTS,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  }: FetchOptions = {},
): Promise<{
  body: string;
  contentType: string;
  status: number;
  headers: Headers;
}> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        headers: {
          accept:
            'text/html,application/xhtml+xml,application/json,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'cache-control': 'no-cache',
          'user-agent': USER_AGENT,
        },
        signal: controller.signal,
      });
      const body = await response.text();

      if (response.ok) {
        return {
          body,
          contentType: response.headers.get('content-type') ?? '',
          status: response.status,
          headers: response.headers,
        };
      }

      lastError = new Error(`HTTP ${response.status} at ${url}.`);
    } catch (error) {
      lastError = controller.signal.aborted
        ? new Error(`Request timed out after ${timeoutMs}ms at ${url}.`)
        : error;
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < attempts) {
      await wait(retryDelayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function checkPage(
  baseUrl: string,
  expectation: PageExpectation,
  options: FetchOptions = {},
): Promise<CheckFailure[]> {
  const url = `${baseUrl}${expectation.path}`;
  const failures: CheckFailure[] = [];

  try {
    const response = await fetchResponseWithRetry(url, options);

    if (!response.contentType.includes(expectation.contentTypeIncludes)) {
      failures.push({
        label: expectation.label,
        message: `Expected content-type to include "${expectation.contentTypeIncludes}", got "${response.contentType}".`,
      });
    }

    for (const text of expectation.mustContain) {
      if (!response.body.includes(text)) {
        failures.push({
          label: expectation.label,
          message: `Missing expected content "${text}" at ${url}.`,
        });
      }
    }

    for (const header of expectation.requiredHeaders ?? []) {
      const validationError = header.validate(response.headers.get(header.name));
      if (validationError) {
        failures.push({
          label: expectation.label,
          message: `Response header "${header.name}" ${validationError} at ${url}.`,
        });
      }
    }

    if (expectation.json) {
      try {
        const payload = JSON.parse(response.body) as {
          source?: unknown;
          results?: Array<{ item?: { slug?: unknown } }>;
        };
        if (payload.source !== expectation.json.source) {
          failures.push({
            label: expectation.label,
            message: `Expected JSON source "${expectation.json.source}" at ${url}.`,
          });
        }
        if (
          !payload.results?.some(
            ({ item }) => item?.slug === expectation.json?.resultSlug,
          )
        ) {
          failures.push({
            label: expectation.label,
            message: `Expected search result slug "${expectation.json.resultSlug}" at ${url}.`,
          });
        }
      } catch {
        failures.push({
          label: expectation.label,
          message: `Expected valid JSON at ${url}.`,
        });
      }
    }

    console.log(
      `[production-content] ${expectation.label}: ${response.status} ${response.body.length} bytes`,
    );
  } catch (error) {
    failures.push({
      label: expectation.label,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return failures;
}

export async function checkExpectations(
  baseUrl: string,
  expectations: PageExpectation[],
  options: FetchOptions = {},
): Promise<CheckFailure[]> {
  return (
    await Promise.all(
      expectations.map((expectation) => checkPage(baseUrl, expectation, options)),
    )
  ).flat();
}

async function main(): Promise<void> {
  const baseUrl = readBaseUrl();
  const expectations = buildExpectations(baseUrl);
  const failures = await checkExpectations(baseUrl, expectations);

  if (failures.length === 0) {
    console.log(`[production-content] passed for ${baseUrl}`);
    return;
  }

  console.error(`[production-content] failed for ${baseUrl}:`);
  for (const failure of failures) {
    console.error(`- ${failure.label}: ${failure.message}`);
  }
  process.exitCode = 1;
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(path.resolve(entryPath)).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
