import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('password') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { data: participants, count: totalParticipants },
    { data: predictions },
    { data: matches },
    { data: bonusPredictions },
  ] = await Promise.all([
    supabase
      .from('participants')
      .select('id, name, email, phone, apodo, instagram_user, instagram_confirmed, total_chimichurros, streak, created_at, device_id', { count: 'exact' })
      .order('total_chimichurros', { ascending: false })
      .range(0, 9999),
    supabase.from('predictions').select('participant_id, match_id, chimichurros_earned').range(0, 9999),
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('bonus_predictions').select('participant_id, tournament_winner, top_scorer'),
  ])

  const matchesAll = matches ?? []
  const matchesFinished = matchesAll.filter(m => m.status === 'finished')
  const matchesPending  = matchesAll.filter(m => m.status === 'upcoming')
  const matchesLive     = matchesAll.filter(m => m.status === 'live')

  // Partidos que el usuario puede predecir (misma lógica que /prode)
  const predictableMatchIds = new Set(
    matchesAll.filter(m => m.featured_team || m.round !== 'group').map(m => m.id)
  )
  const finishedMatchIds = new Set(matchesFinished.map(m => m.id))

  // Predicciones por participante — solo sobre partidos predicibles
  const predCountMap: Record<string, number> = {}
  // Stats por partido terminado: cuántos acertaron exacto, ganador, o erraron
  const matchStatsMap: Record<string, { exact: number; winner: number; missed: number; total: number }> = {}

  for (const p of predictions ?? []) {
    if (predictableMatchIds.has(p.match_id)) {
      predCountMap[p.participant_id] = (predCountMap[p.participant_id] ?? 0) + 1
    }
    if (finishedMatchIds.has(p.match_id)) {
      if (!matchStatsMap[p.match_id]) matchStatsMap[p.match_id] = { exact: 0, winner: 0, missed: 0, total: 0 }
      matchStatsMap[p.match_id].total++
      if (p.chimichurros_earned === 3) matchStatsMap[p.match_id].exact++
      else if (p.chimichurros_earned === 1) matchStatsMap[p.match_id].winner++
      else matchStatsMap[p.match_id].missed++
    }
  }

  // Bonus por participante
  const bonusMap: Record<string, { winner: string | null; scorer: string | null }> = {}
  for (const b of bonusPredictions ?? []) {
    bonusMap[b.participant_id] = { winner: b.tournament_winner, scorer: b.top_scorer }
  }

  const avgChimichurros = (participants?.length ?? 0) > 0
    ? Math.round((participants!.reduce((s, p) => s + (p.total_chimichurros ?? 0), 0)) / participants!.length)
    : 0

  // Top campeón más elegido
  const winnerVotes: Record<string, number> = {}
  for (const b of bonusPredictions ?? []) {
    if (b.tournament_winner) winnerVotes[b.tournament_winner] = (winnerVotes[b.tournament_winner] ?? 0) + 1
  }
  const topWinnerPick = Object.entries(winnerVotes).sort((a, b) => b[1] - a[1])[0] ?? null

  const participantsWithStats = (participants ?? []).map(p => ({
    ...p,
    prediction_count: predCountMap[p.id] ?? 0,
    bonus: bonusMap[p.id] ?? null,
  }))

  const noPredictions = participantsWithStats.filter(p => p.prediction_count === 0).length
  const igPending = participantsWithStats.filter(p => p.instagram_confirmed === false).length

  return NextResponse.json({
    stats: {
      total_participants:       totalParticipants ?? 0,
      total_predictions:        predictions?.length ?? 0,
      matches_finished:         matchesFinished.length,
      matches_pending:          matchesPending.length,
      matches_live:             matchesLive.length,
      matches_total:            matchesAll.length,
      predictable_matches:      predictableMatchIds.size,
      avg_chimichurros:         avgChimichurros,
      no_predictions:           noPredictions,
      ig_pending:               igPending,
      top_winner_pick:          topWinnerPick,
    },
    participants: participantsWithStats,
    recent_results: matchesFinished.slice(-8).reverse().map(m => ({
      ...m,
      stats: matchStatsMap[m.id] ?? { exact: 0, winner: 0, missed: 0, total: 0 },
    })),
    upcoming_matches: matchesPending.slice(0, 8),
    live_matches: matchesLive,
  })
}
