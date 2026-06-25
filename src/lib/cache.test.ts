import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCache } from './cache';
import { setContentSource, type ContentSource } from './content-source';

/** Create a mock ContentSource with controllable mtime values */
function createMockSource(files: Record<string, number>): ContentSource {
  return {
    readFile: () => null,
    readDir: (p) => {
      const dirFiles = Object.keys(files).filter((f) => f.startsWith(p + '/'));
      return dirFiles.length > 0 ? dirFiles.map((f) => f.split('/').pop()!) : null;
    },
    getMtime: (p) => files[p] ?? null,
  };
}

describe('createCache', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    vi.stubEnv('NODE_ENV', originalEnv);
  });

  describe('basic operations', () => {
    it('get returns null initially', () => {
      const cache = createCache<string>();
      expect(cache.get()).toBeNull();
    });

    it('set stores a value', () => {
      const cache = createCache<string>();
      cache.set('hello');
      expect(cache.get()).toBe('hello');
    });

    it('invalidate clears the value', () => {
      const cache = createCache<string>();
      cache.set('hello');
      cache.invalidate();
      expect(cache.get()).toBeNull();
    });

    it('getOrCompute calls factory when cache is empty', () => {
      const cache = createCache<string>();
      const factory = vi.fn(() => 'computed');
      const result = cache.getOrCompute(factory);
      expect(result).toBe('computed');
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('getOrCompute does not call factory when cache has value', () => {
      const cache = createCache<string>();
      cache.set('existing');
      const factory = vi.fn(() => 'computed');
      const result = cache.getOrCompute(factory);
      expect(result).toBe('existing');
      expect(factory).not.toHaveBeenCalled();
    });

    it('getOrCompute caches the factory result', () => {
      const cache = createCache<string>();
      const factory = vi.fn(() => 'computed');
      cache.getOrCompute(factory);
      cache.getOrCompute(factory);
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe('mtime-based invalidation (dev only)', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    it('invalidates when file mtime changes', () => {
      const files: Record<string, number> = { 'content/blog/a.mdx': 1000 };
      const prevSource = setContentSource(createMockSource(files));
      const cache = createCache<string>({ watchPath: 'content/blog' });

      const factory = vi.fn(() => 'first');
      cache.getOrCompute(factory);
      expect(factory).toHaveBeenCalledTimes(1);

      // Same mtime → no recompute
      cache.getOrCompute(factory);
      expect(factory).toHaveBeenCalledTimes(1);

      // mtime changed → recompute
      files['content/blog/a.mdx'] = 2000;
      cache.getOrCompute(factory);
      expect(factory).toHaveBeenCalledTimes(2);

      setContentSource(prevSource);
    });

    it('does not check mtime when watchPath is not set', () => {
      const prevSource = setContentSource(createMockSource({}));
      const cache = createCache<string>(); // no watchPath

      const factory = vi.fn(() => 'value');
      cache.getOrCompute(factory);
      cache.getOrCompute(factory);
      expect(factory).toHaveBeenCalledTimes(1);

      setContentSource(prevSource);
    });

    it('handles null readDir (directory does not exist)', () => {
      const prevSource = setContentSource({
        readFile: () => null,
        readDir: () => null,
        getMtime: () => null,
      });
      const cache = createCache<string>({ watchPath: 'nonexistent' });

      const factory = vi.fn(() => 'value');
      const result = cache.getOrCompute(factory);
      expect(result).toBe('value');

      // When mtime is null, cache does not invalidate (null !== null is false),
      // so factory is called only once and cached value is returned
      cache.getOrCompute(factory);
      expect(factory).toHaveBeenCalledTimes(1);

      setContentSource(prevSource);
    });

    it('handles single-file watchPath (readDir returns null)', () => {
      const files: Record<string, number> = { 'config.json': 500 };
      const prevSource = setContentSource({
        readFile: () => null,
        readDir: () => null, // Simulate single file, not a directory
        getMtime: (p) => files[p] ?? null,
      });
      const cache = createCache<string>({ watchPath: 'config.json' });

      const factory = vi.fn(() => 'value');
      cache.getOrCompute(factory);
      expect(factory).toHaveBeenCalledTimes(1);

      // Same mtime → no recompute
      cache.getOrCompute(factory);
      expect(factory).toHaveBeenCalledTimes(1);

      setContentSource(prevSource);
    });
  });

  describe('production environment', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('does not check mtime in production', () => {
      const files: Record<string, number> = { 'content/blog/a.mdx': 1000 };
      const prevSource = setContentSource(createMockSource(files));
      const cache = createCache<string>({ watchPath: 'content/blog' });

      const factory = vi.fn(() => 'value');
      cache.getOrCompute(factory);

      // Change mtime — should NOT invalidate in production
      files['content/blog/a.mdx'] = 9999;
      cache.getOrCompute(factory);
      expect(factory).toHaveBeenCalledTimes(1);

      setContentSource(prevSource);
    });
  });
});
