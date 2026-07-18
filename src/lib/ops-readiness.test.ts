import { describe, expect, it } from 'vitest';
import {
  EXTERNAL_SEARCH_POST_THRESHOLD,
  buildOpsTrackReports,
  blurMapHasPath,
  formatOpsStatus,
  isBlurCoverageComplete,
  type LiveOpsSnapshot,
  type LocalOpsSnapshot,
} from './ops-readiness';

const baseLocal: LocalOpsSnapshot = {
  publishedPostCount: 14,
  projectBlurCoverageOk: true,
  blogImageCount: 0,
  blogBlurCoverageOk: true,
  speedInsightsWired: true,
  robotsDeclaresSitemap: true,
  cacheComponentsEnabled: false,
  hasExternalDataIntegration: false,
};

const healthyLive: LiveOpsSnapshot = {
  baseUrl: 'https://incca.ccwu.cc',
  sitemapOk: true,
  robotsOk: true,
  robotsMentionsSitemap: true,
  homeOk: true,
  speedInsightsScriptHint: true,
  errors: [],
};

describe('ops-readiness classifiers', () => {
  it('marks GSC/Bing as blocked_auth when live surface is healthy', () => {
    const reports = buildOpsTrackReports(baseLocal, healthyLive);
    expect(reports.find((r) => r.id === 'gsc')?.status).toBe('blocked_auth');
    expect(reports.find((r) => r.id === 'bing')?.status).toBe('blocked_auth');
  });

  it('marks GSC as live_regression when sitemap fails', () => {
    const reports = buildOpsTrackReports(baseLocal, {
      ...healthyLive,
      sitemapOk: false,
      errors: ['sitemap status=500'],
    });
    expect(reports.find((r) => r.id === 'gsc')?.status).toBe('live_regression');
  });

  it('keeps external search not_triggered below threshold', () => {
    const reports = buildOpsTrackReports(baseLocal, null);
    const track = reports.find((r) => r.id === 'external-search');
    expect(track?.status).toBe('not_triggered');
    expect(track?.summary).toContain(String(EXTERNAL_SEARCH_POST_THRESHOLD));
  });

  it('flags external search when post count reaches threshold', () => {
    const reports = buildOpsTrackReports(
      { ...baseLocal, publishedPostCount: EXTERNAL_SEARCH_POST_THRESHOLD },
      null,
    );
    expect(reports.find((r) => r.id === 'external-search')?.status).toBe(
      'ready_for_auth',
    );
  });

  it('keeps blog blur not_triggered without local blog images', () => {
    const reports = buildOpsTrackReports(baseLocal, null);
    expect(reports.find((r) => r.id === 'blog-image-blur')?.status).toBe('not_triggered');
  });

  it('flags missing blog blur coverage when images exist', () => {
    const reports = buildOpsTrackReports(
      {
        ...baseLocal,
        blogImageCount: 2,
        blogBlurCoverageOk: false,
      },
      null,
    );
    expect(reports.find((r) => r.id === 'blog-image-blur')?.status).toBe(
      'live_regression',
    );
  });

  it('reports speed insights as waiting for samples when wired', () => {
    const reports = buildOpsTrackReports(baseLocal, healthyLive);
    expect(reports.find((r) => r.id === 'speed-insights')?.status).toBe(
      'engineering_ready_waiting_samples',
    );
  });

  it('keeps cache components not_triggered without external data', () => {
    const reports = buildOpsTrackReports(baseLocal, null);
    expect(reports.find((r) => r.id === 'cache-components')?.status).toBe(
      'not_triggered',
    );
  });

  it('formats statuses for CLI output', () => {
    expect(formatOpsStatus('blocked_auth')).toContain('授权');
  });

  it('checks blur map path membership', () => {
    const source = `export const IMAGE_BLUR_DATA = {
  '/images/projects/a.png': 'data:image/webp;base64,xx',
} as const;`;
    expect(blurMapHasPath(source, '/images/projects/a.png')).toBe(true);
    expect(blurMapHasPath(source, '/images/blog/b.png')).toBe(false);
    expect(isBlurCoverageComplete(source, ['/images/projects/a.png'])).toBe(true);
    expect(
      isBlurCoverageComplete(source, ['/images/projects/a.png', '/images/blog/b.png']),
    ).toBe(false);
  });
});
