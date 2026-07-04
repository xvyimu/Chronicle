/**
 * category-rules-data.ts — 标签→分类映射数据
 *
 * 纯数据, 无逻辑。消费方: category-rules.ts / categories.ts。
 */

export const TAG_TO_CATEGORY: Record<string, string> = {
  // 前端开发
  'Next.js': '前端开发',
  React: '前端开发',
  TypeScript: '前端开发',
  前端: '前端开发',
  全栈: '前端开发',
  类型系统: '前端开发',
  性能优化: '前端开发',
  'Core Web Vitals': '前端开发',
  Lighthouse: '前端开发',
  // 后端开发
  'Node.js': '后端开发',
  Go: '后端开发',
  后端: '后端开发',
  CLI: '后端开发',
  工具: '后端开发',
  // 数据库
  PostgreSQL: '数据库',
  Redis: '数据库',
  数据库: '数据库',
  缓存: '数据库',
  Supabase: '数据库',
  // DevOps
  Docker: 'DevOps',
  部署: 'DevOps',
  容器: 'DevOps',
  Nginx: 'DevOps',
  Linux: 'DevOps',
  运维: 'DevOps',
  VPS: 'DevOps',
  安全: 'DevOps',
  监控: 'DevOps',
  // CI/CD
  'CI/CD': 'CI/CD',
  'GitHub Actions': 'CI/CD',
  Git: 'CI/CD',
  DevOps: 'CI/CD',
  自动化: 'CI/CD',
  // 云服务
  Cloudflare: '云服务',
  Workers: '云服务',
  Serverless: '云服务',
  无服务器: '云服务',
};
