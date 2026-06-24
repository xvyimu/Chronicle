import { CONTENT_DIR } from './constants';
import { getContentSource } from './content-source';

/** 读取 about.mdx 原始内容，不存在时返回 null */
export function getAboutContent(): string | null {
  return getContentSource().readFile(CONTENT_DIR.about);
}
