import { ImageResponse } from 'next/og';
import { SITE_CONFIG } from '@/lib/constants';

export const alt = SITE_CONFIG.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#0f0f1a',
          color: '#e4e4f0',
          padding: '80px',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, color: '#818cf8', marginBottom: 20 }}>
          {SITE_CONFIG.name}
        </div>
        <div style={{ fontSize: 32, color: '#8e8ea0' }}>
          {SITE_CONFIG.description}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 40,
            padding: '8px 24px',
            borderRadius: 12,
            background: 'rgba(129,140,248,0.15)',
            color: '#818cf8',
            fontSize: 24,
          }}
        >
          {SITE_CONFIG.social.github ? 'github.com/' + SITE_CONFIG.social.github.split('/').pop() : '云原生 · 全栈 · 自动化'}
        </div>
      </div>
    ),
    { ...size }
  );
}
