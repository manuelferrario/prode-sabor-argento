import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: participants } = await supabase
    .from('participants')
    .select('name, email, phone, instagram_user, apodo, total_chimichurros, instagram_confirmed, created_at')
    .order('total_chimichurros', { ascending: false })

  if (!participants) {
    return NextResponse.json({ error: 'No data' }, { status: 500 })
  }

  // Generar CSV
  const headers = ['Nombre', 'Email', 'Telefono', 'Instagram', 'Apodo', 'Chimichurros', 'Siguio_IG', 'Fecha_Registro']
  const rows = participants.map(p => [
    `"${p.name ?? ''}"`,
    `"${p.email ?? ''}"`,
    `"${p.phone ?? ''}"`,
    `"${p.instagram_user ?? ''}"`,
    `"${p.apodo ?? ''}"`,
    p.total_chimichurros ?? 0,
    p.instagram_confirmed ? 'SI' : 'NO',
    `"${new Date(p.created_at).toLocaleDateString('es-AR')}"`,
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const filename = `participantes-prode-${new Date().toISOString().split('T')[0]}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
