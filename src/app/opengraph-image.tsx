import { ImageResponse } from 'next/og'

export const alt = 'Prode Sabor Argento — Mundial 2026'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    <div style={{
      width: 1200, height: 630,
      background: '#74ACDF',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Rayas de fondo */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 30px)',
      }} />
      {/* Franja bandera abajo */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 12, display: 'flex',
      }}>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} />
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.4)' }} />
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} />
      </div>

      {/* Estrellas */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {['★', '★', '★'].map((s, i) => (
          <span key={i} style={{ fontSize: 40, color: '#F6B40E', filter: 'drop-shadow(0 2px 8px rgba(246,180,14,0.8))' }}>{s}</span>
        ))}
      </div>

      {/* Título */}
      <div style={{ fontSize: 100, fontWeight: 900, color: 'white', lineHeight: 0.9,
        textShadow: '4px 6px 0 rgba(0,0,0,0.4)', letterSpacing: '-2px', display: 'flex' }}>
        SIN CHIMI
      </div>
      <div style={{ fontSize: 100, fontWeight: 900, color: 'white', lineHeight: 0.9,
        textShadow: '4px 6px 0 rgba(0,0,0,0.4)', display: 'flex' }}>
        NO HAY
      </div>
      <div style={{ fontSize: 100, fontWeight: 900, color: '#F6B40E', lineHeight: 0.9, marginBottom: 24,
        textShadow: '4px 6px 0 rgba(0,0,0,0.5)', display: 'flex' }}>
        MUNDIAL.
      </div>

      {/* Badge */}
      <div style={{
        background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: 18,
        padding: '8px 24px', letterSpacing: 3, display: 'flex',
        border: '1px solid rgba(255,255,255,0.2)',
      }}>
        PRODE SABOR ARGENTO · MUNDIAL 2026
      </div>
    </div>
  )
}
