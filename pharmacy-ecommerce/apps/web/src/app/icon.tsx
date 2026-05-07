import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
          borderRadius: 32,
        }}
      >
        <div style={{ position: 'relative', width: 112, height: 112 }}>
          <div style={{ position: 'absolute', left: 48, top: 8, width: 16, height: 96, background: 'white', borderRadius: 8 }} />
          <div style={{ position: 'absolute', left: 8, top: 48, width: 96, height: 16, background: 'white', borderRadius: 8 }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
