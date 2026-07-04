'use client';

import { useEffect } from 'react';

/**
 * SiteBackdropParallax — 全站背景视差跟随 client 层.
 *
 * 通过 document.querySelector 找到 <SiteBackdropStage/> 渲染的 .site-backdrop__stage 节点,
 * 监听 window mousemove/mouseleave, 更新 --parallax-x/y CSS 变量驱动 stage transform.
 *
 * 设计取舍: 用 DOM 选择器而非 ref, 因 Stage 是 server component 无法跨 SSG/CSR 边界传 ref.
 * returns null: 不渲染 DOM, 仅副作用.
 *
 * 客户端 JS 体积 < 1KB gzipped.
 */
export default function SiteBackdropParallax() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const stage = document.querySelector<HTMLElement>('.site-backdrop__stage');
    if (!stage) return;

    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      stage.style.setProperty('--parallax-x', `${x * 8}px`);
      stage.style.setProperty('--parallax-y', `${y * 8}px`);
    };

    const handleLeave = () => {
      stage.style.setProperty('--parallax-x', '0px');
      stage.style.setProperty('--parallax-y', '0px');
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return null;
}
