/**
 * Post frontmatter schema - re-export from the shared schema module.
 *
 * Schema 定义在 src/lib/schemas/post-frontmatter.ts (dependency-free, only zod),
 * 此文件提供 posts/ 模块下的统一入口.
 */
export {
  postFrontmatterSchema,
  type PostFrontmatterInput,
  type PostFrontmatterParsed,
} from '@/lib/schemas/post-frontmatter';
