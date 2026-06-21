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

// Supabase/PostgREST cappea cada respuesta a ~1000 filas sin importar el
// .range() pedido. Para traer tablas grandes hay que paginar en loop.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll<T>(
  supabase: any,
  table: string,
  columns: string
): Promise<T[]> {
  const pageSize = 1000
  let from = 0
  const all: T[] = []
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...(data as T[]))
    if (data.length < pageSize) break
    from += pageSize
  }
  return all
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

  interface ParticipantRow { id: string; name: string; email: string; total_chimichurros: number; streak: number; max_streak: number }
  interface PredictionRow { participant_id: string; match_id: string; predicted_home: number; predicted_away: number; chimichurros_earned: number }
  interface MatchRow { id: string; team_home: string; team_away: string; home_score: number | null; away_score: number | null; status: string; round: string; match_date: string }

  let participants: ParticipantRow[] = []
  let predictions: PredictionRow[] = []
  let matches: MatchRow[] = []
  let fetchError = ''

  try {
    ;[participants, predictions, matches] = await Promise.all([
      fetchAll<ParticipantRow>(supabase, 'participants', 'id, name, email, total_chimichurros, streak, max_streak'),
      fetchAll<PredictionRow>(supabase, 'predictions', 'participant_id, match_id, predicted_home, predicted_away, chimichurros_earned'),
      fetchAll<MatchRow>(supabase, 'matches', 'id, team_home, team_away, home_score, away_score, status, round, match_date'),
    ])
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err)
  }

  const debugLines = [
    `DEBUG: participants=${participants.length}`,
    `DEBUG: predictions=${predictions.length}`,
    `DEBUG: matches=${matches.length}`,
    `DEBUG: matches_finished=${matches.filter(m => m.status === 'finished').length}`,
    `DEBUG: error=${fetchError || 'ninguno'}`,
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
