'use client';

/**
 * DarkModeScript — 首屏暗色主题闪烁防护。
 *
 * 从 layout.tsx 的 inline <script nonce> 迁移而来。
 * 作为客户端组件，React SSR 时会将 <script> 输出到 HTML，
 * 在解析阶段即执行，阻止 FOUC。
 *
 * 此组件移除了对 headers() nonce 的依赖，使 root layout
 * 不再需要 dynamic render — 所有页面恢复 SSG 静态生成，
 * content/blog 目录在 build 时可读，Vercel 部署时有数据。
 *
 * 安全性：此脚本仅读取 localStorage 并 toggle class，
 * 不处理任何外部输入，无 XSS 注入风险。
 */
export default function DarkModeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
      }}
    />
  );
}
