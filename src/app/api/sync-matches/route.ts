import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cron job o llamada manual para sincronizar partidos y resultados
// Llamar desde Vercel Cron: GET /api/sync-matches
// O manualmente cuando termina la fase de grupos

export async function GET(request: Request) {
  // Verificar token de autorización para llamadas externas
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const apiToken = process.env.FOOTBALL_DATA_API_TOKEN
  if (!apiToken) return NextResponse.json({ error: 'No API token' }, { status: 500 })

  try {
    // 1. Traer todos los partidos del Mundial 2026 desde football-data.org
    const res = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
      { headers: { 'X-Auth-Token': apiToken } }
    )
    const data = await res.json()
    const matches = data.matches ?? []

    const STAGE_MAP: Record<string, string> = {
      GROUP_STAGE: 'group',
      LAST_32: 'round_of_32',
      LAST_16: 'round_of_16',
      QUARTER_FINALS: 'quarterfinal',
      SEMI_FINALS: 'semifinal',
      FINAL: 'final',
    }

    // Partidos corregidos a mano — el sync no debe pisar su resultado
    const { data: overriddenRows } = await supabase
      .from('matches')
      .select('api_match_id')
      .eq('manual_override', true)
    const overriddenIds = new Set((overriddenRows ?? []).map(r => r.api_match_id))

    let updated = 0
    let scoresUpdated = 0
    let skipped = 0

    for (const m of matches) {
      const apiId = m.id

      // No pisar el resultado de un partido que el admin corrigió a mano
      if (overriddenIds.has(apiId)) {
        skipped++
        continue
      }

      const homeTeam = m.homeTeam?.name || 'TBD'
      const awayTeam = m.awayTeam?.name || 'TBD'
      const status = m.status === 'FINISHED' ? 'finished'
        : m.status === 'IN_PLAY' || m.status === 'PAUSED' ? 'live'
        : 'upcoming'
      const homeScore = m.score?.fullTime?.home ?? null
      const awayScore = m.score?.fullTime?.away ?? null
      const round = STAGE_MAP[m.stage] ?? 'group'

      // Actualizar equipo si ya se conoce (para llaves finales)
      const updateData: Record<string, unknown> = { status }

      if (homeTeam !== 'TBD') updateData.team_home = homeTeam
      if (awayTeam !== 'TBD') updateData.team_away = awayTeam
      if (homeScore !== null) updateData.home_score = homeScore
      if (awayScore !== null) updateData.away_score = awayScore

      // Detectar si fue a penales
      const penScore = m.score?.penalties
      if (penScore?.home !== null && penScore?.home !== undefined) {
        updateData.went_to_penalties = true
        // El ganador es el que tiene más penales
        if (penScore.home > penScore.away) updateData.winner = homeTeam
        else updateData.winner = awayTeam
      } else if (homeScore !== null && awayScore !== null) {
        if (homeScore > awayScore) updateData.winner = homeTeam
        else if (awayScore > homeScore) updateData.winner = awayTeam
      }

      const { error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('api_match_id', apiId)

      if (!error) {
        updated++
        if (homeScore !== null) scoresUpdated++
      }
    }

    // 2. Recalcular chimichurros para partidos terminados
    const { data: finishedMatches } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'finished')

    for (const match of finishedMatches ?? []) {
      await supabase.rpc('update_chimichurros_for_match', { match_id_param: match.id })
    }

    return NextResponse.json({
      ok: true,
      matches_updated: updated,
      scores_updated: scoresUpdated,
      manual_overrides_skipped: skipped,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('sync-matches error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
