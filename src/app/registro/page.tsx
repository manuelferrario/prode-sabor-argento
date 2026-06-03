'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PixelChimi } from '@/components/PixelChimi'

function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'sa_device_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export default function RegistroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    apodo: '',
    instagram: false,
  })

  useEffect(() => { setDeviceId(getDeviceId()) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.instagram) {
      setError('Tenés que seguir a @saborargentoar en Instagram para participar.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Anti-trampa: un dispositivo = una cuenta
    if (deviceId) {
      const { data: sameDevice } = await supabase
        .from('participants')
        .select('email')
        .eq('device_id', deviceId)
        .single()
      if (sameDevice && sameDevice.email !== form.email) {
        setError(`Este dispositivo ya tiene una cuenta (${sameDevice.email}). Solo se permite una por dispositivo.`)
        setLoading(false)
        return
      }
    }

    // Verificar si el email ya está registrado
    const { data: existing } = await supabase
      .from('participants')
      .select('id')
      .eq('email', form.email)
      .single()

    if (existing) {
      setError('Ese email ya está registrado. ¿Querés ingresar?')
      setLoading(false)
      return
    }

    // 1. Crear usuario en Supabase Auth
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    })

    if (signUpError) {
      if (signUpError.message?.includes('already registered')) {
        setError('Ese email ya tiene cuenta. Ingresá desde el login.')
      } else {
        setError(`Error: ${signUpError.message}`)
      }
      setLoading(false)
      return
    }

    // 2. Insertar en participants
    const { error: insertError } = await supabase
      .from('participants')
      .insert({
        name: form.name,
        phone: form.phone,
        email: form.email,
        apodo: form.apodo.trim() || null,
        instagram_confirmed: form.instagram,
        device_id: deviceId || null,
      })

    if (insertError) {
      setError('Error al guardar datos. Intentá de nuevo.')
      setLoading(false)
      return
    }

    // 3. Login automático y redirigir al prode
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (loginError) {
      // Si el email no está confirmado aún en Supabase
      setError('Registrado. Podés ingresar desde el login.')
      router.push('/login')
      return
    }

    router.push('/prode')
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

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="font-brand text-white leading-none" style={{ fontSize: '52px', fontWeight: 900 }}>
              REGISTRATE
            </h1>
            <p className="text-white/40 text-sm mt-1">Gratis · Cargá tus datos y empezá a predecir</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-pixel" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                NOMBRE COMPLETO
              </label>
              <input type="text" required placeholder="Juan Pérez"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input-base" />
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-pixel" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                TELEFONO
              </label>
              <input type="tel" required placeholder="+54 9 11 1234-5678"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input-base" />
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-pixel" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                EMAIL
              </label>
              <input type="email" required placeholder="juan@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input-base" />
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-pixel" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                CONTRASENA
              </label>
              <input type="password" required placeholder="Mínimo 6 caracteres"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input-base" minLength={6} />
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-1.5 font-pixel" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                APODO <span className="text-white/25">(OPCIONAL)</span>
              </label>
              <input type="text" placeholder="Ej: El Flaco" aria-label="Apodo opcional"
                value={form.apodo} onChange={e => setForm(f => ({ ...f, apodo: e.target.value }))}
                className="input-base" maxLength={20} />
              {form.apodo.trim() && (
                <p className="text-white/30 text-xs mt-1">
                  En el ranking: <span className="text-white/60 font-semibold">
                    {form.name || 'Tu nombre'}{' '}
                    <span style={{ color: 'var(--celeste)' }}>&quot;{form.apodo.trim()}&quot;</span>
                  </span>
                </p>
              )}
            </div>

            {/* Instagram */}
            <label className="flex items-start gap-3 p-4 rounded-sm cursor-pointer transition-all"
              style={{
                background: form.instagram ? 'rgba(116,172,223,0.12)' : 'var(--surface)',
                border: form.instagram ? '1.5px solid var(--celeste)' : '1.5px solid var(--border)',
              }}>
              <div className="flex-shrink-0 mt-0.5">
                <input type="checkbox" checked={form.instagram}
                  onChange={e => setForm(f => ({ ...f, instagram: e.target.checked }))}
                  className="sr-only" />
                <div className="w-5 h-5 rounded-sm flex items-center justify-center transition-all"
                  style={{
                    background: form.instagram ? 'var(--celeste)' : 'transparent',
                    border: form.instagram ? 'none' : '2px solid rgba(255,255,255,0.2)',
                  }}>
                  {form.instagram && <span className="text-white text-xs font-bold">✓</span>}
                </div>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">
                  Sigo a{' '}
                  <a href="https://www.instagram.com/saborargentoar/" target="_blank" rel="noopener noreferrer"
                    className="font-bold" style={{ color: 'var(--celeste)' }}
                    onClick={e => e.stopPropagation()}>
                    @saborargentoar
                  </a>{' '}en Instagram
                </p>
                <p className="text-white/40 text-xs mt-0.5">Requisito para participar del sorteo</p>
              </div>
            </label>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'REGISTRANDO...' : 'REGISTRARME →'}
            </button>
          </form>

          <p className="text-center text-white/30 text-xs mt-4">
            Ya tenés cuenta?{' '}
            <Link href="/login" className="underline hover:text-white/60 transition-colors">
              Ingresá con tu email
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
