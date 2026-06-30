/**
 * createCache<T> — 显式内存缓存工具
 *
 * 提供统一的缓存模式：
 * 1. 开发环境：基于文件 mtime 自动失效（HMR 场景）
 * 2. 生产环境：首次计算后永久缓存（构建时 SSG）
 * 3. 测试环境：可通过 setContentSource + resetAllCaches 重置
 *
 * 使用示例：
 *   const postCache = createCache<PostFull[]>({ watchPath: CONTENT_DIR.blog });
 *   const posts = postCache.getOrCompute(() => readAllPosts());
 *
 * 测试中替换 ContentSource 时，必须显式调用 resetAllCaches() 清空所有
 * 已注册的缓存，否则后续 getOrCompute 会返回上一个 source 的旧数据：
 *
 *   const prev = setContentSource(mockSource);
 *   resetAllCaches(); // 显式契约
 *   // ... 测试逻辑
 *   setContentSource(prev);
 *   resetAllCaches(); // 恢复
 */

import { getContentSource, type ContentSource } from './content-source';

export interface CacheOptions {
  /** 监听的文件/目录路径（相对项目根），mtime 变化时自动失效（仅开发环境） */
  watchPath?: string;
  /**
   * 显式注入 ContentSource, 用于测试场景传入 in-memory source.
   * 不传则使用全局 getContentSource() (向后兼容).
   */
  source?: ContentSource;
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

/**
 * 全局缓存注册表 — 持有所有 createCache 实例的弱引用（通过 invalidate 方法）。
 * 用于测试场景下一次性重置所有缓存，避免 swap ContentSource 后读到旧数据。
 */
const _registry = new Set<Cache<unknown>>();

/** 注册一个缓存实例到全局注册表（createCache 自动调用） */
function _register<T>(cache: Cache<T>): void {
  _registry.add(cache as Cache<unknown>);
}

/**
 * 重置所有已注册的缓存。测试中替换 ContentSource 后应调用此函数。
 * 注意：此函数会清空所有缓存，仅用于测试环境。
 */
export function resetAllCaches(): void {
  for (const cache of _registry) {
    cache.invalidate();
  }
}

export function createCache<T>(options?: CacheOptions): Cache<T> {
  let value: T | null = null;
  let cachedMtime: number | null = null;

  const cache: Cache<T> = {
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
        const source = options.source ?? getContentSource();
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

  _register(cache);
  return cache;
}
