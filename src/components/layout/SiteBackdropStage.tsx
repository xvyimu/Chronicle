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
    <div
      className="site-backdrop__stage"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        className="site-backdrop__plane site-backdrop__plane--back"
        style={{
          position: 'absolute',
          top: 132,
          left: '-10%',
          width: '120%',
          height: 112,
          transform: 'rotate(-2deg)',
        }}
      />
      <div
        className="site-backdrop__plane site-backdrop__plane--front"
        style={{
          position: 'absolute',
          top: 232,
          left: '-10%',
          width: '120%',
          height: 88,
          transform: 'rotate(1.4deg)',
        }}
      />
      <div
        className="site-backdrop__mesh"
        style={{
          position: 'absolute',
          right: -140,
          bottom: -180,
          width: 620,
          height: 620,
          border: '1px solid var(--border, transparent)',
          borderRadius: '50%',
          opacity: 0.38,
          transform: 'rotate(8deg)',
        }}
      />
      <div
        className="site-backdrop__code site-backdrop__code--one"
        style={{ position: 'absolute', top: 104, right: '12%' }}
      >
        pnpm test
      </div>
      <div
        className="site-backdrop__code site-backdrop__code--two"
        style={{ position: 'absolute', right: '32%', bottom: 268 }}
      >
        deploy --quiet
      </div>
    </div>
  );
}
