'use client'

import { useState, useEffect } from 'react'
import { PixelChimi } from './PixelChimi'

type Phase = 'enter' | 'fly' | 'curtain' | 'done'

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase | null>(null)

  useEffect(() => {
    // Solo mostrar una vez por sesión de browser
    const key = 'sa_splash_shown'
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    setPhase('enter')
    const t1 = setTimeout(() => setPhase('fly'),     650)
    const t2 = setTimeout(() => setPhase('curtain'), 880)
    const t3 = setTimeout(() => setPhase('done'),   1500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (!phase || phase === 'done') return null

  return (
    <div className="splash-overlay" aria-hidden="true">
      {/* Cortina superior */}
      <div className={`splash-curtain-top${phase === 'curtain' ? ' open' : ''}`} />
      {/* Cortina inferior */}
      <div className={`splash-curtain-bottom${phase === 'curtain' ? ' open' : ''}`} />

      {/* Chimi que vuela */}
      <div className={`splash-chimi-wrap${phase !== 'enter' ? ' fly' : ''}`}>
        <div className="splash-chimi-art">
          <PixelChimi size={7} />
        </div>
      </div>
    </div>
  )
}
