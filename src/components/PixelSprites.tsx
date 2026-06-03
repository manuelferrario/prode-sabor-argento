'use client'

/** Paleta compartida */
const B = 'transparent'  // background

/** Pelota de fútbol — 10×10 */
function PixelBall({ size = 3 }: { size?: number }) {
  const W = '#f0f0f0', K = '#111', S = size
  const G = [
    [B, B, W, W, W, W, W, W, B, B],
    [B, W, W, K, K, W, W, W, W, B],
    [W, W, K, K, K, K, W, K, W, W],
    [W, W, K, W, W, K, K, K, W, W],
    [W, W, W, W, W, W, K, W, W, W],
    [W, W, W, K, W, W, W, W, W, W],
    [W, W, K, K, K, W, W, K, K, W],
    [W, W, K, W, K, K, K, K, W, W],
    [B, W, W, W, W, K, K, W, W, B],
    [B, B, W, W, W, W, W, W, B, B],
  ]
  return <PixelGrid grid={G} colors={{ W, K, [B]: B }} size={S} />
}

/** Copa del Mundo — 10×14 */
function PixelTrophy({ size = 3 }: { size?: number }) {
  const Y = '#F6B40E', O = '#c8920b', G2 = '#888', K = '#111', S = size
  const G = [
    [B, B, K, Y, Y, Y, Y, Y, K, B],
    [B, K, Y, Y, Y, Y, Y, Y, Y, K],
    [K, Y, O, Y, Y, Y, Y, O, Y, K],
    [K, Y, Y, Y, Y, Y, Y, Y, Y, K],
    [K, K, Y, Y, Y, Y, Y, Y, K, K],
    [B, K, K, Y, Y, Y, Y, K, K, B],
    [B, B, K, Y, Y, Y, Y, K, B, B],
    [B, B, B, Y, Y, Y, Y, B, B, B],
    [B, B, B, Y, O, O, Y, B, B, B],
    [B, B, B, Y, Y, Y, Y, B, B, B],
    [B, B, K, G2, G2, G2, G2, K, B, B],
    [B, K, G2, G2, G2, G2, G2, G2, K, B],
    [B, K, G2, G2, G2, G2, G2, G2, K, B],
    [K, K, K, K, K, K, K, K, K, K],
  ]
  return <PixelGrid grid={G} colors={{ Y, O, G2, K, [B]: B }} size={S} />
}

/** Asado / carne — 12×8 */
function PixelAsado({ size = 3 }: { size?: number }) {
  const R = '#c0392b', D = '#922b21', P = '#e74c3c', W = '#f5cba7', S = size
  const G = [
    [B, B, D, D, D, D, D, D, D, D, B, B],
    [B, D, R, R, R, R, R, R, R, R, D, B],
    [D, R, P, P, R, P, R, R, P, P, R, D],
    [D, R, R, D, D, R, R, D, D, R, R, D],
    [D, R, P, P, R, P, R, R, P, P, R, D],
    [D, R, R, R, D, R, R, D, R, R, R, D],
    [B, D, R, R, R, R, R, R, R, R, D, B],
    [B, W, W, W, W, W, W, W, W, W, W, B],
  ]
  return <PixelGrid grid={G} colors={{ R, D, P, W, [B]: B }} size={S} />
}

/** Parrilla con fuego — 12×10 */
function PixelParrilla({ size = 3 }: { size?: number }) {
  const K = '#222', O = '#F6B40E', F = '#e74c3c', G2 = '#555', S = size
  const G = [
    [B, B, B, F, O, F, O, F, O, B, B, B],
    [B, B, F, O, F, O, F, O, F, O, B, B],
    [B, B, O, F, O, B, B, O, F, O, B, B],
    [K, K, K, K, K, K, K, K, K, K, K, K],
    [K, B, K, B, K, B, K, B, K, B, K, B],
    [K, B, K, B, K, B, K, B, K, B, K, B],
    [K, K, K, K, K, K, K, K, K, K, K, K],
    [G2, G2, G2, G2, G2, G2, G2, G2, G2, G2, G2, G2],
    [B, G2, G2, G2, G2, G2, G2, G2, G2, G2, G2, B],
    [B, B, G2, G2, B, G2, G2, B, G2, G2, B, B],
  ]
  return <PixelGrid grid={G} colors={{ K, O, F, G2, [B]: B }} size={S} />
}

/** Messi pixel head — 10×13 (cara + camiseta Argentina) */
function PixelMessi({ size = 3 }: { size?: number }) {
  const H = '#111', S = '#c8956e', B = '#555', E = '#111',
        J = '#74ACDF', W = '#ffffff', S2 = size
  const G: string[][] = [
    ['0','0', H,  H,  H,  H,  H,  H, '0','0'],
    ['0', H,  H,  H,  H,  H,  H,  H,  H, '0'],
    [ H,  H,  H,  S,  S,  S,  S,  H,  H,  H],
    [ H,  S,  S,  S,  S,  S,  S,  S,  S,  H],
    [ S,  S,  E,  S,  S,  S,  E,  S,  S,  S],
    [ S,  S,  S,  S,  S,  S,  S,  S,  S,  S],
    [ S,  B,  B,  S,  S,  S,  S,  B,  B,  S],
    [ S,  B,  B,  B,  B,  B,  B,  B,  B,  S],
    ['0', S,  S,  S,  S,  S,  S,  S,  S, '0'],
    [ J,  J,  W,  W,  W,  W,  W,  W,  J,  J],
    [ J,  J,  W,  W,  W,  W,  W,  W,  J,  J],
    [ J,  J,  J,  J,  J,  J,  J,  J,  J,  J],
    [ J,  J,  J,  J,  J,  J,  J,  J,  J,  J],
  ]
  return <PixelGrid grid={G} colors={{ H, S, B, E, J, W, '0': 'transparent' }} size={S2} />
}

