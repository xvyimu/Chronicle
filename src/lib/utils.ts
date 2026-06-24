/**
 * 标签 slug 化：转小写、空格转连字符、去除非字母数字字符
 */
export function slugifyTag(tag: string): string {
  const result = tag
    .trim()
    .toLowerCase()
    .replace(/\./g, '-')        // "Next.js" → "next-js"
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // 去除特殊字符
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return result || tag; // 防止纯特殊字符标签产生空 slug
}

/** 日期格式化：2026-06-21 → 2026年6月21日
 *  追加 T00:00:00 确保 Date 解析不因客户端时区而偏移到前一天（UTC-区域）。 */
export function formatDate(dateStr: string, locale: string = 'zh-CN'): string {
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr; // 非法日期返回原始字符串
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/** 安全获取 frontmatter 字段，缺失必填字段时在构建期直接抛错 */
export function assertRequiredFields(
  data: Record<string, unknown>,
  fields: string[],
  filePath: string
): void {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(
        `[内容校验失败] ${filePath} 缺少必填字段 "${field}"，请检查 frontmatter`
      );
    }
  }
}
