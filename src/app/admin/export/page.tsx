'use client'

import { useState } from 'react'

export default function AdminExportPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{ count: number } | null>(null)

  async function handleDownload() {
    if (!password) { setError('Ingresá la contraseña'); return }
    setLoading(true)
    setError('')

    // Verificar contraseña primero
    const res = await fetch(`/api/admin/export-csv?password=${encodeURIComponent(password)}`)

    if (res.status === 401) {
      setError('Contraseña incorrecta')
      setLoading(false)
      return
    }

    // Descargar CSV
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `participantes-prode-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    // Contar filas del CSV
    const text = await blob.text().catch(() => '')
    const lines = text.split('\n').filter(Boolean).length - 1 // -1 por header
    setStats({ count: lines })
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#0a0a0a' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">🫙</p>
          <h1 style={{ fontFamily: 'sans-serif', color: 'white', fontSize: '28px', fontWeight: 900, letterSpacing: '2px' }}>
            ADMIN EXPORT
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
            Prode Sabor Argento — Mundial 2026
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px',
              letterSpacing: '1px', marginBottom: '6px', fontFamily: 'monospace' }}>
              CONTRASEÑA ADMIN
            </label>
            <input
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDownload()}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                background: '#1e1e1e', border: '1.5px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'monospace',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#CE1126', fontSize: '13px', textAlign: 'center' }}>{error}</p>
          )}

          <button
            onClick={handleDownload}
            disabled={loading}
            style={{
              padding: '14px', background: '#74ACDF', color: 'white',
              fontWeight: 900, fontSize: '16px', letterSpacing: '2px',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              opacity: loading ? 0.5 : 1, fontFamily: 'sans-serif',
            }}
          >
            {loading ? 'DESCARGANDO...' : '⬇ DESCARGAR CSV'}
          </button>

          {stats && (
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,155,58,0.1)',
              border: '1px solid rgba(0,155,58,0.3)', borderRadius: '8px' }}>
              <p style={{ color: '#009B3A', fontSize: '14px', fontWeight: 700 }}>
                ✓ {stats.count} participantes exportados
              </p>
            </div>
          )}

          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center' }}>
            Incluye: nombre, email, teléfono, instagram, apodo, chimichurros
          </p>
        </div>
      </div>
    </main>
  )
}
