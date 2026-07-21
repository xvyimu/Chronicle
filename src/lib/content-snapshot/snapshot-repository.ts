import type { PostFull, PostMeta } from '@/types';
import type { PostRepository } from '@/lib/posts/repository';
import { getSnapshotPostBySlug, getSnapshotPostsMeta, readContentSnapshot } from './read';

/**
 * PostRepository backed by the committed content snapshot (no MDX scan).
 * Loads once via readContentSnapshot module cache.
 */
export function createSnapshotPostRepository(rootDir?: string): PostRepository {
  // Eager validate on first method call (or constructor-side via load).
  let loaded = false;
  let bySlug: Map<string, PostFull> | null = null;
  let meta: PostMeta[] | null = null;

  function ensureLoaded(): void {
    if (loaded) return;
    const payload = readContentSnapshot(rootDir);
    meta = payload.postsMeta;
    bySlug = new Map(payload.postsFull.map((p) => [p.slug, p]));
    loaded = true;
  }

  function getAllPosts(): PostMeta[] {
    ensureLoaded();
    return meta ?? getSnapshotPostsMeta(rootDir);
  }

  function getPostBySlug(slug: string): PostFull | null {
    ensureLoaded();
    if (bySlug) return bySlug.get(slug) ?? null;
    return getSnapshotPostBySlug(slug, rootDir);
  }

  function getAllPostSlugs(): string[] {
    return getAllPosts().map((p) => p.slug);
  }

  function getFeaturedPosts(): PostMeta[] {
    return getAllPosts().filter((p) => p.featured);
  }

  return { getAllPosts, getPostBySlug, getAllPostSlugs, getFeaturedPosts };
}
