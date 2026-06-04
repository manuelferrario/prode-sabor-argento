'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PixelChimi } from '@/components/PixelChimi'
import { ChimiLoader } from '@/components/ChimiLoader'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // Si ya hay sesión activa, ir directo al prode
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/prode')
      } else {
        setCheckingSession(false)
      }
    })
  }, [router])

  if (checkingSession) {
    return <ChimiLoader />
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      if (loginError.message?.includes('Invalid login') || loginError.message?.includes('invalid')) {
        setError('Email o contraseña incorrectos.')
      } else if (loginError.message?.includes('Email not confirmed')) {
        setError('Confirmá tu email primero. Revisá tu bandeja de entrada.')
      } else {
        setError('No pudimos iniciar sesión. Verificá tus datos.')
      }
      setLoading(false)
      return
    }

    router.push('/prode')
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Ingresá tu email primero.'); return }
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setResetSent(true)
    setLoading(false)
  }

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

          {resetSent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h1 className="font-brand text-white mb-2" style={{ fontSize: '36px', fontWeight: 900 }}>
                REVISÁ TU EMAIL
              </h1>
              <p className="text-white/50 text-sm mb-6">
                Si ese email está registrado, recibís un link para cambiar tu contraseña.
              </p>
              <button onClick={() => { setShowReset(false); setResetSent(false) }}
                className="text-sm underline" style={{ color: 'var(--celeste)' }}>
                Volver al login
              </button>
            </div>
          ) : showReset ? (
            <>
              <h1 className="font-brand text-white mb-1" style={{ fontSize: '42px', fontWeight: 900 }}>
                RECUPERAR
              </h1>
              <p className="text-white/40 text-sm mb-6">Te mandamos un link para cambiar tu contraseña.</p>
              <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
                <div>
                  <label className="font-pixel block text-white/40 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                    TU EMAIL
                  </label>
                  <input type="email" required placeholder="juan@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="input-base" />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'ENVIANDO...' : 'ENVIAR LINK →'}
                </button>
              </form>
              <button onClick={() => setShowReset(false)}
                className="block text-center text-white/30 text-xs mt-4 underline hover:text-white/60">
                Volver al login
              </button>
            </>
          ) : (
            <>
              <h1 className="font-brand text-white mb-1" style={{ fontSize: '52px', fontWeight: 900 }}>
                ENTRAR
              </h1>
              <p className="text-white/40 text-sm mb-6">Email y contraseña.</p>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="font-pixel block text-white/40 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                    EMAIL
                  </label>
                  <input type="email" required placeholder="juan@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="input-base" autoComplete="email" />
                </div>

                <div>
                  <label className="font-pixel block text-white/40 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                    CONTRASENA
                  </label>
                  <input type="password" required placeholder="Tu contraseña"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="input-base" autoComplete="current-password" />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'ENTRANDO...' : 'ENTRAR →'}
                </button>
              </form>

              <p className="text-center text-white/30 text-xs mt-3">
                No tenés cuenta?{' '}
                <Link href="/registro" className="underline hover:text-white/60 transition-colors">
                  Registrate gratis
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
