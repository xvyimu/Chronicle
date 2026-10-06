import type { PostMeta } from '@/types';

/**
 * 客户端搜索用的精简文档投影。
 *
 * 只含标题/描述/标签/分类等可搜索字段 + 展示所需元信息；
 * 不含正文（客户端搜索不索引正文，规模匹配 20 篇）。
 */
export type SearchDoc = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  category: string | null;
  date: string;
  readingTime: string;
};

/** PostMeta → SearchDoc（纯投影，供客户端搜索索引）。 */
export function toSearchDoc(post: PostMeta): SearchDoc {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    tags: post.tags,
    category: post.category ?? null,
    date: post.date,
    readingTime: post.readingTime,
  };
}
