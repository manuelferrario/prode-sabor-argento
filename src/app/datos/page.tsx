'use client'

import { useState } from 'react'

export default function DatosPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleDownload() {
    if (!password.trim()) { setError('Ingresa la contrasena'); return }
    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch(`/api/exportar?password=${encodeURIComponent(password)}`)

    if (res.status === 401) {
      setError('Contrasena incorrecta')
      setLoading(false)
      return
    }

    if (!res.ok) {
      setError('Error al exportar')
      setLoading(false)
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `participantes-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    const text = await new Response(blob).text().catch(() => '')
    const count = text.split('\n').filter(Boolean).length - 1
    setSuccess(`${count} participantes exportados`)
    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🫙</div>
          <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 900, letterSpacing: '2px', fontFamily: 'sans-serif', margin: 0 }}>
            EXPORTAR DATOS
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '6px', fontFamily: 'sans-serif' }}>
            Prode Sabor Argento — Mundial 2026
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>
              CONTRASENA
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDownload()}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: '8px',
                background: '#1e1e1e', border: '1.5px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '16px', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'monospace',
              }}
            />
          </div>

          {error && <p style={{ color: '#CE1126', fontSize: '13px', textAlign: 'center', fontFamily: 'sans-serif' }}>{error}</p>}
          {success && <p style={{ color: '#009B3A', fontSize: '14px', textAlign: 'center', fontWeight: 700, fontFamily: 'sans-serif' }}>✓ {success}</p>}

          <button
            onClick={handleDownload}
            disabled={loading}
            style={{
              padding: '14px', background: '#74ACDF', color: 'white',
              fontWeight: 900, fontSize: '16px', letterSpacing: '2px',
              border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1, fontFamily: 'sans-serif',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'DESCARGANDO...' : '⬇  DESCARGAR CSV'}
          </button>

          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center', fontFamily: 'sans-serif' }}>
            Nombre · Email · Telefono · Instagram · Apodo · Chimichurros
          </p>
        </div>
      </div>
    </main>
  )
}
