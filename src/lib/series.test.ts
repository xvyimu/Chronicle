import { describe, expect, it } from 'vitest';
import { getAllSeries, getAllSeriesSlugs, getSeriesBySlug } from './series';

describe('series', () => {
  it('aggregates posts with series metadata', () => {
    const series = getAllSeries();

    expect(series.length).toBeGreaterThan(0);
    expect(series[0]).toMatchObject({
      name: '个人服务部署路线',
      slug: '个人服务部署路线',
      count: 5,
    });
  });

  it('sorts posts by seriesOrder', () => {
    const series = getSeriesBySlug('个人服务部署路线');

    expect(series?.posts.map((post) => post.slug)).toEqual([
      'vps-initial-setup',
      'docker-deploy-guide',
      'nginx-reverse-proxy',
      'git-hooks-github-actions',
      'cicd-pipeline-design',
    ]);
  });

  it('exposes date and word count summaries', () => {
    const series = getSeriesBySlug('个人服务部署路线');

    expect(series?.startDate).toBe('2026-06-22');
    expect(series?.endDate).toBe('2026-06-25');
    expect(series?.wordCount).toBeGreaterThan(0);
  });

  it('returns null for unknown series', () => {
    expect(getSeriesBySlug('missing-series')).toBeNull();
  });

  it('returns all series slugs', () => {
    expect(getAllSeriesSlugs()).toContain('个人服务部署路线');
  });
});
