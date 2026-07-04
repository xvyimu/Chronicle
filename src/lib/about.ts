import { CONTENT_DIR } from './content-dirs';
import type { ContentSource } from './content-source';
import { filesystemSource } from './content-source';

/**
 * about 模块 — 读取 about.mdx 原始内容.
 *
 * 通过 createAboutReader(source) 注入 ContentSource, 测试可传 in-memory source.
 * 默认实例 aboutReader 使用 filesystemSource.
 */

export interface AboutReader {
  /** 读取 about.mdx 原始内容，不存在时返回 null */
  getContent(): string | null;
}

export function createAboutReader(source: ContentSource): AboutReader {
  return {
    getContent(): string | null {
      return source.readFile(CONTENT_DIR.about);
    },
  };
}

/** 默认 AboutReader 实例 (基于 filesystemSource). */
export const aboutReader = createAboutReader(filesystemSource);

/**
 * 向后兼容便捷函数 — 委托给默认 aboutReader.
 * app/ 调用方可逐步迁移到 aboutReader.getContent().
 */
export function getAboutContent(): string | null {
  return aboutReader.getContent();
}
