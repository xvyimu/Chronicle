import type { Plugin } from 'unified';
import type { Root, PhrasingContent } from 'mdast';
import { visit } from 'unist-util-visit';
import { extractWikilinks, wikilinkHref } from './wikilink';

/**
 * remark plugin: turn `[[slug]]` / `[[slug|label]]` in text nodes into link nodes.
 *
 * 2026-10-06 Iteration 07：恢复。文章正文大量使用该语法（20 篇 / 131 处），
 * 无插件时会以字面量 `[[...]]` 显示给读者。
 * 仅做「语法 → 链接」转换，不做存在性校验（原 fail-closed 校验属已删的 link-graph）。
 * code / inlineCode 持有 value 而非 text 子节点 —— visit('text') 不会误入。
 *
 * Shape must be factory → (tree) => void (one level). Double nesting is ignored by unified.
 */
export const remarkWikilink: Plugin<[], Root> = function remarkWikilink() {
  return (tree: Root) => {
    visit(tree, 'text', (node, index, parent) => {
      if (parent == null || index == null) return;

      const value = node.value;
      if (!value.includes('[[')) return;

      const matches = extractWikilinks(value);
      if (matches.length === 0) return;

      const children: PhrasingContent[] = [];
      let cursor = 0;

      for (const match of matches) {
        const start = value.indexOf(match.raw, cursor);
        if (start === -1) continue;
        if (start > cursor) {
          children.push({ type: 'text', value: value.slice(cursor, start) });
        }
        children.push({
          type: 'link',
          url: wikilinkHref(match.slug),
          children: [{ type: 'text', value: match.label }],
        });
        cursor = start + match.raw.length;
      }

      if (cursor < value.length) {
        children.push({ type: 'text', value: value.slice(cursor) });
      }

      if (children.length === 0) return;

      const parentChildren = parent.children as PhrasingContent[];
      parentChildren.splice(index, 1, ...children);
      return index + children.length;
    });
  };
};
