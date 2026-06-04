import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 60

export default async function RankingPage() {
  const supabase = await createClient()

  // Usuario logueado (si hay)
  const { data: { user } } = await supabase.auth.getUser()

  const { data: participants } = await supabase
    .from('participants')
    .select('id, name, apodo, email, total_chimichurros, streak, max_streak')
    .order('total_chimichurros', { ascending: false })
    .limit(100)

  const ranking = participants ?? []

  // Posición del usuario logueado
  const myIndex = user ? ranking.findIndex(p => p.email === user.email) : -1
  const myRank = myIndex >= 0 ? myIndex + 1 : null
  const me = myIndex >= 0 ? ranking[myIndex] : null

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Header limpio con flecha */}
      <header className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--negro)' }}>
        <Link href="/"
          className="flex items-center justify-center transition-all hover:opacity-80 flex-shrink-0"
          style={{ width: 36, height: 36, background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}
          aria-label="Volver">
          <span className="font-brand text-white" style={{ fontSize: '20px', lineHeight: 1 }}>←</span>
        </Link>
        <span className="font-brand text-white tracking-wide" style={{ fontSize: '20px', fontWeight: 900 }}>
          SABOR ARGENTO
        </span>
        {user && (
          <Link href="/prode" className="ml-auto font-pixel text-white/40 hover:text-white transition-colors" style={{ fontSize: '8px' }}>
            MI PRODE
          </Link>
        )}
      </header>

      {/* Banner */}
      <div className="px-4 py-5 text-center border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h1 className="font-brand text-white" style={{ fontSize: '48px', lineHeight: 1 }}>
          TABLA DE POSICIONES
        </h1>
        <p className="font-pixel text-white/30 mt-1" style={{ fontSize: '8px', letterSpacing: '1px' }}>
          ACTUALIZA CON CADA PARTIDO
        </p>
      </div>

      {/* Tu posición — solo si estás logueado */}
      {me && myRank && (
        <div className="px-4 pt-4 max-w-lg mx-auto">
          <div className="p-4 mb-1 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(116,172,223,0.15), rgba(116,172,223,0.08))',
              border: '2px solid var(--celeste)',
              boxShadow: '0 0 20px rgba(116,172,223,0.2)',
            }}>
            <p className="font-pixel text-white/50 mb-1" style={{ fontSize: '8px', letterSpacing: '2px' }}>
              TU POSICION
            </p>
            <p className="font-brand text-white leading-none" style={{ fontSize: '52px', fontWeight: 900, color: 'var(--celeste)' }}>
              #{myRank}
            </p>
            <p className="font-brand text-white/70 mt-1" style={{ fontSize: '18px' }}>
              {me.apodo ? `${me.name} "${me.apodo}"` : me.name}
              {' · '}
              <span style={{ color: 'var(--dorado)' }}>🫙 {me.total_chimichurros}</span>
            </p>
          </div>
        </div>
      )}

      {/* Lista ranking */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        {ranking.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-pixel text-white/20 mb-6" style={{ fontSize: '10px' }}>NO HAY JUGADORES AUN</p>
            <Link href="/registro" className="btn-primary">SER EL PRIMERO →</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            {ranking.map((p, i) => (
              <RankingRow
                key={p.id}
                rank={i + 1}
                participant={p}
                isMe={p.email === user?.email}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function RankingRow({ rank, participant, isMe }: {
  rank: number
  participant: {
    id: string
    name: string
    apodo?: string | null
    total_chimichurros: number
    streak: number
    max_streak: number
  }
  isMe: boolean
}) {
  const isTop1 = rank === 1
  const isTop3 = rank <= 3
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-sm transition-all"
      style={{
        background: isMe
          ? 'rgba(116,172,223,0.12)'
          : isTop1 ? 'rgba(246,180,14,0.08)'
          : isTop3 ? 'rgba(116,172,223,0.06)'
          : 'var(--surface)',
        border: isMe
          ? '2px solid var(--celeste)'
          : isTop1 ? '1.5px solid rgba(246,180,14,0.35)'
          : isTop3 ? '1px solid rgba(116,172,223,0.2)'
          : '1px solid var(--border)',
        boxShadow: isMe ? '0 0 12px rgba(116,172,223,0.2)' : 'none',
      }}
    >
      {/* Posición */}
      <div className="w-9 text-center flex-shrink-0">
        {isTop3 ? (
          <span className="text-xl">{medals[rank - 1]}</span>
        ) : (
          <span className="font-pixel text-white/25" style={{ fontSize: '9px' }}>#{rank}</span>
        )}
      </div>

      {/* Nombre + apodo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-brand text-white leading-none truncate" style={{ fontSize: '18px', lineHeight: 1.15 }}>
            {participant.apodo ? (
              <>
                {participant.name}{' '}
                <span style={{ color: 'var(--celeste)' }}>&quot;{participant.apodo}&quot;</span>
              </>
            ) : (
              participant.name.toUpperCase()
            )}
          </p>
          {isMe && (
            <span className="font-pixel flex-shrink-0" style={{ fontSize: '7px', color: 'var(--celeste)',
              background: 'rgba(116,172,223,0.15)', padding: '2px 5px', border: '1px solid rgba(116,172,223,0.3)' }}>
              VOS
            </span>
          )}
        </div>
        {participant.streak > 0 && (
          <p className="font-pixel text-white/30 mt-0.5" style={{ fontSize: '7px' }}>
            🔥 RACHA {participant.streak}
          </p>
        )}
      </div>

      {/* Chimichurros */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm flex-shrink-0"
        style={{ background: 'rgba(246,180,14,0.1)', border: '1px solid rgba(246,180,14,0.25)' }}>
        <span className="text-sm">🫙</span>
        <span className="font-pixel" style={{ fontSize: '11px', color: 'var(--dorado)' }}>
          {participant.total_chimichurros}
        </span>
      </div>
    </div>
  )
}
