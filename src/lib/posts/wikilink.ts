/**
 * Pure wikilink helpers — parse / normalize / href / extract.
 * No FS, no cache; used by remark plugin and link-graph.
 */

export type WikilinkMatch = {
  /** Target post slug (filenameToSlug form), trimmed */
  slug: string;
  /** Display label; equals slug when no `|label` */
  label: string;
  /** Full match text including brackets, for replace/tests */
  raw: string;
};

// Label may be empty (`[[slug|]]`) → falls back to slug after trim
const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g;

/** Normalize target: trim; reject empty after trim. No date-prefix strip. */
export function normalizeWikilinkSlug(rawTarget: string): string {
  const slug = rawTarget.trim();
  if (!slug) {
    throw new Error('[wikilink] empty target slug');
  }
  return slug;
}

/** href for a resolved slug */
export function wikilinkHref(slug: string): string {
  return `/blog/${slug}`;
}

/**
 * Split body into segments that are either code (fenced/inline) or free text.
 * Fenced ```...``` and inline `...` are protected so wikilinks inside are ignored.
 */
function splitCodeRegions(content: string): Array<{ text: string; isCode: boolean }> {
  const segments: Array<{ text: string; isCode: boolean }> = [];
  // Fenced code first, then remaining non-code chunks are scanned for inline code
  const fenceRe = /```[\s\S]*?```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const top: Array<{ text: string; isCode: boolean }> = [];

  while ((m = fenceRe.exec(content)) !== null) {
    if (m.index > last) {
      top.push({ text: content.slice(last, m.index), isCode: false });
    }
    top.push({ text: m[0], isCode: true });
    last = m.index + m[0].length;
  }
  if (last < content.length) {
    top.push({ text: content.slice(last), isCode: false });
  }

  for (const part of top) {
    if (part.isCode) {
      segments.push(part);
      continue;
    }
    const inlineRe = /`[^`\n]+`/g;
    let iLast = 0;
    let im: RegExpExecArray | null;
    while ((im = inlineRe.exec(part.text)) !== null) {
      if (im.index > iLast) {
        segments.push({ text: part.text.slice(iLast, im.index), isCode: false });
      }
      segments.push({ text: im[0], isCode: true });
      iLast = im.index + im[0].length;
    }
    if (iLast < part.text.length) {
      segments.push({ text: part.text.slice(iLast), isCode: false });
    }
  }

  return segments;
}

function parseMatch(
  raw: string,
  target: string,
  labelPart: string | undefined,
): WikilinkMatch | null {
  let slug: string;
  try {
    slug = normalizeWikilinkSlug(target);
  } catch {
    return null;
  }
  const labelTrimmed = labelPart?.trim() ?? '';
  const label = labelTrimmed || slug;
  return { slug, label, raw };
}

/**
 * Extract wikilinks from MDX/Markdown body (no frontmatter).
 * Ignores matches inside fenced code blocks and inline code.
 * Syntax: [[slug]] | [[slug|label]]
 */
export function extractWikilinks(content: string): WikilinkMatch[] {
  const results: WikilinkMatch[] = [];
  const segments = splitCodeRegions(content);

  for (const segment of segments) {
    if (segment.isCode) continue;
    WIKILINK_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = WIKILINK_RE.exec(segment.text)) !== null) {
      const parsed = parseMatch(m[0], m[1], m[2]);
      if (parsed) results.push(parsed);
    }
  }

  return results;
}
