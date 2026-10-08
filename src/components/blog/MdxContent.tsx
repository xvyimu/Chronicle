import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode, { type Options } from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { remarkWikilink } from '@/lib/posts/remark-wikilink';
import CodeBlock from './CodeBlock';
import ImageZoom from './ImageZoom';

const prettyCodeOptions: Partial<Options> = {
  theme: {
    dark: 'vitesse-dark',
    light: 'vitesse-light',
  },
  keepBackground: false,
  onVisitLine(node: { children: Array<{ type: string; value?: string }> }) {
    if (node.children.length === 0) {
      node.children = [{ type: 'text', value: ' ' }];
    }
    if ('properties' in node && node.properties) {
      (node.properties as Record<string, string[]>).className = ['code-line'];
    }
  },
  // 这里原有一个 onVisitHighlightedLine：给高亮行追加 `highlighted` 类，配合
  // prose.css 的 `.code-line--highlighted` 上色。两处对不上——选择器是 `--highlighted`
  // 变体，回调加的是裸 `highlighted`——所以那套高亮从来没生效过；随后那次「删死 CSS」
  // 把 CSS 侧也删了。回调整体删除而非改名，理由有二：
  //   1. `content/**` 里没有一篇用到行高亮语法（围栏元数据带 `{1,3}`），该回调从未被调用；
  //   2. rehype-pretty-code 在调用它之前，已经无条件给高亮行加上了
  //      `data-highlighted-line` 属性。将来真要支持，直接写 `[data-highlighted-line]`
  //      选择器即可，不需要这个回调。
  // 留着它只会让下一个人以为高亮已经接线。
};

export default function MdxContent({ source }: { source: string }) {
  return (
    <div className="prose max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-code:before:content-none prose-code:after:content-none">
      <MDXRemote
        source={source}
        components={{
          pre: CodeBlock,
          img: ImageZoom,
        }}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm, remarkWikilink],
            rehypePlugins: [
              rehypeSlug,
              [rehypePrettyCode, prettyCodeOptions],
              [rehypeAutolinkHeadings, { behavior: 'wrap' }],
            ],
          },
        }}
      />
    </div>
  );
}
