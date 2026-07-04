import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { decodeRouteSegment } from '@/lib/utils';

/**
 * createDynamicRoute — 收敛 4 条动态路由的三段式接口契约.
 *
 * blog/[slug] / projects/[id] / tags/[tag] / categories/[category] 共享:
 *   1. generateStaticParams — 提取所有 slug
 *   2. generateMetadata — canonical URL + SEO metadata
 *   3. default export — 数据查询 + notFound 守卫 + 渲染
 *
 * adapter 集中: paramKey 解码, canonical 构造, notFound 守卫.
 * caller 提供: getAllSlugs / getBySlug / buildMetadata / render.
 */

interface DynamicRouteConfig<TData> {
  /** URL 参数名 (用于 generateStaticParams 和 params 解构), 如 'slug' / 'id' / 'tag' / 'category' */
  paramKey: string;
  /** 提取所有 slug (用于 generateStaticParams) */
  getAllSlugs(): string[];
  /** 根据 slug 查询数据, 找不到返回 null (触发 notFound) */
  getBySlug(slug: string): TData | null;
  /** 构造 metadata (caller 负责, 因 adapter 不知道 TData 形状) */
  buildMetadata(data: TData, slug: string): Metadata;
  /** 渲染页面, data 已确保非 null */
  render(data: TData, slug: string): ReactNode | Promise<ReactNode>;
}

export function createDynamicRoute<TData>(config: DynamicRouteConfig<TData>) {
  const { paramKey } = config;

  async function generateStaticParams() {
    return config.getAllSlugs().map((slug) => ({ [paramKey]: slug }));
  }

  async function generateMetadata({
    params,
  }: {
    params: Promise<{ [key: string]: string }>;
  }): Promise<Metadata> {
    const resolved = await params;
    const rawSlug = resolved[paramKey];
    const slug = decodeRouteSegment(rawSlug);
    const data = config.getBySlug(slug);
    if (!data) return {};
    return config.buildMetadata(data, slug);
  }

  async function Page({ params }: { params: Promise<{ [key: string]: string }> }) {
    const resolved = await params;
    const rawSlug = resolved[paramKey];
    const slug = decodeRouteSegment(rawSlug);
    const data = config.getBySlug(slug);
    if (!data) notFound();
    return await config.render(data, slug);
  }

  return { generateStaticParams, generateMetadata, default: Page };
}
