import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Calcula el puntaje base (sin bonus de racha) — replica calculate_chimichurros() de Supabase
function calculateBase(
  predHome: number, predAway: number,
  actualHome: number, actualAway: number
): number {
  if (predHome === actualHome && predAway === actualAway) return 3
  const predicted = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw'
  const actual = actualHome > actualAway ? 'home' : actualHome < actualAway ? 'away' : 'draw'
  return predicted === actual ? 1 : 0
}

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
    { data: participants, error: participantsError },
    { data: predictions, error: predictionsError },
    { data: matches, error: matchesError },
  ] = await Promise.all([
    supabase.from('participants').select('id, name, email, total_chimichurros, streak, max_streak').range(0, 9999),
    supabase.from('predictions').select('participant_id, match_id, predicted_home, predicted_away, chimichurros_earned').range(0, 9999),
    supabase.from('matches').select('id, team_home, team_away, home_score, away_score, status, round, match_date').range(0, 9999),
  ])

  const debugLines = [
    `DEBUG: participants=${participants?.length ?? 'null'} (error: ${participantsError?.message ?? 'ninguno'})`,
    `DEBUG: predictions=${predictions?.length ?? 'null'} (error: ${predictionsError?.message ?? 'ninguno'})`,
    `DEBUG: matches=${matches?.length ?? 'null'} (error: ${matchesError?.message ?? 'ninguno'})`,
    `DEBUG: matches_finished=${(matches ?? []).filter(m => m.status === 'finished').length}`,
  ]

  const matchMap = new Map((matches ?? []).map(m => [m.id, m]))
  const participantMap = new Map((participants ?? []).map(p => [p.id, p]))

  const rows: string[][] = []
  const headers = [
    'Jugador', 'Email', 'Ronda', 'Fecha', 'Local', 'Visitante',
    'Resultado_Real', 'Prediccion', 'Puntos_Base_Esperado', 'Puntos_Guardados',
    'Diferencia', 'Coincide',
  ]

  for (const pred of predictions ?? []) {
    const m = matchMap.get(pred.match_id)
    const par = participantMap.get(pred.participant_id)
    if (!m || !par) continue
    if (m.status !== 'finished' || m.home_score === null || m.away_score === null) continue

    const base = calculateBase(pred.predicted_home, pred.predicted_away, m.home_score, m.away_score)
    const diff = pred.chimichurros_earned - base
    const coincide = diff === 0 || diff === 3 ? 'SI' : 'NO'

    rows.push([
      par.name, par.email, m.round,
      new Date(m.match_date).toLocaleDateString('es-AR'),
      m.team_home, m.team_away,
      `${m.home_score}-${m.away_score}`,
      `${pred.predicted_home}-${pred.predicted_away}`,
      String(base),
      String(pred.chimichurros_earned),
      String(diff),
      coincide,
    ])
  }

  // Resumen por participante: total guardado vs suma real de sus predicciones
  const sumByParticipant = new Map<string, number>()
  for (const pred of predictions ?? []) {
    const m = matchMap.get(pred.match_id)
    if (!m || m.status !== 'finished') continue
    sumByParticipant.set(pred.participant_id, (sumByParticipant.get(pred.participant_id) ?? 0) + pred.chimichurros_earned)
  }

  const summaryRows: string[][] = []
  for (const par of participants ?? []) {
    const suma = sumByParticipant.get(par.id) ?? 0
    summaryRows.push([
      par.name, par.email,
      String(par.total_chimichurros), String(suma),
      String(par.total_chimichurros - suma),
      par.total_chimichurros === suma ? 'SI' : 'NO',
      String(par.streak), String(par.max_streak),
    ])
  }
  summaryRows.sort((a, b) => Number(b[2]) - Number(a[2]))

  function csvEscape(v: string) {
    return `"${v.replace(/"/g, '""')}"`
  }

  const detailCsv = [headers, ...rows].map(r => r.map(csvEscape).join(',')).join('\n')
  const summaryCsv = [
    ['Jugador', 'Email', 'Total_Guardado', 'Suma_Real', 'Diferencia', 'Coincide', 'Racha', 'Racha_Max'],
    ...summaryRows,
  ].map(r => r.map(csvEscape).join(',')).join('\n')

  const csv = `${debugLines.join('\n')}\n\nRESUMEN POR PARTICIPANTE\n${summaryCsv}\n\nDETALLE PARTIDO POR PARTIDO\n${detailCsv}`

  const filename = `verificacion-prode-${new Date().toISOString().split('T')[0]}.csv`
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
