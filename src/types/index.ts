export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;          // YYYY-MM-DD
  updatedAt?: string;    // YYYY-MM-DD
  tags: string[];
  category?: string;
  series?: string;
  seriesOrder?: number;
  published: boolean;
  featured: boolean;
  image?: string;
  source?: string;       // URL or description of the source material
  license?: string;      // License type (e.g. "MIT", "CC-BY-4.0", "Original")
}

export interface PostMeta extends PostFrontmatter {
  slug: string;
  readingTime: string;   // 由 reading-time 计算，如 "5 min read"
  wordCount: number;     // 字数（中文按字符计，英文按单词计）
  excerpt: string;
  headings: string[];
  searchText: string;
}

export interface PostFull extends PostMeta {
  content: string;       // 原始 MDX 正文（不含 frontmatter）
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url?: string;
  github?: string;
  image?: string;
  featured: boolean;
  year: number;
}

export interface TagInfo {
  tag: string;   // 原始展示名，如 "Next.js"
  slug: string;  // URL slug，如 "next-js"
  count: number;
}

export interface CategoryInfo {
  name: string;     // 分类名，如 "前端开发"
  slug: string;     // URL slug，如 "前端开发"
  count: number;    // 文章数
  tags: string[];   // 该分类包含的标签列表
}
