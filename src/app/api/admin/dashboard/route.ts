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
      .order('total_chimichurros', { ascending: false }),
    supabase.from('predictions').select('participant_id, match_id'),
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('bonus_predictions').select('participant_id, tournament_winner, top_scorer'),
  ])

  // Predicciones por participante
  const predCountMap: Record<string, number> = {}
  for (const p of predictions ?? []) {
    predCountMap[p.participant_id] = (predCountMap[p.participant_id] ?? 0) + 1
  }

  // Bonus por participante
  const bonusMap: Record<string, { winner: string | null; scorer: string | null }> = {}
  for (const b of bonusPredictions ?? []) {
    bonusMap[b.participant_id] = { winner: b.tournament_winner, scorer: b.top_scorer }
  }

  const matchesAll = matches ?? []
  const matchesFinished = matchesAll.filter(m => m.status === 'finished')
  const matchesPending  = matchesAll.filter(m => m.status === 'upcoming')
  const matchesLive     = matchesAll.filter(m => m.status === 'live')

  const avgChimichurros = (participants?.length ?? 0) > 0
    ? Math.round((participants!.reduce((s, p) => s + (p.total_chimichurros ?? 0), 0)) / participants!.length)
    : 0

  // Top goleador bonus más elegido
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

  // Participantes sin ninguna predicción
  const noPredictions = participantsWithStats.filter(p => p.prediction_count === 0).length

  // IG pendientes de verificación
  const igPending = participantsWithStats.filter(p => p.instagram_confirmed === false).length

  return NextResponse.json({
    stats: {
      total_participants:  totalParticipants ?? 0,
      total_predictions:   predictions?.length ?? 0,
      matches_finished:    matchesFinished.length,
      matches_pending:     matchesPending.length,
      matches_live:        matchesLive.length,
      matches_total:       matchesAll.length,
      avg_chimichurros:    avgChimichurros,
      no_predictions:      noPredictions,
      ig_pending:          igPending,
      top_winner_pick:     topWinnerPick,
    },
    participants: participantsWithStats,
    recent_results: matchesFinished.slice(-8).reverse(),
    upcoming_matches: matchesPending.slice(0, 8),
  })
}
