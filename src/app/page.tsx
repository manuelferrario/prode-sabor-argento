'use client'
import Link from 'next/link'
import { PixelChimi } from '@/components/PixelChimi'
import { PixelSprite, getRandomSprites, SSR_SPRITES, type FlyingConfig } from '@/components/PixelSprites'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SplashScreen } from '@/components/SplashScreen'

const PRIZES = [
  {
    rank: '1°',
    medal: '🥇',
    color: 'var(--dorado)',
    border: 'rgba(246,180,14,0.4)',
    bg: 'rgba(246,180,14,0.07)',
    items: ['Camiseta oficial Argentina', 'Tabla de madera', 'Chapa parrillera', '5 Chimis Sabor Argento'],
  },
  {
    rank: '2°',
    medal: '🥈',
    color: '#c0c0c0',
    border: 'rgba(192,192,192,0.3)',
    bg: 'rgba(192,192,192,0.05)',
    items: ['Tabla de madera', '4 Chimis Sabor Argento'],
  },
  {
    rank: '3°',
    medal: '🥉',
    color: '#cd7f32',
    border: 'rgba(205,127,50,0.3)',
    bg: 'rgba(205,127,50,0.05)',
    items: ['5 Chimis Sabor Argento'],
  },
]

// Fotos del 1° premio — nombres de archivo en /public/premios/
// Actualizá esta lista cuando subas las fotos reales
const PRIZE_PHOTOS: { src: string; label: string }[] = [
  { src: '/remera-messi.jpeg',      label: 'Camiseta Argentina' },
  { src: '/tabla-de-madera.jpeg',   label: 'Tabla de madera' },
  { src: '/chapa-parrillera.jpeg',  label: 'Chapa parrillera' },
  { src: '/5-chimis.jpeg',          label: '5 Chimis Sabor Argento' },
]

