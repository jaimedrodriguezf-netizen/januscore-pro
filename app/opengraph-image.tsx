import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'JanusCore Technologies | AI Engineering & B2B Software Products';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#020617',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.25) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)',
          padding: '60px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
        }}
      >
        {/* Top Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 900,
              color: '#ffffff',
            }}
          >
            J
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              JanusCore Technologies
            </span>
            <span style={{ fontSize: '14px', color: '#818cf8', fontWeight: 600 }}>
              AI Engineering & Enterprise Automation Studio
            </span>
          </div>
        </div>

        {/* Center Main Title & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              margin: 0,
              color: '#ffffff',
            }}
          >
            Ingeniería de Inteligencia Artificial & Software B2B de Misión Crítica
          </h1>
          <p
            style={{
              fontSize: '22px',
              color: '#94a3b8',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Plataformas listas para producción: JanusCore Verify (Ed25519) • DentiApp (MSP 033) • Kattxo (SRI) • Tenddy Shop.
          </p>
        </div>

        {/* Bottom Feature Badges & Contact */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(51, 65, 85, 0.8)',
            paddingTop: '24px',
          }}
        >
          <div style={{ display: 'flex', gap: '24px', fontSize: '15px', color: '#cbd5e1' }}>
            <span>🛡️ Firmas Criptográficas Ed25519</span>
            <span>⚡ Supabase RLS</span>
            <span>🧠 Model Context Protocol (MCP)</span>
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#34d399',
            }}
          >
            januscore.pro
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
