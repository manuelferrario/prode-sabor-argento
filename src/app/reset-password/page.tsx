'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { PixelChimi } from '@/components/PixelChimi'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const code = searchParams.get('code')

    async function init() {
      if (code) {
        // PKCE flow: intercambia el code por sesión
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) { router.replace('/login?error=reset-expired'); return }
        setReady(true)
      } else {
        // Ya hay sesión activa (ej: recarga de página)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) { setReady(true) }
        else { router.replace('/login') }
      }
    }

    init()
  }, [router, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6) { setError('Mínimo 6 caracteres.'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('No se pudo actualizar. Pedí un nuevo link desde el login.')
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.replace('/prode'), 2500)
  }

  if (!ready) return null

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <header className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--negro)' }}>
        <Link href="/"
          className="flex items-center justify-center transition-all hover:opacity-80 active:scale-95 flex-shrink-0"
          style={{ width: 36, height: 36, background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}
          aria-label="Volver al inicio">
          <span className="font-brand text-white" style={{ fontSize: '20px', lineHeight: 1 }}>←</span>
        </Link>
        <PixelChimi size={2} />
        <span className="font-brand text-white tracking-wide" style={{ fontSize: '18px', fontWeight: 900 }}>
          SABOR ARGENTO
        </span>
      </header>

      <div className="flex h-1">
        <div className="flex-1" style={{ background: 'var(--celeste)' }} />
        <div className="flex-1 bg-white" />
        <div className="flex-1" style={{ background: 'var(--celeste)' }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {done ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h1 className="font-brand text-white mb-2" style={{ fontSize: '36px', fontWeight: 900 }}>
                LISTO!
              </h1>
              <p className="text-white/50 text-sm">
                Contraseña actualizada. Te mandamos al prode...
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-brand text-white mb-1" style={{ fontSize: '42px', fontWeight: 900 }}>
                NUEVA CLAVE
              </h1>
              <p className="text-white/40 text-sm mb-6">Elegí una nueva contraseña.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="font-pixel block text-white/40 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                    NUEVA CONTRASENA
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-base"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="font-pixel block text-white/40 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                    REPETIR CONTRASENA
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Repetí la contraseña"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="input-base"
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm px-3 py-2"
                    style={{ background: 'rgba(206,17,38,0.1)', border: '1px solid rgba(206,17,38,0.3)' }}>
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'GUARDANDO...' : 'GUARDAR NUEVA CLAVE →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
