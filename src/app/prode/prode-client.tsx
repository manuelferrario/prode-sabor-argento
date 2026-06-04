'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Match, Participant, Prediction, BonusPrediction } from '@/lib/types'
import { isoToFlag, teamDisplayName } from '@/lib/flags'
import { PixelChimi } from '@/components/PixelChimi'
import { WORLD_CUP_TEAMS, ARGENTINA_SQUAD } from '@/lib/teams'

// Sin tildes para la pixel font
const ROUND_LABELS: Record<string, string> = {
  group: '— FASE DE GRUPOS —',
  round_of_32: '— 16AVOS DE FINAL —',
  round_of_16: '— 8AVOS DE FINAL —',
  quarterfinal: '— CUARTOS DE FINAL —',
  semifinal: '— SEMIFINALES —',
  final: '— FINAL —',
}

interface Props {
  participant: Participant
  matches: Match[]
  predictions: Prediction[]
  bonusPrediction: BonusPrediction | null
  now: string
}

export default function ProdeClient({ participant, matches, predictions, bonusPrediction, now }: Props) {
  const [predMap, setPredMap] = useState<Record<string, { home: string; away: string }>>(
    () => {
      const map: Record<string, { home: string; away: string }> = {}
      for (const p of predictions) {
        map[p.match_id] = { home: String(p.predicted_home), away: String(p.predicted_away) }
      }
      return map
    }
  )
  const [bonus, setBonus] = useState({
    winner: bonusPrediction?.tournament_winner ?? '',
    scorer: bonusPrediction?.top_scorer ?? '',
  })
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const supabase = createClient()

  const isLocked = useCallback((match: Match) => {
    return new Date(match.match_date) <= new Date(now)
  }, [now])

  async function savePrediction(matchId: string) {
    const pred = predMap[matchId]
    if (!pred || pred.home === '' || pred.away === '') return

    setSaving(s => ({ ...s, [matchId]: true }))

    await supabase
      .from('predictions')
      .upsert({
        participant_id: participant.id,
        match_id: matchId,
        predicted_home: parseInt(pred.home),
        predicted_away: parseInt(pred.away),
      }, { onConflict: 'participant_id,match_id' })

    setSaving(s => ({ ...s, [matchId]: false }))
    setSaved(s => ({ ...s, [matchId]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [matchId]: false })), 2000)
  }

  // Guardar TODAS las predicciones pendientes de una vez
  async function saveAll() {
    const pending = Object.entries(predMap).filter(
      ([matchId, pred]) => pred.home !== '' && pred.away !== '' && !saved[matchId]
    )
    if (pending.length === 0) return
    setSaving(s => ({ ...s, saveAll: true }))
    await Promise.all(pending.map(([matchId]) => savePrediction(matchId)))
    setSaving(s => ({ ...s, saveAll: false }))
    setSaved(s => ({ ...s, saveAll: true }))
    setTimeout(() => setSaved(s => ({ ...s, saveAll: false })), 3000)
  }

  async function saveBonus() {
    setSaving(s => ({ ...s, bonus: true }))
    await supabase
      .from('bonus_predictions')
      .upsert({
        participant_id: participant.id,
        tournament_winner: bonus.winner || null,
        top_scorer: bonus.scorer || null,
      }, { onConflict: 'participant_id' })
    setSaving(s => ({ ...s, bonus: false }))
    setSaved(s => ({ ...s, bonus: true }))
    setTimeout(() => setSaved(s => ({ ...s, bonus: false })), 2000)
  }

  // Agrupar partidos por round
  const matchesByRound: Record<string, Match[]> = {}
  for (const m of matches) {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = []
    matchesByRound[m.round].push(m)
  }

  const roundOrder = ['group', 'round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'final']
  const predCount = Object.values(predMap).filter(p => p.home !== '' && p.away !== '').length
  const availableCount = matches.filter(m => !isLocked(m)).length

  return (
    <main className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Header compacto */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b"
        style={{ background: 'var(--negro)', borderColor: 'var(--border)' }}>
        <Link href="/" className="flex items-center gap-2">
          <PixelChimi size={3} />
          <span className="font-brand text-white tracking-wide" style={{ fontSize: '18px', fontWeight: 900 }}>
            SABOR ARGENTO
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Chimichurros counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 font-pixel"
            style={{ background: 'rgba(246,180,14,0.12)', border: '1px solid rgba(246,180,14,0.3)',
              color: 'var(--dorado)', fontSize: '10px' }}>
            <span>🫙</span>
            <span>{participant.total_chimichurros}</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Tab bar fijo abajo — PRODE | RANKING */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex border-t"
        style={{ background: 'var(--negro)', borderColor: 'var(--border)' }}>
        <div className="flex-1 flex items-center justify-center py-3 gap-2"
          style={{ borderRight: '1px solid var(--border)' }}>
          <span className="text-lg">⚽</span>
          <span className="font-brand text-white" style={{ fontSize: '16px', fontWeight: 900 }}>MI PRODE</span>
        </div>
        <Link href="/ranking" className="flex-1 flex items-center justify-center py-3 gap-2 hover:opacity-80 transition-opacity">
          <span className="text-lg">🏆</span>
          <span className="font-brand text-white/60" style={{ fontSize: '16px', fontWeight: 900 }}>RANKING</span>
        </Link>
      </nav>


      <div className="px-5 py-6 max-w-lg mx-auto">
        {/* Bienvenida */}
        <div className="mb-5">
          <h1 className="font-brand text-white" style={{ fontSize: '36px', fontWeight: 900, lineHeight: 1 }}>
            HOLA, {participant.name.split(' ')[0].toUpperCase()}!
          </h1>
        </div>

        {/* Predicciones bonus */}
        <div className="mb-6 p-4" style={{ background: 'var(--surface)', border: '1.5px solid rgba(246,180,14,0.3)', borderLeft: '3px solid var(--dorado)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="font-brand text-white" style={{ fontSize: '22px', fontWeight: 900 }}>BONUS</span>
            <span className="font-pixel" style={{ fontSize: '8px', color: 'var(--dorado)', background: 'rgba(246,180,14,0.1)', padding: '2px 6px', border: '1px solid rgba(246,180,14,0.3)' }}>
              +10 + +5 🫙
            </span>
          </div>

          {/* Campeon del mundo */}
          <div className="mb-4">
            <label className="font-pixel text-white/40 block mb-1.5" style={{ fontSize: '8px', letterSpacing: '1px' }}>
              CAMPEON DEL MUNDO (+10 🫙)
            </label>
            <select
              value={bonus.winner}
              onChange={e => setBonus(b => ({ ...b, winner: e.target.value }))}
              style={{
                background: 'var(--surface-2)',
                border: '1.5px solid var(--border)',
                borderRadius: '8px',
                color: bonus.winner ? 'white' : 'rgba(255,255,255,0.3)',
                padding: '12px 16px',
                width: '100%',
                outline: 'none',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
              }}
            >
              <option value="">— Elegir pais —</option>
              {WORLD_CUP_TEAMS.map(team => (
                <option key={team} value={team} style={{ background: '#1e1e1e', color: 'white' }}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          {/* Goleador argentino */}
          <div className="mb-4">
            <label className="font-pixel text-white/40 block mb-1" style={{ fontSize: '8px', letterSpacing: '1px' }}>
              GOLEADOR ARGENTINO (+5 🫙)
            </label>
            <p className="text-white/25 text-xs mb-1.5">¿Quien va a ser el goleador de Argentina?</p>
            <select
              value={bonus.scorer}
              onChange={e => setBonus(b => ({ ...b, scorer: e.target.value }))}
              style={{
                background: 'var(--surface-2)',
                border: '1.5px solid var(--border)',
                borderRadius: '8px',
                color: bonus.scorer ? 'white' : 'rgba(255,255,255,0.3)',
                padding: '12px 16px',
                width: '100%',
                outline: 'none',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
              }}
            >
              <option value="">— Elegir jugador —</option>
              {/* Delanteros primero */}
              <optgroup label="Delanteros" style={{ background: '#1e1e1e', color: 'rgba(255,255,255,0.5)' }}>
                {ARGENTINA_SQUAD.filter(p => p.pos === 'DEL').map(p => (
                  <option key={p.name} value={p.name} style={{ background: '#1e1e1e', color: 'white' }}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Mediocampistas" style={{ background: '#1e1e1e', color: 'rgba(255,255,255,0.5)' }}>
                {ARGENTINA_SQUAD.filter(p => p.pos === 'MED').map(p => (
                  <option key={p.name} value={p.name} style={{ background: '#1e1e1e', color: 'white' }}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Defensores" style={{ background: '#1e1e1e', color: 'rgba(255,255,255,0.5)' }}>
                {ARGENTINA_SQUAD.filter(p => p.pos === 'DEF').map(p => (
                  <option key={p.name} value={p.name} style={{ background: '#1e1e1e', color: 'white' }}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button onClick={saveBonus} disabled={saving.bonus}
            className="w-full py-2.5 font-brand transition-all active:scale-95 disabled:opacity-40"
            style={{ background: saved.bonus ? '#009B3A' : 'rgba(246,180,14,0.15)',
              color: saved.bonus ? 'white' : 'var(--dorado)', fontSize: '18px', fontWeight: 900,
              border: '1px solid rgba(246,180,14,0.3)', letterSpacing: '1px' }}>
            {saved.bonus ? '✓ GUARDADO' : saving.bonus ? 'GUARDANDO...' : 'GUARDAR BONUS'}
          </button>
        </div>

        {/* GUARDAR TODO — botón flotante cuando hay predicciones sin guardar */}
        {Object.values(predMap).some(p => p.home !== '' && p.away !== '') && (
          <button
            onClick={saveAll}
            disabled={!!saving.saveAll}
            className="w-full mb-5 py-3 font-brand transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: saved.saveAll ? '#009B3A' : 'var(--celeste)',
              color: 'white', fontSize: '20px', fontWeight: 900, letterSpacing: '2px',
              boxShadow: '0 4px 0 var(--celeste-dark)',
            }}>
            {saved.saveAll ? '✓ TODO GUARDADO' : saving.saveAll ? 'GUARDANDO...' : '💾 GUARDAR TODO'}
          </button>
        )}

        {/* Partidos por ronda */}
        {roundOrder.map(round => {
          const roundMatches = matchesByRound[round]
          if (!roundMatches?.length) return null

          // Lista ordenada de todos los IDs para navegación con flecha
          const allMatchIds = roundMatches.map(m => m.id)

          return (
            <div key={round} className="mb-6">
              <h2 className="font-pixel text-white/30 mb-3" style={{ fontSize: '8px', letterSpacing: '2px' }}>
                {ROUND_LABELS[round] ?? round}
              </h2>

              <div className="flex flex-col gap-4">
                {roundMatches.map((match, idx) => {
                  const locked = isLocked(match)
                  const pred = predMap[match.id]
                  const hasPred = pred?.home !== '' && pred?.away !== ''
                  const nextMatchId = allMatchIds[idx + 1]

                  return (
                    <MatchCard
                      key={match.id}
                      match={match}
                      locked={locked}
                      pred={pred}
                      hasPred={hasPred}
                      saving={!!saving[match.id]}
                      saved={!!saved[match.id]}
                      onChange={(home, away) =>
                        setPredMap(m => ({ ...m, [match.id]: { home, away } }))
                      }
                      onSave={() => savePrediction(match.id)}
                      nextMatchId={nextMatchId}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

function MatchCard({
  match, locked, pred, hasPred, saving, saved, onChange, onSave, nextMatchId
}: {
  match: Match
  locked: boolean
  pred?: { home: string; away: string }
  hasPred: boolean
  saving: boolean
  saved: boolean
  onChange: (home: string, away: string) => void
  onSave: () => void
  nextMatchId?: string
}) {
  const date = new Date(match.match_date)
  const dateStr = date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  const isFinished = match.status === 'finished'
  const hasResult = match.home_score !== null && match.away_score !== null
  const homeDisplay = teamDisplayName(match.team_home)
  const awayDisplay = teamDisplayName(match.team_away)
  const homeFlag = isoToFlag(match.team_home_flag)
  const awayFlag = isoToFlag(match.team_away_flag)

  return (
    <div
      id={`match-${match.id}`}
      className="p-3 transition-all"
      style={{
        background: hasPred ? 'rgba(116,172,223,0.08)' : '#1c1c2e',
        border: hasPred ? '1.5px solid rgba(116,172,223,0.4)' : '1px solid rgba(255,255,255,0.12)',
        borderLeft: hasPred ? '3px solid var(--celeste)' : '3px solid rgba(255,255,255,0.08)',
        opacity: locked && !hasPred ? 0.5 : 1,
      }}
    >
      {/* Fecha + grupo */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-pixel text-white/30" style={{ fontSize: '7px' }}>
          {dateStr} · {timeStr}
        </span>
        <div className="flex items-center gap-2">
          {match.group_name && (
            <span className="font-pixel text-white/25" style={{ fontSize: '7px' }}>GRP {match.group_name}</span>
          )}
          {locked && <span className="text-white/25 text-xs">🔒</span>}
        </div>
      </div>

      {/* Equipos */}
      <div className="flex items-center gap-2">
        {/* Local */}
        <div className="flex-1 text-right">
          <p className="text-xl" style={{ lineHeight: 1 }}>{homeFlag}</p>
          <p className="font-brand text-white mt-0.5" style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.1 }}>
            {homeDisplay}
          </p>
        </div>

        {/* Centro: inputs o resultado */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isFinished && hasResult ? (
            <div className="flex items-center gap-1 px-2 py-1 font-pixel"
              style={{ background: 'var(--surface-2)', fontSize: '13px' }}>
              <span className="text-white font-bold">{match.home_score}</span>
              <span className="text-white/30">-</span>
              <span className="text-white font-bold">{match.away_score}</span>
            </div>
          ) : (
            <>
              <ScoreInput value={pred?.home ?? ''} disabled={locked}
                onChange={v => onChange(v, pred?.away ?? '')} />
              <span className="text-white/30 font-pixel" style={{ fontSize: '10px' }}>-</span>
              <ScoreInput value={pred?.away ?? ''} disabled={locked}
                onChange={v => onChange(pred?.home ?? '', v)} />
            </>
          )}
        </div>

        {/* Visitante */}
        <div className="flex-1 text-left">
          <p className="text-xl" style={{ lineHeight: 1 }}>{awayFlag}</p>
          <p className="font-brand text-white mt-0.5" style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.1 }}>
            {awayDisplay}
          </p>
        </div>
      </div>

      {/* Tu predicción vs resultado */}
      {isFinished && hasPred && (
        <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="font-pixel text-white/30" style={{ fontSize: '7px' }}>
            TU PRODE: {pred?.home}-{pred?.away}
          </span>
          <ChimichurrosBadge
            predicted={{ home: parseInt(pred?.home ?? '0'), away: parseInt(pred?.away ?? '0') }}
            actual={{ home: match.home_score!, away: match.away_score! }}
          />
        </div>
      )}

      {/* Botones — guardar + siguiente */}
      {!locked && !isFinished && (
        <>
          <button
            onClick={onSave}
            disabled={saving || !pred?.home || !pred?.away}
            className="w-full mt-2 py-2 font-brand transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: saved ? '#009B3A' : hasPred ? 'rgba(116,172,223,0.15)' : 'rgba(255,255,255,0.04)',
              fontSize: '16px', fontWeight: 900, letterSpacing: '1px',
              color: saved ? 'white' : hasPred ? 'var(--celeste)' : 'rgba(255,255,255,0.2)',
              border: `1.5px solid ${saved ? '#009B3A' : hasPred ? 'rgba(116,172,223,0.4)' : 'transparent'}`,
            }}
          >
            {saved ? '✓ GUARDADO' : saving ? '⏳ GUARDANDO...' : 'GUARDAR'}
          </button>

          {hasPred && nextMatchId && (
            <button
              type="button"
              onClick={() => {
                onSave()
                setTimeout(() => {
                  const el = document.getElementById(`match-${nextMatchId}`)
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }, 200)
              }}
              className="w-full mt-1 py-2 font-brand transition-all active:scale-95"
              style={{
                background: 'rgba(116,172,223,0.06)',
                color: 'rgba(116,172,223,0.7)', fontSize: '15px', fontWeight: 900,
                border: '1px solid rgba(116,172,223,0.15)',
              }}
            >
              SIGUIENTE →
            </button>
          )}
        </>
      )}
    </div>
  )
}

function ScoreInput({ value, disabled, onChange }: {
  value: string
  disabled: boolean
  onChange: (v: string) => void
}) {
  const [popping, setPopping] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
    if (e.target.value !== '') {
      setPopping(true)
      setTimeout(() => setPopping(false), 350)
    }
  }

  return (
    <input
      type="number" min="0" max="20"
      inputMode="numeric"       // teclado numérico en mobile
      pattern="[0-9]*"
      value={value}
      disabled={disabled}
      onChange={handleChange}
      className={[
        'score-input',
        'disabled:cursor-not-allowed disabled:opacity-40',
        value !== '' ? 'has-value' : '',
        popping ? 'anim-pop' : '',
      ].join(' ')}
      style={{
        transition: 'border-color 0.2s, box-shadow 0.2s',
        fontWeight: value !== '' ? 'bold' : 'normal',
        color: value !== '' ? 'var(--celeste)' : 'rgba(255,255,255,0.3)',
      }}
    />
  )
}

function ChimichurrosBadge({
  predicted, actual
}: {
  predicted: { home: number; away: number }
  actual: { home: number; away: number }
}) {
  let earned = 0
  if (predicted.home === actual.home && predicted.away === actual.away) {
    earned = 3
  } else {
    const pResult = predicted.home > predicted.away ? 'h' : predicted.home < predicted.away ? 'a' : 'd'
    const aResult = actual.home > actual.away ? 'h' : actual.home < actual.away ? 'a' : 'd'
    if (pResult === aResult) earned = 1
  }

  if (earned === 0) return <span className="text-red-400 text-xs">0 🫙</span>
  if (earned === 1) return <span className="text-xs font-semibold" style={{ color: 'var(--celeste)' }}>+1 🫙</span>
  return <span className="text-xs font-bold" style={{ color: 'var(--dorado)' }}>+3 🫙</span>
}

function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogout() {
    setLoading(true)
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="font-pixel text-white/30 hover:text-red-400 transition-colors disabled:opacity-40"
      style={{ fontSize: '8px', letterSpacing: '0.5px' }}
      title="Cerrar sesión"
    >
      {loading ? '...' : 'EXIT'}
    </button>
  )
}
