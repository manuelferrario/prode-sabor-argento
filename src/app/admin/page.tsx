'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  total_participants: number
  total_predictions: number
  matches_finished: number
  matches_pending: number
  matches_live: number
  matches_total: number
  avg_chimichurros: number
  no_predictions: number
  ig_pending: number
  top_winner_pick: [string, number] | null
}

interface ParticipantAdmin {
  id: string
  name: string
  email: string
  phone: string
  apodo: string | null
  instagram_user: string | null
  instagram_confirmed: boolean
  total_chimichurros: number
  streak: number
  prediction_count: number
  bonus: { winner: string | null; scorer: string | null } | null
  created_at: string
}

interface MatchAdmin {
  id: string
  match_date: string
  team_home: string
  team_away: string
  round: string
  group_name: string | null
  home_score: number | null
  away_score: number | null
  status: string
}

interface DashboardData {
  stats: Stats
  participants: ParticipantAdmin[]
  recent_results: MatchAdmin[]
  upcoming_matches: MatchAdmin[]
  live_matches: MatchAdmin[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const S = {
  card: {
    background: '#141414',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '16px',
  } as React.CSSProperties,
  label: {
    fontFamily: 'var(--font-pixel, monospace)',
    fontSize: '7px',
    letterSpacing: '1.5px',
    color: 'rgba(255,255,255,0.3)',
    display: 'block',
    marginBottom: '4px',
  } as React.CSSProperties,
}

function StatCard({ label, value, sub, color = 'white' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ ...S.card, flex: '1 1 140px' }}>
      <span style={S.label}>{label}</span>
      <p style={{ fontFamily: 'var(--font-brand)', fontSize: '36px', fontWeight: 900, color, lineHeight: 1, margin: 0 }}>
        {value}
      </p>
      {sub && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '3px' }}>{sub}</p>}
    </div>
  )
}

function RoundLabel(round: string) {
  const map: Record<string, string> = {
    group: 'Grupos', round_of_32: '16avos', round_of_16: 'Octavos',
    quarterfinal: 'Cuartos', semifinal: 'Semi', final: 'Final',
  }
  return map[round] ?? round
}

