/**
 * content-dirs.ts — 内容文件路径与分页常量
 *
 * 所有数据源的文件路径集中定义，供 ContentSource 统一读取。
 */

export const CONTENT_DIR = {
  blog: 'content/blog',
  about: 'content/about.mdx',
  projects: 'data/projects.json',
  links: 'data/links.json',
} as const;

export const PAGE_SIZE = 12; // 博客列表每页文章数
