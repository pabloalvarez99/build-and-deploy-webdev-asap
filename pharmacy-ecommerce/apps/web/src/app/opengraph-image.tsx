import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Tu Farmacia - Farmacia online en Coquimbo, Chile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #a5f3fc 100%)',
          padding: 80,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 40px rgba(8,145,178,0.35)',
            }}
          >
            <div style={{ position: 'relative', width: 56, height: 56 }}>
              <div style={{ position: 'absolute', left: 24, top: 4, width: 8, height: 48, background: 'white', borderRadius: 4 }} />
              <div style={{ position: 'absolute', left: 4, top: 24, width: 48, height: 8, background: 'white', borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: '#0e7490', letterSpacing: -2, lineHeight: 1 }}>
              <span style={{ color: '#94a3b8', fontWeight: 700 }}>tu</span>farmacia
            </div>
            <div style={{ fontSize: 22, color: '#0891b2', fontWeight: 600, marginTop: 8 }}>
              Coquimbo · Chile
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.1,
            maxWidth: 980,
            marginTop: 'auto',
          }}
        >
          Medicamentos, vitaminas y salud con despacho a todo Chile
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 32,
            flexWrap: 'wrap',
          }}
        >
          {['Webpay', 'Retiro en tienda', 'Despacho', 'Cotización gratuita'].map((tag) => (
            <div
              key={tag}
              style={{
                padding: '12px 24px',
                background: 'white',
                border: '2px solid #67e8f9',
                borderRadius: 16,
                fontSize: 24,
                fontWeight: 700,
                color: '#0e7490',
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 30,
            right: 80,
            fontSize: 22,
            fontWeight: 700,
            color: '#0e7490',
          }}
        >
          tu-farmacia.cl
        </div>
      </div>
    ),
    { ...size },
  );
}
