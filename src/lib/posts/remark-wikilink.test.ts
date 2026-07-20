import { describe, it, expect } from 'vitest';
import type { Root, Link, Text, Paragraph } from 'mdast';
import { visit } from 'unist-util-visit';
import { remarkWikilink } from './remark-wikilink';

function paragraphWithText(value: string): Root {
  return {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', value }],
      },
    ],
  };
}

function applyWikilink(tree: Root): void {
  // unified attaches `this`; plugin is factory → tree transformer (one level)
  const transformer = (remarkWikilink as unknown as () => (tree: Root) => void).call(
    undefined,
  );
  expect(typeof transformer).toBe('function');
  transformer(tree);
}

function collectLinks(tree: Root): Array<{ url: string; text: string }> {
  const links: Array<{ url: string; text: string }> = [];
  visit(tree, 'link', (node: Link) => {
    const text = (node.children as Text[])
      .filter((c) => c.type === 'text')
      .map((c) => c.value)
      .join('');
    links.push({ url: node.url, text });
  });
  return links;
}

describe('remarkWikilink transform', () => {
  it('is a one-level unified plugin (factory returns tree transformer, not another factory)', () => {
    const transformer = (remarkWikilink as unknown as () => unknown).call(undefined);
    expect(typeof transformer).toBe('function');
    // Nested factory would return a function that still expects to be invoked to get the visitor
    const maybeNested = (transformer as (tree?: Root) => unknown)(paragraphWithText('x'));
    // Real transformer returns void/undefined when given a tree — not another function
    expect(typeof maybeNested).not.toBe('function');
  });

  it('turns [[slug]] into /blog/{slug} link', () => {
    const tree = paragraphWithText('See [[docker-deploy-guide]] for deploy.');
    applyWikilink(tree);
    expect(collectLinks(tree)).toEqual([
      { url: '/blog/docker-deploy-guide', text: 'docker-deploy-guide' },
    ]);
    const para = tree.children[0] as Paragraph;
    expect(para.children.some((c) => c.type === 'link')).toBe(true);
  });

  it('turns [[slug|label]] into labeled link', () => {
    const tree = paragraphWithText('Read [[nginx-reverse-proxy|Nginx 反代]].');
    applyWikilink(tree);
    expect(collectLinks(tree)).toEqual([
      { url: '/blog/nginx-reverse-proxy', text: 'Nginx 反代' },
    ]);
  });

  it('does not create links for text without wikilinks', () => {
    const tree = paragraphWithText('No brackets here.');
    applyWikilink(tree);
    expect(collectLinks(tree)).toEqual([]);
  });
});