// ─── Main dashboard ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [igFilter, setIgFilter] = useState<'all' | 'pending' | 'verified'>('all')
  const [predsFilter, setPredsFilter] = useState<'all' | 'none'>('all')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchData = useCallback(async (pwd: string) => {
    setLoading(true)
    const res = await fetch(`/api/admin/dashboard?password=${encodeURIComponent(pwd)}`)
    if (res.status === 401) { setAuthError('Contraseña incorrecta'); setLoading(false); return }
    const json = await res.json()
    setData(json)
    setAuthed(true)
    setLoading(false)
  }, [])

  function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    fetchData(password)
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    const res = await fetch(`/api/admin/sync?password=${encodeURIComponent(password)}`, { method: 'POST' })
    const json = await res.json()
    setSyncResult(json.ok
      ? `✓ ${json.scores_updated} resultados · ${json.matches_updated} partidos actualizados`
      : `Error: ${json.error}`)
    setSyncing(false)
    fetchData(password)
  }

  async function handleDownloadCSV() {
    const a = document.createElement('a')
    a.href = `/api/admin/export-csv?password=${encodeURIComponent(password)}`
    a.download = `participantes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  async function toggleIG(participantId: string, currentValue: boolean) {
    setTogglingId(participantId)
    await fetch(`/api/admin/verify-instagram?password=${encodeURIComponent(password)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, verified: !currentValue }),
    })
    setData(d => d ? {
      ...d,
      participants: d.participants.map(p =>
        p.id === participantId ? { ...p, instagram_confirmed: !currentValue } : p
      ),
    } : d)
    setTogglingId(null)
  }

  // ── Auth gate ──
  if (!authed) {
    return (
      <main style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <p style={{ fontFamily: 'var(--font-brand)', color: 'white', fontSize: '32px', fontWeight: 900, textAlign: 'center', letterSpacing: '2px', marginBottom: '8px' }}>
            ADMIN
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', marginBottom: '28px' }}>
            Prode Sabor Argento · Mundial 2026
          </p>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              placeholder="Contraseña admin"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              style={{
                padding: '13px 16px', background: '#1e1e1e',
                border: '1.5px solid rgba(255,255,255,0.1)', color: 'white',
                fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box',
              }}
            />
            {authError && <p style={{ color: '#CE1126', fontSize: '13px', textAlign: 'center' }}>{authError}</p>}
            <button type="submit" disabled={loading} style={{
              padding: '13px', background: '#74ACDF', color: 'white',
              fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 900,
              border: 'none', cursor: 'pointer', letterSpacing: '2px',
              opacity: loading ? 0.5 : 1,
            }}>
              {loading ? 'ENTRANDO...' : 'ENTRAR →'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  if (!data) return null

  const { stats, participants, recent_results, upcoming_matches, live_matches } = data

  // Filtros de participantes
  const filtered = participants.filter(p => {
    const matchSearch = search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.instagram_user ?? '').toLowerCase().includes(search.toLowerCase())
    const matchIG = igFilter === 'all' ? true : igFilter === 'pending' ? !p.instagram_confirmed : p.instagram_confirmed
    const matchPreds = predsFilter === 'all' ? true : p.prediction_count === 0
    return matchSearch && matchIG && matchPreds
  })

  const totalAvailableMatches = stats.matches_finished + stats.matches_pending + stats.matches_live

  // ── Dashboard ──
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', fontFamily: 'var(--font-body, sans-serif)' }}>

      {/* Header */}
      <header style={{ background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div>
          <span style={{ fontFamily: 'var(--font-brand)', fontSize: '22px', fontWeight: 900, letterSpacing: '2px', color: '#74ACDF' }}>
            ADMIN
          </span>
          <span style={{ fontFamily: 'var(--font-brand)', fontSize: '22px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>
            SABOR ARGENTO
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => fetchData(password)} style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '1px' }}>
            ↻ REFRESCAR
          </button>
          <Link href="/" style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
            ← SALIR
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* ── STATS ── */}
        <section>
          <SectionTitle>RESUMEN</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <StatCard label="JUGADORES" value={stats.total_participants} sub={`${stats.no_predictions} sin predicciones`} color="#74ACDF" />
            <StatCard label="PREDICCIONES" value={stats.total_predictions.toLocaleString()} sub={`~${stats.total_participants > 0 ? Math.round(stats.total_predictions / stats.total_participants) : 0} por jugador`} />
            <StatCard label="PARTIDOS JUGADOS" value={`${stats.matches_finished}/${stats.matches_total}`}
              sub={stats.matches_live > 0 ? `${stats.matches_live} en vivo ahora` : `${stats.matches_pending} pendientes`}
              color={stats.matches_live > 0 ? '#F6B40E' : 'white'} />
            <StatCard label="PROMEDIO CHIMIS" value={stats.avg_chimichurros} color="#F6B40E" />
            <StatCard label="IG PENDIENTES" value={stats.ig_pending}
              sub="sin verificar"
              color={stats.ig_pending > 0 ? '#CE1126' : '#009B3A'} />
            {stats.top_winner_pick && (
              <StatCard label="CAMPEÓN MÁS VOTADO" value={stats.top_winner_pick[0]}
                sub={`${stats.top_winner_pick[1]} votos`} color="#F6B40E" />
            )}
          </div>
        </section>

        {/* ── ACCIONES RÁPIDAS ── */}
        <section>
          <SectionTitle>ACCIONES</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button onClick={handleSync} disabled={syncing} style={{
              padding: '10px 20px', background: syncing ? 'rgba(116,172,223,0.3)' : '#74ACDF',
              color: 'white', fontFamily: 'var(--font-brand)', fontSize: '18px', fontWeight: 900,
              border: 'none', cursor: 'pointer', letterSpacing: '1px', transition: 'opacity 0.2s',
              opacity: syncing ? 0.7 : 1,
            }}>
              {syncing ? '⏳ SINCRONIZANDO...' : '⚽ SYNC RESULTADOS'}
            </button>
            <button onClick={handleDownloadCSV} style={{
              padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-brand)', fontSize: '18px', fontWeight: 900,
              border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', letterSpacing: '1px',
            }}>
              ⬇ EXPORTAR CSV
            </button>
          </div>
          {syncResult && (
            <p style={{ marginTop: '8px', fontSize: '13px',
              color: syncResult.startsWith('✓') ? '#009B3A' : '#CE1126' }}>
              {syncResult}
            </p>
          )}
        </section>

        {/* ── EN VIVO ── */}
        {live_matches.length > 0 && (
          <section>
            <SectionTitle>
              <span style={{ color: '#CE1126' }}>● EN VIVO</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', marginLeft: '8px' }}>
                {live_matches.length} partido{live_matches.length > 1 ? 's' : ''}
              </span>
            </SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {live_matches.map(m => (
                <div key={m.id} style={{
                  ...S.card,
                  display: 'flex', alignItems: 'center', gap: '12px',
                  borderLeft: '3px solid #CE1126',
                  background: 'rgba(206,17,38,0.06)',
                }}>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#CE1126', animation: 'pulse 1.5s infinite', minWidth: '48px' }}>
                    ● LIVE
                  </span>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: 700, textAlign: 'right' }}>{m.team_home}</span>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '13px', color: '#F6B40E', minWidth: '44px', textAlign: 'center' }}>
                    {m.home_score ?? '?'} - {m.away_score ?? '?'}
                  </span>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: 700 }}>{m.team_away}</span>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'rgba(255,255,255,0.3)' }}>
                    {m.group_name ? `GRP ${m.group_name}` : RoundLabel(m.round)}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'rgba(255,255,255,0.2)', marginTop: '8px', letterSpacing: '1px' }}>
              SINCRONIZÁ AL FINAL DEL PARTIDO PARA ACTUALIZAR CHIMICHURROS
            </p>
          </section>
        )}

        {/* ── FIXTURE ── */}
        <section>
          <SectionTitle>FIXTURE</SectionTitle>
          {/* Barra de progreso */}
          <div style={{ ...S.card, marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={S.label}>PROGRESO DEL TORNEO</span>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: '#74ACDF' }}>
                {stats.matches_finished}/{stats.matches_total} JUGADOS
              </span>
            </div>
            <div style={{ background: '#1e1e1e', height: '8px', width: '100%', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${stats.matches_total > 0 ? (stats.matches_finished / stats.matches_total) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #74ACDF, #F6B40E)',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Últimos resultados */}
            {recent_results.length > 0 && (
              <div style={{ flex: '1 1 280px' }}>
                <p style={S.label}>ÚLTIMOS RESULTADOS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {recent_results.map(m => (
                    <div key={m.id} style={{ ...S.card, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'rgba(255,255,255,0.3)', minWidth: '48px' }}>
                        {RoundLabel(m.round)}
                      </span>
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>{m.team_home}</span>
                      <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '11px', color: '#74ACDF', minWidth: '36px', textAlign: 'center' }}>
                        {m.home_score}-{m.away_score}
                      </span>
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{m.team_away}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Próximos partidos */}
            {upcoming_matches.length > 0 && (
              <div style={{ flex: '1 1 280px' }}>
                <p style={S.label}>PRÓXIMOS PARTIDOS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {upcoming_matches.map(m => (
                    <div key={m.id} style={{ ...S.card, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'rgba(255,255,255,0.3)', minWidth: '48px' }}>
                        {new Date(m.match_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                      </span>
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>{m.team_home}</span>
                      <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'rgba(255,255,255,0.3)', minWidth: '36px', textAlign: 'center' }}>vs</span>
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{m.team_away}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── PARTICIPANTES ── */}
        <section>
          <SectionTitle>PARTICIPANTES <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>({filtered.length}/{participants.length})</span></SectionTitle>

          {/* Filtros */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Buscar por nombre, email o @instagram..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: '1 1 200px', padding: '8px 12px', background: '#1e1e1e',
                border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', outline: 'none',
              }}
            />
            <FilterButton active={igFilter === 'all'} onClick={() => setIgFilter('all')}>Todos IG</FilterButton>
            <FilterButton active={igFilter === 'pending'} onClick={() => setIgFilter('pending')} warn={stats.ig_pending > 0}>
              Sin verificar ({stats.ig_pending})
            </FilterButton>
            <FilterButton active={igFilter === 'verified'} onClick={() => setIgFilter('verified')}>Verificados</FilterButton>
            <FilterButton active={predsFilter === 'none'} onClick={() => setPredsFilter(predsFilter === 'none' ? 'all' : 'none')} warn={stats.no_predictions > 0}>
              Sin predicciones ({stats.no_predictions})
            </FilterButton>
          </div>

          {/* Tabla */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {['#', 'NOMBRE', 'EMAIL', 'TELÉFONO', '@INSTAGRAM', 'IG ✓', 'CHIMIS', 'PREDS', 'BONUS', 'REGISTRO'].map(h => (
                    <th key={h} style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'rgba(255,255,255,0.3)', padding: '8px 10px', textAlign: 'left', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-pixel)', fontSize: '8px' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      {p.apodo && <span style={{ color: '#74ACDF', marginLeft: '6px', fontSize: '12px' }}>"{p.apodo}"</span>}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                      <a href={`mailto:${p.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{p.email}</a>
                    </td>
                    <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>{p.phone}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      {p.instagram_user
                        ? <a href={`https://instagram.com/${p.instagram_user}`} target="_blank" rel="noopener noreferrer" style={{ color: '#74ACDF', textDecoration: 'none' }}>@{p.instagram_user}</a>
                        : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <button
                        onClick={() => toggleIG(p.id, p.instagram_confirmed)}
                        disabled={togglingId === p.id}
                        title={p.instagram_confirmed ? 'Click para marcar como no verificado' : 'Click para verificar'}
                        style={{
                          padding: '3px 8px', fontSize: '11px', fontWeight: 700,
                          background: p.instagram_confirmed ? 'rgba(0,155,58,0.2)' : 'rgba(206,17,38,0.15)',
                          color: p.instagram_confirmed ? '#009B3A' : '#CE1126',
                          border: `1px solid ${p.instagram_confirmed ? '#009B3A' : '#CE1126'}`,
                          cursor: 'pointer', transition: 'opacity 0.15s',
                          opacity: togglingId === p.id ? 0.4 : 1,
                        }}
                      >
                        {p.instagram_confirmed ? '✓ OK' : '✗ NO'}
                      </button>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        fontFamily: 'var(--font-pixel)', fontSize: '10px', color: '#F6B40E',
                        background: 'rgba(246,180,14,0.1)', padding: '2px 6px', border: '1px solid rgba(246,180,14,0.25)',
                      }}>
                        🫙 {p.total_chimichurros}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--font-pixel)', fontSize: '9px' }}>
                      <span style={{ color: p.prediction_count === 0 ? '#CE1126' : p.prediction_count >= 20 ? '#009B3A' : '#74ACDF' }}>
                        {p.prediction_count}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>/{totalAvailableMatches}</span>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: '11px' }}>
                      {p.bonus?.winner || p.bonus?.scorer
                        ? <span style={{ color: '#009B3A' }}>✓</span>
                        : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', fontSize: '11px' }}>
                      {new Date(p.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-pixel)', fontSize: '9px' }}>
                      NO HAY RESULTADOS
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '22px', fontWeight: 900, letterSpacing: '2px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '8px' }}>
      {children}
    </h2>
  )
}

function FilterButton({ children, active, onClick, warn }: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  warn?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', fontSize: '12px', fontWeight: 600,
      background: active ? (warn ? 'rgba(206,17,38,0.2)' : 'rgba(116,172,223,0.2)') : 'rgba(255,255,255,0.04)',
      color: active ? (warn ? '#CE1126' : '#74ACDF') : 'rgba(255,255,255,0.5)',
      border: `1px solid ${active ? (warn ? '#CE1126' : '#74ACDF') : 'rgba(255,255,255,0.1)'}`,
      cursor: 'pointer', transition: 'all 0.15s',
    }}>
      {children}
    </button>
  )
}
