import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  contrastRatio,
  parseHex,
  relativeLuminance,
  AA_NORMAL,
  AA_LARGE,
} from '@/lib/contrast';

const here = dirname(fileURLToPath(import.meta.url));
const TOKENS_CSS = resolve(here, '../app/styles/tokens.css');

/**
 * 从 tokens.css 里按主题块提取 token 颜色值。
 *
 * 这样断言的是**文件里的实际值**，而不是测试里复制的副本——
 * 改了 CSS 颜色，测试立刻用新值判断；跌破 AA 就红。
 * 这是把 tokens.css 注释里手算的对比度数值（无守门）变成机器断言。
 */
function extractTokens(css: string, block: ':root' | '.dark'): Record<string, string> {
  const start = css.indexOf(`${block} {`);
  if (start === -1) throw new Error(`tokens.css 找不到 ${block} 块`);
  const end = css.indexOf('}', start);
  const body = css.slice(start, end);
  const out: Record<string, string> = {};
  const re = /--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) out[m[1]] = m[2];
  return out;
}

const css = readFileSync(TOKENS_CSS, 'utf8');
const light = extractTokens(css, ':root');
const dark = extractTokens(css, '.dark');

describe('contrast 纯函数', () => {
  it('黑白对比度为 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
  });

  it('同色对比度为 1:1', () => {
    expect(contrastRatio('#3f58dd', '#3f58dd')).toBe(1);
  });

  it('参数顺序无关（取亮/暗比）', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(contrastRatio('#ffffff', '#000000'));
  });

  it('支持 #rgb 简写', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('非法颜色响亮失败，不静默返回', () => {
    expect(() => parseHex('#xyz')).toThrow();
    expect(() => parseHex('red')).toThrow();
  });

  it('相对亮度：白=1、黑=0', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 5);
    expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0, 5);
  });
});

describe('tokens.css 浅色主题对比度达 AA', () => {
  // 正文/辅助文字用小字号，须 ≥4.5:1；品牌色作文字用途同样 ≥4.5:1。
  const pairs: Array<[string, string, string]> = [
    ['text', 'bg', '正文 / 页面背景'],
    ['text', 'surface', '正文 / 主面板'],
    ['text-soft', 'bg', '二级文字 / 页面背景'],
    ['text-dim', 'bg', '辅助文字 / 页面背景'],
    ['text-dim', 'bg-soft', '辅助文字 / 面板底'],
    ['brand', 'bg', '品牌色 / 页面背景'],
    ['brand', 'bg-soft', '品牌色 / 面板底'],
  ];

  for (const [fg, bg, label] of pairs) {
    it(`${label}（--${fg} / --${bg}）≥ ${AA_NORMAL}:1`, () => {
      expect(light[fg], `tokens.css 缺 --${fg}`).toBeDefined();
      expect(light[bg], `tokens.css 缺 --${bg}`).toBeDefined();
      expect(contrastRatio(light[fg], light[bg])).toBeGreaterThanOrEqual(AA_NORMAL);
    });
  }
});

describe('tokens.css 深色主题对比度达 AA', () => {
  // 辅助文字须同时覆盖 surface / bg-elevated / surface-hover 三档背景（见 tokens.css 注释）。
  const pairs: Array<[string, string, string]> = [
    ['text', 'bg', '正文 / 页面背景'],
    ['text', 'surface', '正文 / 主面板'],
    ['text-soft', 'bg', '二级文字 / 页面背景'],
    ['text-dim', 'surface', '辅助文字 / 主面板'],
    ['text-dim', 'bg-elevated', '辅助文字 / 抬升面'],
    ['text-dim', 'surface-hover', '辅助文字 / 悬停面'],
    ['brand', 'bg', '品牌色 / 页面背景'],
    ['brand', 'surface', '品牌色 / 主面板'],
  ];

  for (const [fg, bg, label] of pairs) {
    it(`${label}（--${fg} / --${bg}）≥ ${AA_NORMAL}:1`, () => {
      expect(dark[fg], `tokens.css 缺 --${fg}`).toBeDefined();
      expect(dark[bg], `tokens.css 缺 --${bg}`).toBeDefined();
      expect(contrastRatio(dark[fg], dark[bg])).toBeGreaterThanOrEqual(AA_NORMAL);
    });
  }
});

describe('AA_LARGE 阈值常量', () => {
  it('大字阈值是 3:1', () => {
    expect(AA_LARGE).toBe(3);
  });
});
