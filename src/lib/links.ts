import { z } from 'zod';
import type { LinkCategory } from '@/types';
import { CONTENT_DIR } from './content-dirs';
import { createCache } from './cache';
import type { ContentSource } from './content-source';
import { filesystemSource } from './content-source';

/**
 * links 模块 — 读取 + 校验 data/links.json.
 *
 * 通过 createLinksRepository(source) 注入 ContentSource, 测试可传 in-memory source.
 * 默认实例 linksRepository 使用 filesystemSource.
 */

const LinkItemSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  description: z.string(),
});

const LinkCategorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  items: z.array(LinkItemSchema),
});

export function parseLinks(raw: unknown): LinkCategory[] {
  return z.array(LinkCategorySchema).parse(raw);
}

export interface LinksRepository {
  /** 获取全部链接分类 (含缓存) */
  getAllCategories(): LinkCategory[];
  /** 根据 id 查找单个分类 */
  getCategoryById(id: string): LinkCategory | null;
}

export function createLinksRepository(source: ContentSource): LinksRepository {
  const cache = createCache<LinkCategory[]>({
    watchPath: CONTENT_DIR.links,
    source,
  });

  function getAllCategories(): LinkCategory[] {
    return cache.getOrCompute(() => {
      const raw = source.readFile(CONTENT_DIR.links);
      if (raw === null) {
        console.warn(`[links] 数据文件不存在: ${CONTENT_DIR.links}`);
        return [];
      }
      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error(`[links] JSON 解析失败: ${CONTENT_DIR.links}`, e);
        return [];
      }
      return parseLinks(data);
    });
  }

  function getCategoryById(id: string): LinkCategory | null {
    return getAllCategories().find((c) => c.id === id) ?? null;
  }

  return { getAllCategories, getCategoryById };
}

/** 默认 LinksRepository 实例 (基于 filesystemSource). */
export const linksRepository = createLinksRepository(filesystemSource);

/**
 * 向后兼容便捷函数 — 委托给默认 linksRepository.
 * app/ 调用方可逐步迁移到 linksRepository.getAllCategories() 等.
 */
export function getAllLinkCategories(): LinkCategory[] {
  return linksRepository.getAllCategories();
}

export function getLinkCategoryById(id: string): LinkCategory | null {
  return linksRepository.getCategoryById(id);
}
