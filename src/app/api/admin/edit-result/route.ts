import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Edición manual de resultado — para cuando el feed de football-data.org
// tarda en corregirse (lag de caché en el endpoint de la competencia)
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('password') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { matchId, homeScore, awayScore } = await request.json()
  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: match } = await supabase
    .from('matches')
    .select('team_home, team_away')
    .eq('id', matchId)
    .single()

  const updateData: Record<string, unknown> = {
    home_score: homeScore,
    away_score: awayScore,
    status: 'finished',
    // Protege esta corrección de ser pisada por el próximo sync automático
    // (cron diario o SYNC RESULTADOS) si la API externa sigue desactualizada
    manual_override: true,
  }

  if (match) {
    if (homeScore > awayScore) updateData.winner = match.team_home
    else if (awayScore > homeScore) updateData.winner = match.team_away
    else updateData.winner = null
  }

  const { error } = await supabase.from('matches').update(updateData).eq('id', matchId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalcular chimichurros y rachas para este partido
  const { error: rpcError } = await supabase.rpc('update_chimichurros_for_match', { match_id_param: matchId })
  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
