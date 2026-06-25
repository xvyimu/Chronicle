/**
 * RSS Feed 生成脚本
 * 在 next build 前运行：tsx scripts/generate-rss.ts
 *
 * 常量来源：@/lib/constants
 * slug 提取：@/lib/posts (filenameToSlug)
 */

import fs from 'fs';
import path from 'path';
import { Feed } from 'feed';
import { parseFrontmatter } from '@/lib/parse-frontmatter';
import readingTime from 'reading-time';
import { z } from 'zod';
import { SITE_CONFIG } from '@/lib/constants';
import { filenameToSlug } from '@/lib/posts';

const POSTS_DIR = path.join(process.cwd(), 'content/blog');

/** Frontmatter schema — mirrors posts.ts validation for RSS generation */
const rssFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date 必须为 YYYY-MM-DD 格式'),
  published: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
});

function generateRss() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.warn('[RSS] content/blog 目录不存在，跳过');
    return;
  }

  const feed = new Feed({
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    id: SITE_CONFIG.url,
    link: SITE_CONFIG.url,
    language: 'zh-CN',
    updated: new Date(),
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    author: { name: SITE_CONFIG.author.name, link: SITE_CONFIG.url },
  });

  const filenames = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .sort()
    .reverse()
    .slice(0, 20);

  for (const filename of filenames) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
    const { data, content } = parseFrontmatter(raw);

    // Validate frontmatter before use — prevents Invalid Date / undefined title
    const parsed = rssFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      console.warn(`[RSS] 跳过 ${filename}: ${issues}`);
      continue;
    }
    const fm = parsed.data;

    if (fm.published === false) continue;

    const slug = filenameToSlug(filename);

    feed.addItem({
      title: fm.title,
      id: `${SITE_CONFIG.url}/blog/${slug}`,
      link: `${SITE_CONFIG.url}/blog/${slug}`,
      description: fm.description,
      content,
      date: new Date(fm.date),
      // Custom extension: reading time as a JSON feed extension
      extensions: [
        {
          name: '_reading_time',
          objects: { readingTime: readingTime(content).text },
        },
      ],
    });
  }

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(path.join(publicDir, 'feed.xml'), feed.rss2());
  fs.writeFileSync(path.join(publicDir, 'feed.json'), feed.json1());
  console.log('[RSS] feed.xml + feed.json 已生成');
}

generateRss();