function PrizePodium({ prizes }: { prizes: typeof PRIZES }) {
  return (
    <div className="max-w-lg mx-auto">

      {/* Galería horizontal — full bleed, snap scroll */}
      <div className="relative mb-8" style={{ marginLeft: '-1.25rem', marginRight: '-1.25rem' }}>
        <div
          className="flex gap-3 overflow-x-auto"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            paddingLeft: '1.25rem',
            paddingRight: '3rem',  /* espacio para que se vea el borde de la 2da foto */
          }}
        >
          {PRIZE_PHOTOS.map(({ src, label }) => (
            <div
              key={label}
              className="flex-shrink-0 overflow-hidden"
              style={{
                width: '68vw',
                maxWidth: '260px',
                scrollSnapAlign: 'start',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#141414',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={label}
                style={{ width: '100%', height: '185px', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  const el = e.currentTarget.parentElement!
                  e.currentTarget.style.display = 'none'
                  if (!el.querySelector('.ph')) {
                    el.innerHTML = `<div class="ph" style="height:185px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(255,255,255,0.03)"><span style="font-size:32px">📸</span><span style="color:rgba(255,255,255,0.25);font-size:10px;font-family:var(--font-body)">${label}</span></div>`
                  }
                }}
              />
              <div style={{ padding: '10px 13px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-brand text-white" style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.2 }}>
                  {label}
                </p>
                <p className="font-pixel text-white/25 mt-0.5" style={{ fontSize: '7px', letterSpacing: '1px' }}>
                  1° PREMIO
                </p>
              </div>
            </div>
          ))}
        </div>
        {/* Fade derecho — hint de scroll */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-16"
          style={{ background: 'linear-gradient(to left, #0a0a0a 20%, transparent 100%)' }}
        />
      </div>

      {/* Podio de premios — lista limpia con chips */}
      <div>
        {prizes.map(({ rank, medal, color, border, bg, items }, i) => (
          <div
            key={rank}
            className="flex items-start gap-4 py-4 px-4"
            style={{
              background: i === 0 ? bg : 'transparent',
              borderLeft: `3px solid ${border}`,
              borderBottom: i < prizes.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}
          >
            {/* Medalla + puesto */}
            <div className="flex-shrink-0 text-center" style={{ width: '38px' }}>
              <div style={{ fontSize: '24px', lineHeight: 1.1 }}>{medal}</div>
              <div className="font-brand" style={{ fontSize: '22px', fontWeight: 900, color, lineHeight: 1 }}>{rank}</div>
            </div>

            {/* Items como chips */}
            <div className="flex-1 flex flex-wrap gap-1.5 pt-1">
              {items.map(item => (
                <span
                  key={item}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.11)',
                    borderRadius: '4px',
                    color: 'rgba(255,255,255,0.82)',
                    fontSize: '13px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    padding: '4px 9px',
                    lineHeight: 1.4,
                    display: 'inline-block',
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  // SSR: sprites fijos variados. Client: reemplaza con random en cada visita.
  const [sprites, setSprites] = useState<FlyingConfig[]>(SSR_SPRITES)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [participantCount, setParticipantCount] = useState<number | null>(null)

  useEffect(() => { setSprites(getRandomSprites()) }, [])

  useEffect(() => {
    createClient()
      .from('participants')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => { if (count !== null) setParticipantCount(count) })
  }, [])

  // Detecta sesión activa para cambiar el CTA (sin redirigir, para no romper la navegación)
  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) setIsLoggedIn(true)
    })
  }, [])

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <SplashScreen />

      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--negro)' }}
      >
        <div className="flex items-center gap-2">
          <PixelChimi size={3} />
          <span className="font-brand text-white tracking-wide" style={{ fontSize: '20px', fontWeight: 900 }}>
            SABOR ARGENTO
          </span>
        </div>
        <Link href="/ranking" className="font-pixel text-white/50 hover:text-white transition-colors" style={{ fontSize: '9px' }}>
          RANKING
        </Link>
      </header>

      {/* HERO */}
      <section
        className="relative flex flex-col items-center justify-center px-4 pt-14 pb-10 text-center overflow-hidden hero-gradient"
      >
        {/* Rayas de fondo */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 32px)'
        }} />
        {/* Círculo de luz */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        {/* Sprites voladores — capa outer maneja X, capa inner maneja hover */}
        <div className="chimi-container">
          {sprites.map((s, i) => (
            <div
              key={i}
              className="flying-sprite"
              style={{
                top: s.top,
                animation: `${s.animName} ${s.duration} linear ${s.delay} infinite`,
              }}
            >
              {/* Inner: hover deflect SIN tocar el translateX del padre */}
              <div className="flying-sprite-inner">
                <PixelSprite type={s.type} size={s.size} />
              </div>
            </div>
          ))}
        </div>

        {/* Wrapper: todo el texto del hero con z-index 2 para quedar SOBRE los sprites */}
        <div className="relative flex flex-col items-center text-center" style={{ zIndex: 2 }}>

        {/* 3 estrellas */}
        <div className="flex gap-4 mb-4">
          {[0,1,2].map(i => (
            <span key={i} className={`text-3xl anim-star-${i+1}`}
              style={{ color: 'var(--dorado)', filter: 'drop-shadow(0 2px 8px rgba(246,180,14,0.8))' }}>
              ★
            </span>
          ))}
        </div>

        {/* Título hero */}
        <h1 className="relative font-brand text-white leading-[0.88] anim-hero-1"
          style={{ fontSize: 'clamp(72px, 22vw, 140px)', fontWeight: 900,
            textShadow: '3px 5px 0 rgba(0,0,0,0.45), 0 0 60px rgba(0,0,0,0.25)' }}>
          SIN CHIMI
        </h1>
        <h2 className="relative font-brand text-white leading-[0.88] anim-hero-2"
          style={{ fontSize: 'clamp(72px, 22vw, 140px)', fontWeight: 900,
            textShadow: '3px 5px 0 rgba(0,0,0,0.45)' }}>
          NO HAY
        </h2>
        <h3 className="relative font-brand leading-[0.88] mb-5 anim-hero-3"
          style={{ fontSize: 'clamp(72px, 22vw, 140px)', fontWeight: 900,
            color: 'var(--dorado)',
            textShadow: '3px 5px 0 rgba(0,0,0,0.5), 0 0 40px rgba(246,180,14,0.35)' }}>
          MUNDIAL.
        </h3>

        {/* Badge pixel */}
        <div className="relative font-pixel text-white/80 mb-2 px-4 py-2 anim-hero-badge"
          style={{ background: 'rgba(0,0,0,0.3)', fontSize: '9px', letterSpacing: '2px',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '2px' }}>
          PRODE OFICIAL · MUNDIAL 2026
        </div>

        {/* CTA con glow animado — cambia si ya hay sesión */}
        {isLoggedIn ? (
          <Link href="/prode"
            className="relative font-brand text-white anim-hero-cta btn-cta-glow active:scale-95 hover:opacity-95 transition-all"
            style={{
              fontSize: '26px', fontWeight: 900, letterSpacing: '3px',
              background: 'var(--negro)', border: '3px solid var(--celeste)',
              padding: '12px 40px', display: 'inline-block',
            }}>
            IR A MI PRODE →
          </Link>
        ) : (
          <Link href="/registro"
            className="relative font-brand text-white anim-hero-cta btn-cta-glow active:scale-95 hover:opacity-95 transition-all"
            style={{
              fontSize: '26px', fontWeight: 900, letterSpacing: '3px',
              background: 'var(--negro)', border: '3px solid var(--dorado)',
              padding: '12px 40px', display: 'inline-block',
            }}>
            PARTICIPAR GRATIS
          </Link>
        )}

        <p className="mt-4 text-white/70 text-sm anim-hero-cta">
          {isLoggedIn ? (
            <Link href="/ranking" className="underline font-semibold text-white hover:opacity-80">
              Ver el ranking
            </Link>
          ) : (
            <>
              Ya jugás?{' '}
              <Link href="/login" className="underline font-semibold text-white hover:opacity-80">
                Entrá a tu prode
              </Link>
            </>
          )}
        </p>

        {/* Contador de participantes */}
        {participantCount !== null && participantCount > 0 && (
          <p className="font-pixel text-white/30 mt-3 anim-hero-cta" style={{ fontSize: '7px', letterSpacing: '1px' }}>
            {participantCount} JUGADORES ANOTADOS
          </p>
        )}

        </div>{/* fin wrapper z-index:2 */}

        {/* Franja bandera argentina */}
        <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: '5px' }}>
          <div className="flex-1" style={{ background: 'rgba(0,0,0,0.2)' }} />
          <div className="flex-1" style={{ background: 'rgba(255,255,255,0.4)' }} />
          <div className="flex-1" style={{ background: 'rgba(0,0,0,0.2)' }} />
        </div>
      </section>

      {/* PREMIOS — sección hero, bien visible */}
      <section className="pt-12 pb-8 border-t" style={{ borderColor: 'var(--border)' }}>

        {/* Título premios */}
        <div className="text-center mb-8 px-5">
          <div className="inline-flex items-center gap-3 px-6 py-3 mb-4" style={{
            background: 'rgba(246,180,14,0.1)',
            border: '2px solid rgba(246,180,14,0.4)',
            boxShadow: '0 4px 0 rgba(200,146,11,0.5)',
          }}>
            <span className="text-2xl">🏆</span>
            <span className="font-brand text-white" style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '3px' }}>
              PREMIOS
            </span>
            <span className="text-2xl">🏆</span>
          </div>
          <p className="font-pixel text-white/35 mt-3" style={{ fontSize: '8px', letterSpacing: '2px' }}>
            LOS MEJORES DEL RANKING SE LLEVAN TODO
          </p>
        </div>

        <div className="px-5">
          <PrizePodium prizes={PRIZES} />
        </div>

        {/* CTA secundario bajo los premios */}
        <div className="text-center mt-8 px-5">
          {isLoggedIn ? (
            <Link href="/prode"
              className="font-brand text-white active:scale-95 transition-all inline-block"
              style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '2px',
                background: 'var(--negro)', border: '2px solid var(--celeste)',
                padding: '10px 32px', boxShadow: '0 4px 0 var(--celeste-dark)' }}>
              IR A MI PRODE →
            </Link>
          ) : (
            <Link href="/registro"
              className="font-brand text-white active:scale-95 transition-all inline-block"
              style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '2px',
                background: 'var(--negro)', border: '2px solid var(--dorado)',
                padding: '10px 32px', boxShadow: '0 4px 0 var(--dorado-dark)' }}>
              PARTICIPAR GRATIS →
            </Link>
          )}
        </div>
      </section>

      {/* CÓMO FUNCIONA — al final, más chico */}
      <section className="px-5 py-10 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="font-pixel text-center text-white/25 mb-7 tracking-widest" style={{ fontSize: '9px' }}>
          — COMO FUNCIONA —
        </p>
        <div className="max-w-sm mx-auto flex flex-col gap-3">
          {[
            { icon: '📝', step: '01', title: 'REGISTRATE', desc: 'Nombre, teléfono y mail. Gratis.' },
            { icon: '⚽', step: '02', title: 'CARGA TU PRODE', desc: 'Predeci partidos de Argentina, Brasil, Espana y mas.' },
            { icon: '🫙', step: '03', title: 'SUMA CHIMICHURROS', desc: 'Los chimichurros son tus puntos. Mientras mas acertás, mas sumás.' },
            { icon: '🏆', step: '04', title: 'GANATE LOS PREMIOS', desc: 'Los del podio se llevan lo mejor de Sabor Argento.' },
          ].map(({ icon, step, title, desc }, i) => (
            <div key={step} className={`flex items-center gap-4 p-4 anim-reveal-${i+1}`}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--celeste)' }}>
              <span className="font-pixel flex-shrink-0" style={{ color: 'var(--celeste)', fontSize: '9px', minWidth: '18px' }}>{step}</span>
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div>
                <p className="font-brand text-white" style={{ fontSize: '18px', fontWeight: 900, lineHeight: 1.1 }}>{title}</p>
                <p className="text-white/40 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Instagram CTA — bloque llamativo */}
      <section
        className="mx-5 mb-8 p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(116,172,223,0.12) 0%, rgba(116,172,223,0.05) 100%)',
          border: '1.5px solid rgba(116,172,223,0.25)',
        }}
      >
        <p className="text-white/50 text-xs mb-2 font-pixel" style={{ fontSize: '8px', letterSpacing: '1px' }}>
          PARA PARTICIPAR DEL PRODE
        </p>
        <p className="text-white/70 text-sm mb-2">seguí en Instagram a</p>
        <a
          href="https://www.instagram.com/saborargentoar/"
          target="_blank" rel="noopener noreferrer"
          className="font-brand hover-lift inline-block transition-all hover:opacity-90"
          style={{
            fontSize: '32px', fontWeight: 900,
            color: 'var(--celeste)',
            textShadow: '0 0 20px rgba(116,172,223,0.5)',
            letterSpacing: '1px',
          }}
        >
          @SABORARGENTOAR
        </a>
      </section>

      <footer className="px-4 py-5 text-center border-t" style={{ borderColor: 'var(--border)' }}>
        {/* Franja bandera pequeña */}
        <div className="flex h-0.5 mb-4 max-w-xs mx-auto">
          <div className="flex-1" style={{ background: 'var(--celeste)' }} />
          <div className="flex-1 bg-white" />
          <div className="flex-1" style={{ background: 'var(--celeste)' }} />
        </div>
        <p className="font-pixel text-white/20" style={{ fontSize: '7px', letterSpacing: '1px' }}>
          PRODE SABOR ARGENTO · MUNDIAL 2026 · HECHO EN ARGENTINA 🇦🇷
        </p>
      </footer>
    </main>
  )
}
