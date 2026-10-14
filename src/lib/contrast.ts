/**
 * WCAG 2.1 对比度计算（纯函数，供测试断言 token 达标用）。
 *
 * 目的：`src/app/styles/tokens.css` 的颜色注释里手写了对比度数值
 * （如 `--text-dim` 对 `#fafafa` 4.77:1），但那些数字没有机器守门——
 * 改 token 值而忘了重算，注释就成了假话。这里把它变成可断言的纯函数。
 *
 * 公式（WCAG 2.1 §1.4.3）：
 *   L = 0.2126·R + 0.7152·G + 0.0722·B   （R/G/B 为线性化分量）
 *   ratio = (L_light + 0.05) / (L_dark + 0.05)
 *
 * 阈值：正文 ≥4.5:1（AA）、大字（≥18.66px 粗体或 ≥24px）≥3:1。
 */

/** sRGB 分量（0–255）线性化为相对亮度分量。 */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** 相对亮度（0=黑，1=白）。 */
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * 解析 `#rgb` / `#rrggbb` 十六进制颜色。非法输入抛错（测试里用，宁可响亮失败）。
 */
export function parseHex(hex: string): Rgb {
  const s = hex.trim().replace(/^#/, '');
  const full =
    s.length === 3
      ? s
          .split('')
          .map((c) => c + c)
          .join('')
      : s;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`parseHex: 非法的十六进制颜色 "${hex}"`);
  }
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** 两色对比度，返回值域 [1, 21]，保留 2 位小数便于断言。 */
export function contrastRatio(fg: string, bg: string): number {
  const f = parseHex(fg);
  const b = parseHex(bg);
  const lf = relativeLuminance(f.r, f.g, f.b);
  const lb = relativeLuminance(b.r, b.g, b.b);
  const lighter = Math.max(lf, lb);
  const darker = Math.min(lf, lb);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/** WCAG AA 正文阈值。 */
export const AA_NORMAL = 4.5;
/** WCAG AA 大字阈值。 */
export const AA_LARGE = 3;
