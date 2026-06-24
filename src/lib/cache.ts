/**
 * createCache<T> — 显式内存缓存工具
 *
 * 提供统一的缓存模式：
 * 1. 开发环境：基于文件 mtime 自动失效（HMR 场景）
 * 2. 生产环境：首次计算后永久缓存（构建时 SSG）
 * 3. 测试环境：可通过 setContentSource + invalidate 重置
 *
 * 使用示例：
 *   const postCache = createCache<PostFull[]>({ watchPath: CONTENT_DIR.blog });
 *   const posts = postCache.getOrCompute(() => readAllPosts());
 */

import { getContentSource } from './content-source';

export interface CacheOptions {
  /** 监听的文件/目录路径（相对项目根），mtime 变化时自动失效（仅开发环境） */
  watchPath?: string;
}

export interface Cache<T> {
  /** 获取缓存值（可能为 null） */
  get(): T | null;
  /** 手动设置缓存值 */
  set(value: T): void;
  /** 手动失效缓存 */
  invalidate(): void;
  /** 获取缓存值，不存在或失效时调用 factory 计算 */
  getOrCompute(factory: () => T): T;
}

export function createCache<T>(options?: CacheOptions): Cache<T> {
  let value: T | null = null;
  let cachedMtime: number | null = null;

  return {
    get(): T | null {
      return value;
    },

    set(v: T): void {
      value = v;
    },

    invalidate(): void {
      value = null;
      cachedMtime = null;
    },

    getOrCompute(factory: () => T): T {
      // 开发环境：检查 watchPath 的 mtime，变化时自动失效
      if (options?.watchPath && process.env.NODE_ENV !== 'production') {
        const source = getContentSource();
        // 对于目录，遍历内部文件取最大 mtime（目录 mtime 不随文件内容变化）
        const files = source.readDir(options.watchPath);
        let currentMtime: number | null = null;
        if (files) {
          for (const f of files) {
            const m = source.getMtime(`${options.watchPath}/${f}`);
            if (m !== null && (currentMtime === null || m > currentMtime)) {
              currentMtime = m;
            }
          }
        } else {
          // 单文件场景
          currentMtime = source.getMtime(options.watchPath);
        }
        if (currentMtime !== null && currentMtime !== cachedMtime) {
          value = null;
          cachedMtime = currentMtime;
        }
      }

      if (value === null) {
        value = factory();
      }

      return value;
    },
  };
}
