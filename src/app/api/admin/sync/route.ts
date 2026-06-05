import { NextResponse } from 'next/server'

// Proxy del sync-matches para poder llamarlo desde el dashboard sin exponer CRON_SECRET al cliente
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('password') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/sync-matches`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
