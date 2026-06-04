'use client'

import { PixelChimi } from './PixelChimi'

/**
 * Pantalla de carga con el chimi flotando.
 * - Hover suave arriba/abajo
 * - Sombra que crece/achica en sincronía
 * - Gotitas de salsa cayendo
 * - Glow celeste pulsante
 */
export function ChimiLoader() {
  return (
    <div className="chimi-loader-overlay">
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Partículas de salsa — salen de arriba del frasco */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
          <div className="salsa-particle" />
          <div className="salsa-particle" />
          <div className="salsa-particle" />
          <div className="salsa-particle" />
        </div>

        {/* Chimi flotando */}
        <div className="chimi-loader-art">
          <PixelChimi size={8} />
        </div>

        {/* Sombra sincronizada con el hover */}
        <div className="chimi-loader-shadow" />
      </div>

      <p className="chimi-loader-text">CARGANDO...</p>
    </div>
  )
}