/** Estrella dorada — 8×8 */
function PixelStar({ size = 3 }: { size?: number }) {
  const Y = '#F6B40E', O = '#c8920b', S = size
  const G = [
    [B, B, B, Y, Y, B, B, B],
    [B, B, Y, Y, Y, Y, B, B],
    [Y, Y, Y, Y, Y, Y, Y, Y],
    [B, Y, Y, Y, Y, Y, Y, B],
    [B, B, Y, Y, Y, Y, B, B],
    [B, Y, Y, B, B, Y, Y, B],
    [Y, Y, B, B, B, B, Y, Y],
    [Y, B, B, B, B, B, B, Y],
  ]
  return <PixelGrid grid={G} colors={{ Y, O, [B]: B }} size={S} />
}

/** Frasco chimichurri — reexporta el PixelChimi compacto */
import { PixelChimi } from './PixelChimi'

/** Motor de renderizado pixel art */
function PixelGrid({
  grid, colors, size,
}: {
  grid: (string)[][]
  colors: Record<string, string>
  size: number
}) {
  return (
    <div style={{ display: 'inline-block', lineHeight: 0, imageRendering: 'pixelated' }}>
      {grid.map((row, y) => (
        <div key={y} style={{ display: 'flex' }}>
          {row.map((cell, x) => (
            <div
              key={x}
              style={{
                width: size,
                height: size,
                background: colors[cell] ?? 'transparent',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Tipos de sprites disponibles */
export type SpriteType = 'chimi' | 'ball' | 'trophy' | 'asado' | 'parrilla' | 'star' | 'messi'

export function PixelSprite({ type, size }: { type: SpriteType; size?: number }) {
  switch (type) {
    case 'chimi':    return <PixelChimi size={size} />
    case 'ball':     return <PixelBall size={size} />
    case 'trophy':   return <PixelTrophy size={size} />
    case 'asado':    return <PixelAsado size={size} />
    case 'parrilla': return <PixelParrilla size={size} />
    case 'star':     return <PixelStar size={size} />
    case 'messi':    return <PixelMessi size={size} />
  }
}

/** Tipos disponibles con pesos (chimi y ball aparecen más) */
const SPRITE_POOL: SpriteType[] = [
  'chimi', 'chimi',
  'ball',  'ball',
  'messi', 'messi', 'messi',  // 3 Messis!
  'trophy',
  'asado',
  'parrilla',
]

// Animaciones keyframe disponibles
const ANIM_NAMES = ['fly-lr', 'fly-lr-slow', 'fly-rl', 'fly-rl-small'] as const

export interface FlyingConfig {
  type: SpriteType
  size: number
  top: string          // posición vertical
  animName: string     // nombre del keyframe CSS
  duration: string     // ej: "14s"
  delay: string        // ej: "-6s" — negativo = ya mid-flight
}

/** Genera 10 sprites con tops distribuidos en bandas — sin solapamiento */
export function getRandomSprites(): FlyingConfig[] {
  const shuffled = [...SPRITE_POOL].sort(() => Math.random() - 0.5)

  // 10 bandas de ~6% cada una entre 3% y 63%
  // Cada sprite cae en su propia banda, random dentro de ella
  const BAND_H = 6
  const BAND_START = 3

  return Array.from({ length: 10 }, (_, i) => {
    const bandMin  = BAND_START + i * BAND_H
    const top      = bandMin + Math.random() * (BAND_H - 1)  // random DENTRO de la banda
    const duration = 9 + Math.random() * 10
    const delay    = -(Math.random() * duration)
    // Alternar dirección: pares van LR, impares RL (con variación random)
    const goLR     = Math.random() > 0.45
    const animName = goLR
      ? (Math.random() > 0.5 ? 'fly-lr' : 'fly-lr-slow')
      : (Math.random() > 0.5 ? 'fly-rl' : 'fly-rl-small')
    const size     = Math.random() < 0.25 ? 4 : Math.random() < 0.55 ? 3 : 2

    return {
      type:     shuffled[i % shuffled.length],
      size,
      top:      `${top.toFixed(1)}%`,
      animName,
      duration: `${duration.toFixed(1)}s`,
      delay:    `${delay.toFixed(1)}s`,
    }
  })
}

/** Set fijo para SSR — tops en bandas separadas, variedad de sprites */
export const SSR_SPRITES: FlyingConfig[] = [
  { type: 'chimi',    size: 3, top:  '3%', animName: 'fly-lr',       duration: '12s', delay:  '-3s' },
  { type: 'ball',     size: 3, top:  '9%', animName: 'fly-rl',       duration: '15s', delay:  '-7s' },
  { type: 'messi',    size: 3, top: '15%', animName: 'fly-lr-slow',  duration: '18s', delay: '-12s' },
  { type: 'trophy',   size: 3, top: '21%', animName: 'fly-rl',       duration: '13s', delay:  '-5s' },
  { type: 'ball',     size: 2, top: '27%', animName: 'fly-lr',       duration: '16s', delay:  '-9s' },
  { type: 'asado',    size: 3, top: '33%', animName: 'fly-rl',       duration: '11s', delay:  '-2s' },
  { type: 'messi',    size: 4, top: '39%', animName: 'fly-lr-slow',  duration: '19s', delay: '-14s' },
  { type: 'parrilla', size: 3, top: '45%', animName: 'fly-rl',       duration: '14s', delay:  '-8s' },
  { type: 'chimi',    size: 2, top: '51%', animName: 'fly-lr',       duration: '17s', delay: '-11s' },
  { type: 'ball',     size: 3, top: '57%', animName: 'fly-rl-small', duration: '10s', delay:  '-4s' },
]
