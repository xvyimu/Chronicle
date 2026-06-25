/**
 * safeLocalStorage — 安全的 localStorage 访问封装。
 *
 * 在隐私浏览模式、存储配额超限或 SSR 环境下，
 * 直接调用 localStorage 会抛出异常导致组件崩溃。
 * 此封装统一捕获异常，异常时返回 null / 静默失败。
 *
 * 仅在客户端组件（'use client'）的 useEffect 内使用。
 */

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // 静默失败：隐私模式或配额超限
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // 静默失败
    }
  },
};
