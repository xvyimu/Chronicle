export const SITE_CONFIG = {
  name: '西江月',
  description: '云原生 · 全栈 · 自动化',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  author: {
    name: '雨天狂奔',
  },
  social: {
    github: 'https://github.com/yuanjia1314',
    twitter: '',
    email: '',
  },
  giscus: {
    repo: process.env.NEXT_PUBLIC_GISCUS_REPO ?? 'yuanjia1314/blog',
    repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID ?? 'R_kgDOTBAmxA',
    category: 'Announcements',
    categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID ?? 'DIC_kwDOTBAmxM4C_mwW',
    mapping: 'pathname' as const,
    reactionsEnabled: '1',
    inputPosition: 'bottom' as const,
    lang: 'zh-CN',
  },
} as const;

export const CONTENT_DIR = {
  blog: 'content/blog',
  about: 'content/about.mdx',
  projects: 'data/projects.json',
} as const;

export const PAGE_SIZE = 12; // 博客列表每页文章数
