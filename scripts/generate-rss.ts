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
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { SITE_CONFIG } from '@/lib/constants';
import { filenameToSlug } from '@/lib/posts';

const POSTS_DIR = path.join(process.cwd(), 'content/blog');

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
    const { data, content } = matter(raw);

    if (data.published === false) continue;

    const slug = filenameToSlug(filename);

    feed.addItem({
      title: data.title,
      id: `${SITE_CONFIG.url}/blog/${slug}`,
      link: `${SITE_CONFIG.url}/blog/${slug}`,
      description: data.description,
      content,
      date: new Date(data.date),
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