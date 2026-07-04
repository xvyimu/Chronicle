/**
 * SiteBackdropStage — 全站背景装饰元素静态 DOM 层.
 *
 * 纯 server component (无 'use client'), SSG 时随 HTML 发送.
 * 装饰元素: 纸张横带 × 2 + 网格圈 + 标记块 × 2.
 * 视觉基底 (纸张渐变 + 细点阵) 由 body::before/after 提供 (见 backdrop.css).
 * 视差跟随由 <SiteBackdropParallax/> 通过 CSS 变量驱动 transform.
 */
export default function SiteBackdropStage() {
  return (
    <div className="site-backdrop__stage" aria-hidden="true">
      <div className="site-backdrop__plane site-backdrop__plane--back" />
      <div className="site-backdrop__plane site-backdrop__plane--front" />
      <div className="site-backdrop__mesh" />
      <div className="site-backdrop__code site-backdrop__code--one">pnpm test</div>
      <div className="site-backdrop__code site-backdrop__code--two">deploy --quiet</div>
    </div>
  );
}
