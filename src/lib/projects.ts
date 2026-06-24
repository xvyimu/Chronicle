import { z } from 'zod';
import { Project } from '@/types';
import { CONTENT_DIR } from './constants';
import { getContentSource } from './content-source';
import { createCache } from './cache';

const httpsUrl = z.string().optional().refine(
  (v) => !v || /^https?:\/\//.test(v),
  'URL must start with http:// or https://'
);

const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  url: httpsUrl.optional().transform((v) => (v ? v : undefined)),
  github: httpsUrl.optional().transform((v) => (v ? v : undefined)),
  image: z.string().optional(),
  featured: z.boolean(),
  year: z.number().int().positive(),
});

export function parseProjects(raw: unknown): Project[] {
  const arr = z.array(ProjectSchema).parse(raw);
  return arr.sort((a, b) => b.year - a.year);
}

const _cache = createCache<Project[]>({ watchPath: CONTENT_DIR.projects });

export function getAllProjects(): Project[] {
  return _cache.getOrCompute(() => {
    const source = getContentSource();
    const raw = source.readFile(CONTENT_DIR.projects);
    if (raw === null) {
      console.warn(`[projects.ts] 数据文件不存在: ${CONTENT_DIR.projects}`);
      return [];
    }
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error(`[projects.ts] JSON 解析失败: ${CONTENT_DIR.projects}`, e);
      return [];
    }
    return parseProjects(data);
  });
}

export function getFeaturedProjects(): Project[] {
  return getAllProjects().filter((p) => p.featured);
}

export function getProjectById(id: string): Project | null {
  return getAllProjects().find((p) => p.id === id) ?? null;
}

export function getAllProjectIds(): string[] {
  return getAllProjects().map((p) => p.id);
}
