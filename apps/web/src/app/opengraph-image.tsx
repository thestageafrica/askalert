import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AskAlert — Ask. Alert. Delivered.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: 'linear-gradient(145deg, #1d2468 0%, #0f1545 42%, #0a0f33 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 2,
            color: '#ff9a3d',
            textTransform: 'uppercase',
          }}
        >
          AskAlert
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
            Tell AskAlert what you need.
          </div>
          <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.72)', maxWidth: 820 }}>
            Verified vendors in Lagos. Compare offers. Protect your payment.
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#ff7500' }}>
          Ask. Alert. Delivered.
        </div>
      </div>
    ),
    { ...size },
  );
}
