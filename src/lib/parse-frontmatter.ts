import { load as yamlLoad } from 'js-yaml';

export interface ParsedFrontmatter {
  data: Record<string, unknown>;
  content: string;
}

const OPEN_DELIM = '---';
const CLOSE_DELIM = '\n---';

/**
 * 解析 MDX frontmatter，对齐 gray-matter 的最小行为子集。
 *
 * 仅识别 `---` 分隔符，不支持 `;;;` / 自定义分隔符 / language 声明 / excerpt / sections
 * ——本项目所有 mdx 文件均使用标准 YAML frontmatter，无需这些能力。
 *
 * 行为对齐点：
 * - 剥离 BOM
 * - 开头不是 `---` → 视为无 frontmatter
 * - `---` 后紧跟 `-`（如 markdown 的 `----` 水平线）→ 视为无 frontmatter
 * - 无闭合 `\n---` → 视为无 frontmatter
 * - content 剥掉首个换行（`\r\n` / `\n` / 单独 `\r`），与 gray-matter 一致
 * - YAML 解析结果为非普通对象（纯标量 / 数组 / null）→ data 为空对象
 *
 * 安全性：使用 js-yaml 4.x 的 `load`，默认采用 DEFAULT_SAFE_SCHEMA，
 * 等价于 gray-matter 使用的已废弃 `safeLoad`，且不受 GHSA-h67p-54hq-rp68 影响。
 */
export function parseFrontmatter(raw: string): ParsedFrontmatter {
  // Strip BOM (gray-matter uses strip-bom-string)
  const str = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;

  // Must start with opening delimiter `---`
  if (!str.startsWith(OPEN_DELIM)) {
    return { data: {}, content: str };
  }

  // `---` immediately followed by another `-` (e.g. `----`) is not frontmatter
  if (str.charAt(OPEN_DELIM.length) === '-') {
    return { data: {}, content: str };
  }

  // Strip opening delimiter
  const body = str.slice(OPEN_DELIM.length);

  // Find closing delimiter `\n---`
  const closeIndex = body.indexOf(CLOSE_DELIM);
  if (closeIndex === -1) {
    return { data: {}, content: str };
  }

  const matterBlock = body.slice(0, closeIndex);
  let content = body.slice(closeIndex + CLOSE_DELIM.length);

  // Strip exactly one leading newline (`\r\n` / `\n` / lone `\r`) — matches gray-matter
  if (content.charCodeAt(0) === 0x000d /* \r */) {
    content = content.slice(1);
  }
  if (content.charCodeAt(0) === 0x000a /* \n */) {
    content = content.slice(1);
  }

  const parsed = yamlLoad(matterBlock);
  const data =
    parsed !== null &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};

  return { data, content };
}
