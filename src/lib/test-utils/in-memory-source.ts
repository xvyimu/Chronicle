import type { ContentSource } from '@/lib/content-source';

/**
 * In-memory ContentSource — 测试夹具, 不读真实 fs.
 *
 * 用法:
 *   const source = createInMemorySource({
 *     'content/blog/2026-06-test.mdx': '---\ntitle: 测试\n...\n---\n正文',
 *   });
 *   const repo = createPostRepository(source);
 *
 * mtime 返回固定值 0, cache 第一次访问后 cachedMtime=0,
 * 后续 0===0 不失效 (除非显式 invalidate).
 */

export interface InMemoryFiles {
  [relativePath: string]: string;
}

export function createInMemorySource(files: InMemoryFiles): ContentSource {
  return {
    readFile(relativePath: string): string | null {
      return files[relativePath] ?? null;
    },

    readDir(relativePath: string): string[] | null {
      const prefix = relativePath.endsWith('/') ? relativePath : `${relativePath}/`;
      const entries = new Set<string>();
      for (const filePath of Object.keys(files)) {
        if (!filePath.startsWith(prefix)) continue;
        const rest = filePath.slice(prefix.length);
        // 仅返回直接子项 (不递归), 与 fs.readdirSync 一致
        const slashIdx = rest.indexOf('/');
        if (slashIdx === -1) {
          entries.add(rest);
        } else {
          entries.add(rest.slice(0, slashIdx));
        }
      }
      const result = Array.from(entries);
      return result.length === 0 ? null : result;
    },

    getMtime(relativePath: string): number | null {
      // 直接文件存在?
      if (files[relativePath] !== undefined) return 0;
      // 目录存在 (任一文件以 path/ 为前缀)?
      const prefix = relativePath.endsWith('/') ? relativePath : `${relativePath}/`;
      for (const filePath of Object.keys(files)) {
        if (filePath.startsWith(prefix)) return 0;
      }
      return null;
    },
  };
}

/**
 * 构造 MDX 字符串的工具, 避免 fixture 中重复写 frontmatter 分隔符.
 *
 *   const mdx = mdx`
 *     title: 测试
 *     date: 2026-06-01
 *     tags: [a, b]
 *   `;
 */
export function mdx(parts: TemplateStringsArray, ...values: unknown[]): string {
  let frontmatter = '';
  for (let i = 0; i < parts.length; i++) {
    frontmatter += parts[i];
    if (i < values.length) frontmatter += String(values[i]);
  }
  // 模板内容视为 frontmatter (无 ---), 末尾追加双换行 + 默认空正文
  return `---\n${frontmatter.trimEnd()}\n---\n`;
}

/**
 * 构造 MDX 字符串 (含正文).
 *
 *   const mdx = mdxWithBody`
 *   title: 测试
 *   date: 2026-06-01
 *   ---
 *   正文内容
 *   ## 标题`;
 */
export function mdxWithBody(parts: TemplateStringsArray, ...values: unknown[]): string {
  let combined = '';
  for (let i = 0; i < parts.length; i++) {
    combined += parts[i];
    if (i < values.length) combined += String(values[i]);
  }
  // 在第一次出现 '---' (非开头的) 处分割 frontmatter 和 body
  const lines = combined.split('\n');
  let closingIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closingIdx = i;
      break;
    }
  }
  if (closingIdx === -1) {
    return `---\n${combined.trimEnd()}\n---\n`;
  }
  const frontmatter = lines.slice(0, closingIdx).join('\n').trimEnd();
  const body = lines
    .slice(closingIdx + 1)
    .join('\n')
    .trimStart();
  return `---\n${frontmatter}\n---\n${body}`;
}
