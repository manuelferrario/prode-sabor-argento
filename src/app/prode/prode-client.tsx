'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Match, Participant, Prediction, BonusPrediction } from '@/lib/types'
import { isoToFlag, teamDisplayName } from '@/lib/flags'
import { PixelChimi } from '@/components/PixelChimi'
import { WORLD_CUP_TEAMS, ARGENTINA_SQUAD } from '@/lib/teams'

/** Dispara confetti con los colores de Argentina */
async function fireConfetti() {
  try {
    const confetti = (await import('canvas-confetti')).default
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#74ACDF', '#F6B40E', '#ffffff', '#009B3A', '#74ACDF'],
      scalar: 1.1,
      zIndex: 9999,
    })
  } catch {
    // canvas-confetti no disponible, continúa sin confetti
  }
}

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
}

export default function ProdeClient({ participant, matches, predictions, bonusPrediction }: Props) {
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
  const [showOnlyMissing, setShowOnlyMissing] = useState(false)
  const [, setTick] = useState(0)
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const supabase = createClient()

  // Usa la hora actual del cliente — se re-evalúa cada 30s vía tick
  const isLocked = useCallback((match: Match) => {
    return new Date(match.match_date).getTime() - 30 * 60 * 1000 <= new Date().getTime()
  }, [])

  // Bonus bloqueado 30min antes del primer partido del torneo
  const isBonusLocked = (() => {
    if (matches.length === 0) return false
    const firstMatch = matches.reduce((a, b) =>
      new Date(a.match_date) < new Date(b.match_date) ? a : b
    )
    return new Date(firstMatch.match_date).getTime() - 30 * 60 * 1000 <= new Date().getTime()
  })()

  // Limpia timers al desmontar
  useEffect(() => {
    return () => { Object.values(debounceTimers.current).forEach(clearTimeout) }
  }, [])

  // Re-evalúa el lock de partidos cada 30s (por si el usuario deja la página abierta)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  // Guarda con valores explícitos (evita stale closure en auto-save)
  async function savePredictionValues(matchId: string, home: string, away: string) {
    if (!home || !away) return
    setSaving(s => ({ ...s, [matchId]: true }))
    await supabase
      .from('predictions')
      .upsert({
        participant_id: participant.id,
        match_id: matchId,
        predicted_home: parseInt(home),
        predicted_away: parseInt(away),
      }, { onConflict: 'participant_id,match_id' })
    setSaving(s => ({ ...s, [matchId]: false }))
    setSaved(s => ({ ...s, [matchId]: true }))
    fireConfetti()
    setTimeout(() => setSaved(s => ({ ...s, [matchId]: false })), 2000)
  }

  // Auto-save: se dispara 900ms después de que el usuario ingresa ambos scores
  function handleChange(matchId: string, home: string, away: string) {
    setPredMap(m => ({ ...m, [matchId]: { home, away } }))
    if (debounceTimers.current[matchId]) clearTimeout(debounceTimers.current[matchId])
    if (home !== '' && away !== '') {
      debounceTimers.current[matchId] = setTimeout(() => {
        savePredictionValues(matchId, home, away)
      }, 900)
    }
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
  const knockoutRounds = ['round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'final']

  // Una ronda eliminatoria está "bloqueada" si los equipos todavía son TBD
  function isRoundBracketLocked(roundMatches: Match[]) {
    return roundMatches.every(m => m.team_home === 'TBD' || m.team_away === 'TBD')
  }

  function hasPrediction(matchId: string) {
    const p = predMap[matchId]
    return !!p && p.home !== '' && p.away !== ''
  }

  // Progreso: sólo cuentan los partidos que ya se pueden predecir (rondas no bloqueadas)
  const predictableMatches = matches.filter(m => {
    if (knockoutRounds.includes(m.round)) {
      const roundMatches = matchesByRound[m.round]
      return roundMatches && !isRoundBracketLocked(roundMatches)
    }
    return true
  })
  const totalCount = predictableMatches.length
  const predictedCount = predictableMatches.filter(m => hasPrediction(m.id)).length
  const missingCount = totalCount - predictedCount
  // El filtro sólo aplica si todavía queda algo pendiente (evita listas vacías "pegadas")
  const filterActive = showOnlyMissing && missingCount > 0

  function scrollToMatches() {
    const el = document.getElementById('matches-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="min-h-screen pb-20" style={{ background: 'var(--background)', overflowX: 'hidden' }}>
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
        <div className="mb-3">
          <h1 className="font-brand text-white" style={{ fontSize: '36px', fontWeight: 900, lineHeight: 1 }}>
            HOLA, {participant.name.split(' ')[0].toUpperCase()}!
          </h1>
        </div>

        {/* Notificación: partidos pendientes */}
        {missingCount > 0 && (
          <button
            type="button"
            onClick={() => { setShowOnlyMissing(true); scrollToMatches() }}
            className="w-full mb-3 px-4 py-2.5 flex items-center gap-3 text-left transition-all active:scale-[0.99]"
            style={{
              background: 'rgba(246,180,14,0.08)',
              border: '1px solid rgba(246,180,14,0.22)',
              borderLeft: '3px solid var(--dorado)',
            }}
          >
            <span className="text-base flex-shrink-0">⏰</span>
            <p className="font-pixel text-white/60 flex-1" style={{ fontSize: '8px', lineHeight: 1.6, letterSpacing: '0.5px' }}>
              TE FALTAN <span style={{ color: 'var(--dorado)', fontWeight: 700 }}>{missingCount}</span> PARTIDO{missingCount === 1 ? '' : 'S'} POR PREDECIR
            </p>
            <span className="font-pixel text-white/30 flex-shrink-0" style={{ fontSize: '7px' }}>VER →</span>
          </button>
        )}

        {/* Barra de progreso + filtro */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-pixel text-white/25" style={{ fontSize: '7px', letterSpacing: '1.5px' }}>
                TU PROGRESO
              </span>
              <span className="font-pixel text-white/35" style={{ fontSize: '7px' }}>
                {predictedCount}/{totalCount} PREDICHOS
              </span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${totalCount > 0 ? Math.round((predictedCount / totalCount) * 100) : 0}%`,
                background: predictedCount === totalCount && totalCount > 0 ? '#009B3A' : 'var(--celeste)',
                borderRadius: '2px',
                transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)',
              }} />
            </div>
          </div>

          {missingCount > 0 && (
            <button
              type="button"
              onClick={() => setShowOnlyMissing(s => !s)}
              className="font-pixel transition-all active:scale-95 flex-shrink-0"
              style={{
                fontSize: '7px', letterSpacing: '0.5px', padding: '7px 10px',
                background: showOnlyMissing ? 'rgba(116,172,223,0.15)' : 'rgba(255,255,255,0.04)',
                color: showOnlyMissing ? 'var(--celeste)' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${showOnlyMissing ? 'rgba(116,172,223,0.4)' : 'rgba(255,255,255,0.12)'}`,
              }}
            >
              {showOnlyMissing ? '✕ TODOS' : `FALTAN ${missingCount}`}
            </button>
          )}
        </div>

        {/* Predicciones bonus */}
        <div className="mb-6 p-4" style={{ background: 'var(--surface)', border: `1.5px solid ${isBonusLocked ? 'rgba(255,255,255,0.08)' : 'rgba(246,180,14,0.3)'}`, borderLeft: `3px solid ${isBonusLocked ? 'rgba(255,255,255,0.15)' : 'var(--dorado)'}`, opacity: isBonusLocked ? 0.7 : 1 }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="font-brand text-white" style={{ fontSize: '22px', fontWeight: 900 }}>BONUS</span>
            <span className="font-pixel" style={{ fontSize: '8px', color: 'var(--dorado)', background: 'rgba(246,180,14,0.1)', padding: '2px 6px', border: '1px solid rgba(246,180,14,0.3)' }}>
              +10 + +5 🫙
            </span>
            {isBonusLocked && <span className="text-white/25 text-xs">🔒</span>}
          </div>

          {isBonusLocked && (
            <p className="font-pixel text-white/30 mb-4" style={{ fontSize: '7px', letterSpacing: '1px' }}>
              PREDICCIONES BONUS CERRADAS
            </p>
          )}

          {/* Campeon del mundo */}
          <div className="mb-4">
            <label className="font-pixel text-white/40 block mb-1.5" style={{ fontSize: '8px', letterSpacing: '1px' }}>
              CAMPEON DEL MUNDO (+10 🫙)
            </label>
            <select
              value={bonus.winner}
              disabled={isBonusLocked}
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
                cursor: isBonusLocked ? 'not-allowed' : 'pointer',
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
              disabled={isBonusLocked}
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
                cursor: isBonusLocked ? 'not-allowed' : 'pointer',
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

          <button onClick={saveBonus} disabled={saving.bonus || isBonusLocked}
            className="w-full py-2.5 font-brand transition-all active:scale-95 disabled:opacity-40"
            style={{ background: saved.bonus ? '#009B3A' : 'rgba(246,180,14,0.15)',
              color: saved.bonus ? 'white' : 'var(--dorado)', fontSize: '18px', fontWeight: 900,
              border: '1px solid rgba(246,180,14,0.3)', letterSpacing: '1px' }}>
            {saved.bonus ? '✓ GUARDADO' : saving.bonus ? 'GUARDANDO...' : 'GUARDAR BONUS'}
          </button>
        </div>

        {/* Partidos por ronda */}
        <div id="matches-section">
        {showOnlyMissing && missingCount === 0 && (
          <div className="mb-6 p-5 text-center" style={{ background: 'rgba(0,155,58,0.06)', border: '1px dashed rgba(0,155,58,0.3)' }}>
            <p className="text-2xl mb-2">🎉</p>
            <p className="font-brand text-white/70" style={{ fontSize: '18px', fontWeight: 900 }}>
              YA PREDIJISTE TODO LO QUE PODÍAS
            </p>
          </div>
        )}
        {roundOrder.map(round => {
          const roundMatches = matchesByRound[round]
          if (!roundMatches?.length) return null

          // Rondas eliminatorias bloqueadas hasta que clasifiquen los equipos
          if (knockoutRounds.includes(round) && isRoundBracketLocked(roundMatches)) {
            if (filterActive) return null
            return (
              <div key={round} className="mb-6">
                <h2 className="font-pixel text-white/30 mb-3" style={{ fontSize: '8px', letterSpacing: '2px' }}>
                  {ROUND_LABELS[round] ?? round}
                </h2>
                <div className="p-5 text-center" style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                }}>
                  <p className="text-2xl mb-2">🔒</p>
                  <p className="font-brand text-white/40" style={{ fontSize: '20px', fontWeight: 900 }}>
                    SE DEFINE AL TERMINAR LOS GRUPOS
                  </p>
                  <p className="font-pixel text-white/20 mt-2" style={{ fontSize: '7px', letterSpacing: '1px' }}>
                    LOS EQUIPOS CLASIFICADOS APARECEN ACA
                  </p>
                </div>
              </div>
            )
          }

          // Lista ordenada de todos los IDs de la ronda para navegación con flecha
          const allMatchIds = roundMatches.map(m => m.id)

          // Con el filtro activo, mostramos sólo los que faltan predecir
          const visibleMatches = filterActive
            ? roundMatches.filter(m => !hasPrediction(m.id))
            : roundMatches

          if (filterActive && visibleMatches.length === 0) return null

          return (
            <div key={round} className="mb-6">
              <h2 className="font-pixel text-white/30 mb-3" style={{ fontSize: '8px', letterSpacing: '2px' }}>
                {ROUND_LABELS[round] ?? round}
                {filterActive && (
                  <span className="text-white/15"> · {visibleMatches.length} POR CARGAR</span>
                )}
              </h2>

              <div className="flex flex-col gap-4">
                {visibleMatches.map((match) => {
                  const locked = isLocked(match)
                  const pred = predMap[match.id]
                  const hasPred = pred?.home !== '' && pred?.away !== ''
                  const idx = allMatchIds.indexOf(match.id)
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
                      onChange={(home, away) => handleChange(match.id, home, away)}
                      nextMatchId={nextMatchId}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </main>
  )
}

function MatchCard({
  match, locked, pred, hasPred, saving, saved, onChange, nextMatchId
}: {
  match: Match
  locked: boolean
  pred?: { home: string; away: string }
  hasPred: boolean
  saving: boolean
  saved: boolean
  onChange: (home: string, away: string) => void
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
              <ScoreStepper
                value={pred?.home ?? ''}
                disabled={locked}
                onChange={v => onChange(v, pred?.away ?? '')}
              />
              <span className="text-white/30 font-pixel" style={{ fontSize: '10px' }}>-</span>
              <ScoreStepper
                value={pred?.away ?? ''}
                disabled={locked}
                onChange={v => onChange(pred?.home ?? '', v)}
              />
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

      {/* Auto-save status + siguiente */}
      {!locked && !isFinished && (
        <div className="mt-2 flex items-center justify-between min-h-[28px]">
          <span className="font-pixel" style={{ fontSize: '7px',
            color: saved ? '#009B3A' : saving ? 'rgba(255,255,255,0.25)' : 'transparent' }}>
            {saved ? '✓ GUARDADO' : saving ? 'GUARDANDO...' : '.'}
          </span>
          {hasPred && nextMatchId && (
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById(`match-${nextMatchId}`)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              className="font-brand transition-all active:scale-95"
              style={{
                background: 'rgba(116,172,223,0.06)',
                color: 'rgba(116,172,223,0.6)', fontSize: '14px', fontWeight: 900,
                border: '1px solid rgba(116,172,223,0.15)',
                padding: '3px 10px',
              }}
            >
              SIGUIENTE →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ScoreStepper({ value, disabled, onChange }: {
  value: string
  disabled: boolean
  onChange: (v: string) => void
}) {
  const [popping, setPopping] = useState(false)
  const num = value === '' ? null : parseInt(value)

  function set(n: number) {
    const clamped = Math.max(0, Math.min(20, n))
    onChange(String(clamped))
    setPopping(true)
    setTimeout(() => setPopping(false), 250)
  }

  function increment() { set((num ?? -1) + 1) }
  function decrement() { if (num !== null) set(num - 1) }

  const canDecrement = !disabled && num !== null && num > 0
  const canIncrement = !disabled && (num === null || num < 20)

  return (
    <div className="score-stepper">
      <button
        type="button"
        disabled={!canIncrement}
        onClick={increment}
        className="score-stepper-btn"
        aria-label="Sumar gol"
      >
        +
      </button>
      <div
        className={[
          'score-stepper-value',
          value !== '' ? 'has-value' : '',
          popping ? 'anim-pop' : '',
        ].join(' ')}
      >
        {value === '' ? '–' : value}
      </div>
      <button
        type="button"
        disabled={!canDecrement}
        onClick={decrement}
        className="score-stepper-btn"
        aria-label="Restar gol"
      >
        −
      </button>
    </div>
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
