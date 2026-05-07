import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
        }}
      >
        <div style={{ position: 'relative', width: 104, height: 104 }}>
          <div style={{ position: 'absolute', left: 44, top: 8, width: 16, height: 88, background: 'white', borderRadius: 8 }} />
          <div style={{ position: 'absolute', left: 8, top: 44, width: 88, height: 16, background: 'white', borderRadius: 8 }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
