import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 60 // refresca cada 60 segundos

export default async function RankingPage() {
  const supabase = await createClient()

  const { data: participants } = await supabase
    .from('participants')
    .select('id, name, apodo, total_chimichurros, streak, max_streak')
    .order('total_chimichurros', { ascending: false })
    .limit(100)

  const ranking = participants ?? []

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--negro)' }}
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🫙</span>
          <span className="font-brand text-white text-xl tracking-wide">SABOR ARGENTO</span>
        </Link>
        <Link href="/prode" className="font-pixel text-white/50 hover:text-white transition-colors" style={{ fontSize: '9px' }}>
          MI PRODE
        </Link>
      </header>

      {/* Banner ranking */}
      <div
        className="px-4 py-5 text-center border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h1 className="font-brand text-white" style={{ fontSize: '52px', lineHeight: 1 }}>
          TABLA DE POSICIONES
        </h1>
        <p className="font-pixel text-white/30 mt-1" style={{ fontSize: '8px', letterSpacing: '1px' }}>
          ACTUALIZA CON CADA PARTIDO
        </p>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {ranking.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-pixel text-white/20 mb-6" style={{ fontSize: '10px' }}>NO HAY JUGADORES AUN</p>
            <Link href="/registro" className="btn-primary">
              SER EL PRIMERO →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            {ranking.map((p, i) => (
              <RankingRow key={p.id} rank={i + 1} participant={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function RankingRow({ rank, participant }: {
  rank: number
  participant: {
    id: string
    name: string
    apodo?: string | null
    total_chimichurros: number
    streak: number
    max_streak: number
  }
}) {
  const isTop1 = rank === 1
  const isTop3 = rank <= 3
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-sm transition-all"
      style={{
        background: isTop1 ? 'rgba(246,180,14,0.08)' : isTop3 ? 'rgba(116,172,223,0.06)' : 'var(--surface)',
        border: isTop1
          ? '1.5px solid rgba(246,180,14,0.35)'
          : isTop3
          ? '1px solid rgba(116,172,223,0.2)'
          : '1px solid var(--border)',
      }}
    >
      {/* Posición */}
      <div className="w-9 text-center flex-shrink-0">
        {isTop3 ? (
          <span className="text-xl">{medals[rank - 1]}</span>
        ) : (
          <span className="font-pixel text-white/25" style={{ fontSize: '9px' }}>
            #{rank}
          </span>
        )}
      </div>

      {/* Nombre + apodo + racha */}
      <div className="flex-1 min-w-0">
        <p className="font-brand text-white leading-none" style={{ fontSize: '18px', lineHeight: 1.15 }}>
          {participant.apodo ? (
            <>
              {participant.name}{' '}
              <span style={{ color: 'var(--celeste)' }}>&quot;{participant.apodo}&quot;</span>
            </>
          ) : (
            participant.name.toUpperCase()
          )}
        </p>
        {participant.streak > 0 && (
          <p className="font-pixel text-white/30 mt-0.5" style={{ fontSize: '7px' }}>
            🔥 RACHA {participant.streak}
          </p>
        )}
      </div>

      {/* Chimichurros — pixel counter */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm flex-shrink-0"
        style={{
          background: 'rgba(246,180,14,0.1)',
          border: '1px solid rgba(246,180,14,0.25)',
        }}
      >
        <span className="text-sm">🫙</span>
        <span className="font-pixel" style={{ fontSize: '11px', color: 'var(--dorado)' }}>
          {participant.total_chimichurros}
        </span>
      </div>
    </div>
  )
}
