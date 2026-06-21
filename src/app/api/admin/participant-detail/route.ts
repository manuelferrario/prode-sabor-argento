import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Detalle de predicciones de un participante — partido por partido,
// para poder verificar a mano que los puntos están bien calculados.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('password') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const participantId = searchParams.get('participantId')
  if (!participantId) return NextResponse.json({ error: 'Missing participantId' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: participant }, { data: predictions }, { data: bonus }] = await Promise.all([
    supabase.from('participants').select('*').eq('id', participantId).single(),
    supabase
      .from('predictions')
      .select('match_id, predicted_home, predicted_away, chimichurros_earned, matches(team_home, team_away, home_score, away_score, status, round, match_date)')
      .eq('participant_id', participantId),
    supabase.from('bonus_predictions').select('*').eq('participant_id', participantId).single(),
  ])

  const rows = (predictions ?? [])
    .map(p => {
      const m = Array.isArray(p.matches) ? p.matches[0] : p.matches
      return {
        match_id: p.match_id,
        team_home: m?.team_home ?? '',
        team_away: m?.team_away ?? '',
        home_score: m?.home_score ?? null,
        away_score: m?.away_score ?? null,
        status: m?.status ?? '',
        round: m?.round ?? '',
        match_date: m?.match_date ?? '',
        predicted_home: p.predicted_home,
        predicted_away: p.predicted_away,
        chimichurros_earned: p.chimichurros_earned,
      }
    })
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())

  const sumEarned = rows.reduce((s, r) => s + (r.chimichurros_earned ?? 0), 0)

  return NextResponse.json({
    participant,
    bonus: bonus ?? null,
    predictions: rows,
    sum_earned: sumEarned,
  })
}
