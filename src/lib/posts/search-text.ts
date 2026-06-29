import type { PostFrontmatter } from '@/types';

/**
 * MDX 清洗工具 — 从正文中提取搜索文本、摘要、标题.
 *
 * 这一层无业务依赖 (不读 fs / 不调 cache), 纯字符串处理.
 */

export function extractPostHeadings(content: string): string[] {
  return Array.from(content.matchAll(/^#{2,3}\s+(.+)$/gm))
    .map((match) => match[1])
    .map((heading) => heading.replace(/\s+#+$/, '').trim())
    .filter(Boolean);
}

function stripMdxForSearch(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[{}[\]()*_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractPostExcerpt(content: string, maxLength = 180): string {
  const text = stripMdxForSearch(content);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function buildPostSearchText(
  post: Pick<PostFrontmatter, 'title' | 'description' | 'tags' | 'category' | 'series'>,
  content: string,
): string {
  const headings = extractPostHeadings(content).join(' ');
  const excerpt = extractPostExcerpt(content);
  return [
    post.title,
    post.description,
    post.category,
    post.series,
    ...post.tags,
    headings,
    excerpt,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
