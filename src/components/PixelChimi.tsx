'use client'

/**
 * Frasco Sabor Argento — CSS pixel art.
 * 20 cols × 26 rows. CHIMI ahora ocupa cols 3-16 (14 píxeles, caben las 5 letras).
 *
 * Paleta:
 *  0 = transparente
 *  1 = negro         #111
 *  2 = celeste       #74ACDF
 *  3 = blanco        #fff
 *  4 = gris tapa     #1a1a1a
 *  5 = chimi verde   #2a5218
 *  6 = chimi naranja #c24e0a
 *  7 = chimi verde2  #3d7a1e
 *  8 = chimi marron  #5c3d1e
 *  9 = label navy    #0b0b18
 */
export function PixelChimi({ size = 3, className = '' }: { size?: number; className?: string }) {
  const s = size

  // 20 columnas × 26 filas
  const G = [
    //  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // 00 tapa top
    [0, 0, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 0], // 01 tapa
    [0, 0, 1, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 4, 1, 0], // 02 ring celeste
    [0, 0, 1, 4, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 4, 1, 0], // 03 blanco
    [0, 0, 1, 4, 2, 3, 2, 3, 2, 2, 2, 2, 3, 2, 3, 3, 2, 4, 1, 0], // 04 escarapela
    [0, 0, 1, 4, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 4, 1, 0], // 05 blanco
    [0, 0, 1, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 4, 1, 0], // 06 ring celeste
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // 07 tapa bottom
    // Chimichurri top glass
    [0, 1, 8, 5, 6, 7, 5, 8, 6, 5, 7, 6, 8, 5, 7, 5, 6, 8, 1, 0], // 08
    [0, 1, 5, 6, 7, 5, 8, 6, 7, 8, 5, 7, 6, 8, 5, 6, 8, 5, 1, 0], // 09
    // Franja SABOR ARGENTO
    [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0], // 10 celeste
    [0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1, 0], // 11 blanco SABOR
    [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0], // 12 celeste
    // Etiqueta negra — spacer top
    [0, 1, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 1, 0], // 13
    // CHIMI — cols 3-16 (14 píxeles), C(2)+gap+H(3)+gap+I(1)+gap+M(3)+gap+I(1)
    // row0: C=##  H=#.#  I=#  M=#.#  I=#
    [0, 1, 9, 3, 3, 9, 3, 9, 3, 9, 3, 9, 3, 9, 3, 9, 3, 9, 1, 0], // 14
    // row1: C=#.  H=###  I=#  M=###  I=#
    [0, 1, 9, 3, 9, 9, 3, 3, 3, 9, 3, 9, 3, 3, 3, 9, 3, 9, 1, 0], // 15
    // row2: C=##  H=#.#  I=#  M=#.#  I=#
    [0, 1, 9, 3, 3, 9, 3, 9, 3, 9, 3, 9, 3, 9, 3, 9, 3, 9, 1, 0], // 16
    // spacer
    [0, 1, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 1, 0], // 17
    // Badge TRADICIONAL
    [0, 1, 9, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 9, 1, 0], // 18
    [0, 1, 9, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 9, 1, 0], // 19 dots
    [0, 1, 9, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 9, 1, 0], // 20
    [0, 1, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 1, 0], // 21 spacer
    // Chimichurri bottom glass
    [0, 1, 6, 5, 7, 8, 6, 5, 8, 7, 6, 5, 8, 7, 6, 5, 6, 8, 1, 0], // 22
    [0, 0, 1, 7, 5, 6, 8, 7, 5, 6, 8, 7, 5, 6, 8, 7, 5, 1, 0, 0], // 23
    // Base
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // 24
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // 25
  ]

  const C: Record<number, string> = {
    0: 'transparent',
    1: '#111111',
    2: '#74ACDF',
    3: '#ffffff',
    4: '#1a1a1a',
    5: '#2a5218',
    6: '#c24e0a',
    7: '#3d7a1e',
    8: '#5c3d1e',
    9: '#0b0b18',
  }

  return (
    <div
      className={className}
      style={{ display: 'inline-block', lineHeight: 0, imageRendering: 'pixelated', flexShrink: 0 }}
    >
      {G.map((row, y) => (
        <div key={y} style={{ display: 'flex' }}>
          {row.map((cell, x) => (
            <div key={x} style={{ width: s, height: s, background: C[cell], flexShrink: 0 }} />
          ))}
        </div>
      ))}
    </div>
  )
}
