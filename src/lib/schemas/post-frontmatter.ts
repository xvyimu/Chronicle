import { z } from 'zod';

function isIsoDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/**
 * Zod schema for post frontmatter — single source of truth.
 *
 * Consumed by:
 * - `lib/posts.ts` — validates parsed frontmatter before constructing PostFull
 * - Future: content-lint CLI scripts, type-safe MDX tooling
 *
 * Keep this module dependency-free (only `zod`) so it can be imported by
 * scripts that run outside the Next.js runtime.
 */
export const postFrontmatterSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    date: z.string().refine(isIsoDateString, 'date 必须为有效的 YYYY-MM-DD 日期'),
    updatedAt: z
      .string()
      .refine(isIsoDateString, 'updatedAt 必须为有效的 YYYY-MM-DD 日期')
      .optional(),
    tags: z.array(z.string()).optional().default([]),
    category: z.string().min(1).optional(),
    series: z.string().min(1).optional(),
    seriesOrder: z.number().int().positive().optional(),
    published: z.boolean().optional().default(true),
    featured: z.boolean().optional().default(false),
    image: z
      .string()
      .refine(
        (v) => !v || /^https?:\/\//.test(v) || v.startsWith('/'),
        'image 必须是 http(s):// URL 或 / 开头的绝对路径',
      )
      .optional(),
    source: z.string().min(1).optional(),
    license: z.string().min(1).optional(),
  })
  .strict();

/** Input shape of the schema (what authors write in MDX frontmatter). */
export type PostFrontmatterInput = z.input<typeof postFrontmatterSchema>;

/** Parsed/normalized shape (after defaults applied). */
export type PostFrontmatterParsed = z.output<typeof postFrontmatterSchema>;
