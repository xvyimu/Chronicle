/**
 * DarkModeScript — 首屏暗色主题闪烁防护。
 *
 * React SSR 时会将 <script> 输出到 HTML，在解析阶段即执行，阻止 FOUC。
 * 生产环境由 proxy.ts 生成 CSP nonce，RootLayout 传入此组件。
 *
 * 安全性：此脚本仅读取 localStorage 并 toggle class，
 * 不处理任何外部输入，无 XSS 注入风险。
 *
 * 历史：原先还执行 `r.classList.add('js')`，配合 `.js .reveal-on-scroll{...}`
 * 做「无 JS 时内容默认可见、有 JS 时才播入场动画」的渐进增强。reveal 系列
 * 零引用，已随 2026-10-08 的死 CSS 清理一并删除，`.js` 便成了没有任何选择器
 * 消费的空标记——故在此移除，免得后来者以为它还有用。
 */
export default function DarkModeScript({ nonce }: { nonce?: string }) {
  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var r=document.documentElement;var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){r.classList.add('dark')}var f=localStorage.getItem('reading-font-size'),w=localStorage.getItem('reading-width'),fm={sm:'0.92rem',md:'1rem',lg:'1.12rem'},wm={narrow:'640px',normal:'720px',wide:'840px'};if(fm[f])r.style.setProperty('--reading-font-size',fm[f]);if(wm[w])r.style.setProperty('--reading-width',wm[w])}catch(e){}})()`,
      }}
    />
  );
}
