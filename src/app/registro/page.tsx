'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PixelChimi } from '@/components/PixelChimi'

/** Ícono ojo SVG monocromático — sin emoji */
function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        // Ojo abierto
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        // Ojo cerrado (tachado)
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  )
}

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

  // Password visibility
  const [showPassword, setShowPassword] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)

  // Instagram flow: abrió IG → puede confirmar
  const [igOpened, setIgOpened] = useState(false)

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    phone: '',
    email: '',
    password: '',
    password2: '',
    apodo: '',
    instagram: false,
    instagramUser: '',
  })

  useEffect(() => { setDeviceId(getDeviceId()) }, [])

  // Si ya hay sesión activa, ir directo al prode
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/prode')
    })
  }, [router])

  function openInstagram() {
    window.open('https://www.instagram.com/saborargentoar/', '_blank')
    setIgOpened(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.instagram) {
      setError('Tenés que seguir a @saborargentoar en Instagram para participar.')
      return
    }
    if (!form.instagramUser.trim()) {
      setError('Ingresá tu usuario de Instagram para que podamos verificarlo.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (form.password !== form.password2) {
      setError('Las contraseñas no coinciden. Revisalas.')
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

    // Verificar email duplicado
    const { data: existingEmail } = await supabase
      .from('participants')
      .select('id')
      .eq('email', form.email)
      .single()

    if (existingEmail) {
      setError('Ese email ya está registrado. ¿Querés ingresar?')
      setLoading(false)
      return
    }

    // Verificar teléfono duplicado
    const phoneClean = form.phone.replace(/\s/g, '')
    const { data: existingPhone } = await supabase
      .from('participants')
      .select('id')
      .eq('phone', phoneClean)
      .single()

    if (existingPhone) {
      setError('Ese número de teléfono ya está registrado con otra cuenta.')
      setLoading(false)
      return
    }

    const fullName = `${form.nombre.trim()} ${form.apellido.trim()}`

    // Crear usuario en Supabase Auth
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: fullName } },
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

    // Insertar en participants — teléfono normalizado sin espacios
    const { error: insertError } = await supabase
      .from('participants')
      .insert({
        name: fullName,
        phone: phoneClean,
        email: form.email,
        apodo: form.apodo.trim() || null,
        instagram_confirmed: form.instagram,
        instagram_user: form.instagramUser.trim().replace('@', ''),
        device_id: deviceId || null,
      })

    if (insertError) {
      setError('Error al guardar datos. Intentá de nuevo.')
      setLoading(false)
      return
    }

    // Login automático
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (loginError) {
      setError('Registrado. Podés ingresar desde el login.')
      router.push('/login')
      return
    }

    router.push('/prode')
  }

  const inputStyle = {
    background: 'var(--surface-2)',
    border: '1.5px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--foreground)',
    padding: '12px 16px',
    width: '100%',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <header className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--negro)' }}>
        <Link href="/"
          className="flex items-center justify-center transition-all hover:opacity-80 flex-shrink-0"
          style={{ width: 36, height: 36, background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}
          aria-label="Volver">
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

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="font-brand text-white leading-none" style={{ fontSize: '52px', fontWeight: 900 }}>
              REGISTRATE
            </h1>
            <p className="text-white/40 text-sm mt-1">Gratis · Cargá bien tus datos para participar del sorteo</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Nombre + Apellido */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block font-pixel text-white/50 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                  NOMBRE
                </label>
                <input type="text" required placeholder="Juan"
                  value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div className="flex-1">
                <label className="block font-pixel text-white/50 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                  APELLIDO
                </label>
                <input type="text" required placeholder="Pérez"
                  value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
                  style={inputStyle} />
              </div>
            </div>

            {/* Teléfono con aviso */}
            <div>
              <label className="block font-pixel text-white/50 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                TELEFONO
              </label>
              <input type="tel" required placeholder="+54 9 11 1234-5678"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                style={inputStyle} />
              <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--dorado)' }}>
                <span>⚠️</span>
                <span>Ponelo bien — te contactamos por acá si ganás</span>
              </p>
            </div>

            {/* Email con aviso */}
            <div>
              <label className="block font-pixel text-white/50 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                EMAIL
              </label>
              <input type="email" required placeholder="juan@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={inputStyle} />
              <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--dorado)' }}>
                <span>⚠️</span>
                <span>Ponelo bien — te avisamos los resultados por acá</span>
              </p>
            </div>

            {/* Contraseña con ojo */}
            <div>
              <label className="block font-pixel text-white/50 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                CONTRASENA
              </label>
              <div className="relative" style={{ isolation: 'isolate' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required placeholder="Minimo 6 caracteres"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  minLength={6}
                />
                <button type="button"
                  onMouseDown={e => { e.preventDefault(); setShowPassword(s => !s) }}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    color: showPassword ? 'var(--celeste)' : 'rgba(255,255,255,0.4)' }}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {/* Repetir contraseña */}
            <div>
              <label className="block font-pixel text-white/50 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                REPETIR CONTRASENA
              </label>
              <div className="relative" style={{ isolation: 'isolate' }}>
                <input
                  type={showPassword2 ? 'text' : 'password'}
                  required placeholder="Repeti tu contrasena"
                  value={form.password2}
                  onChange={e => setForm(f => ({ ...f, password2: e.target.value }))}
                  style={{
                    ...inputStyle,
                    paddingRight: '44px',
                    borderColor: form.password2 && form.password !== form.password2
                      ? '#CE1126'
                      : form.password2 && form.password === form.password2
                      ? '#009B3A'
                      : 'var(--border)',
                  }}
                  minLength={6}
                />
                <button type="button"
                  onMouseDown={e => { e.preventDefault(); setShowPassword2(s => !s) }}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    color: showPassword2 ? 'var(--celeste)' : 'rgba(255,255,255,0.4)' }}>
                  <EyeIcon open={showPassword2} />
                </button>
              </div>
              {form.password2 && form.password !== form.password2 && (
                <p className="mt-1.5 text-xs" style={{ color: '#CE1126' }}>Las contraseñas no coinciden</p>
              )}
              {form.password2 && form.password === form.password2 && (
                <p className="mt-1.5 text-xs" style={{ color: '#009B3A' }}>✓ Las contraseñas coinciden</p>
              )}
            </div>

            {/* Apodo opcional */}
            <div>
              <label className="block font-pixel text-white/50 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                APODO <span className="text-white/25">(OPCIONAL)</span>
              </label>
              <input type="text" placeholder="Ej: El Flaco" aria-label="Apodo opcional"
                value={form.apodo} onChange={e => setForm(f => ({ ...f, apodo: e.target.value }))}
                style={inputStyle} maxLength={20} />
              {form.apodo.trim() && (
                <p className="text-white/30 text-xs mt-1.5">
                  En el ranking:{' '}
                  <span className="text-white/60 font-semibold">
                    {form.nombre || 'Tu nombre'}{' '}
                    <span style={{ color: 'var(--celeste)' }}>&quot;{form.apodo.trim()}&quot;</span>
                  </span>
                </p>
              )}
            </div>

            {/* Instagram — flujo en 2 pasos */}
            <div className="flex flex-col gap-3 p-4 rounded-sm"
              style={{
                background: form.instagram ? 'rgba(116,172,223,0.1)' : 'var(--surface)',
                border: form.instagram ? '1.5px solid var(--celeste)' : '1.5px solid var(--border)',
              }}>
              <div>
                <p className="font-brand text-white" style={{ fontSize: '16px', fontWeight: 900 }}>
                  SEGUIR EN INSTAGRAM
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  Requisito obligatorio para participar del sorteo
                </p>
              </div>

              {/* Paso 1: abrir Instagram */}
              {!form.instagram && (
                <button
                  type="button"
                  onClick={openInstagram}
                  className="flex items-center justify-center gap-2 py-3 font-brand transition-all active:scale-95"
                  style={{
                    background: igOpened ? 'rgba(116,172,223,0.15)' : 'var(--celeste)',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    border: igOpened ? '1.5px solid var(--celeste)' : 'none',
                  }}
                >
                  {igOpened ? '↗ VER @SABORARGENTOAR' : '📸 ABRIR INSTAGRAM →'}
                </button>
              )}

              {/* Paso 2: confirmar que lo siguió (solo aparece después de abrir IG) */}
              {igOpened && !form.instagram && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, instagram: true }))}
                  className="flex items-center gap-3 w-full transition-all active:scale-[0.98]"
                  style={{
                    background: 'rgba(0,155,58,0.08)',
                    border: '1.5px solid rgba(0,155,58,0.45)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    animation: 'pulse-soft 2s ease-in-out infinite',
                  }}
                >
                  {/* Checkbox vacío */}
                  <div style={{
                    width: 24, height: 24, flexShrink: 0,
                    border: '2px solid #009B3A',
                    borderRadius: '5px',
                    background: 'rgba(0,155,58,0.1)',
                  }} />
                  <div className="text-left">
                    <p className="font-brand text-white" style={{ fontSize: '16px', fontWeight: 900, lineHeight: 1.2 }}>
                      YA SEGUÍ A @SABORARGENTOAR
                    </p>
                    <p className="text-white/40 mt-0.5" style={{ fontSize: '12px' }}>
                      Tocá acá para confirmar
                    </p>
                  </div>
                </button>
              )}

              {/* Confirmado → pedir usuario de IG */}
              {form.instagram && (
                <>
                  <div className="flex items-center gap-2 py-1">
                    <span className="text-xl">✅</span>
                    <span className="text-white/80 text-sm font-semibold">Seguís a @saborargentoar</span>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, instagram: false, instagramUser: '' }))}
                      className="ml-auto text-white/30 text-xs hover:text-white/60"
                    >
                      deshacer
                    </button>
                  </div>

                  {/* Campo usuario IG */}
                  <div>
                    <label className="block font-pixel text-white/50 mb-1.5" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                      TU USUARIO DE INSTAGRAM
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-semibold text-sm">@</span>
                      <input
                        type="text"
                        required
                        placeholder="tu_usuario"
                        value={form.instagramUser}
                        onChange={e => setForm(f => ({ ...f, instagramUser: e.target.value.replace('@', '') }))}
                        style={{ ...inputStyle, paddingLeft: '28px' }}
                        autoCapitalize="none"
                        autoCorrect="off"
                      />
                    </div>
                    <p className="mt-1.5 text-xs" style={{ color: 'var(--celeste)' }}>
                      Lo verificamos antes de entregar los premios
                    </p>
                  </div>
                </>
              )}

              <p className="text-white/30 text-xs">
                La participación en el sorteo está sujeta a verificación manual de seguidores.
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center py-2 px-3"
                style={{ background: 'rgba(206,17,38,0.1)', border: '1px solid rgba(206,17,38,0.3)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || !form.instagram}
              className="btn-primary w-full disabled:opacity-40 mt-1"
              style={{ fontSize: '20px' }}>
              {loading ? 'REGISTRANDO...' : 'REGISTRARME →'}
            </button>

          </form>

          <p className="text-center text-white/30 text-xs mt-5">
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
