# Prode Sabor Argento — Mundial 2026

App de prode del Mundial 2026 para Sabor Argento.
Stack: Next.js 16 · Supabase · Vercel

## Setup local

```bash
git clone https://github.com/manuelferrario/prode-sabor-argento.git
cd prode-sabor-argento
npm install
cp .env.example .env.local
```

Completar `.env.local` con los valores reales y luego:

```bash
npm run dev
```

## Variables de entorno

| Variable | Donde conseguirla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `FOOTBALL_DATA_API_TOKEN` | football-data.org → cuenta |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` en local |
| `ADMIN_PASSWORD` | El mismo que esta en Vercel |
| `CRON_SECRET` | El mismo que esta en Vercel |

## URLs principales

| Ruta | Descripcion |
|---|---|
| `/` | Landing page |
| `/registro` | Registro de participantes |
| `/login` | Login |
| `/prode` | Fixture con predicciones |
| `/ranking` | Tabla de posiciones |
| `/admin` | Dashboard de administracion (requiere ADMIN_PASSWORD) |
| `/reset-password` | Cambio de contrasena |

## Operacion durante el torneo

Despues de cada partido: entrar a `/admin` → **SYNC RESULTADOS**.
Esto actualiza scores y recalcula chimichurros de todos los participantes.

El cron automatico corre todos los dias a las 6AM UTC (3AM Argentina).
