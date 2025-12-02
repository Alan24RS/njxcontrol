import { NextResponse } from 'next/server'

import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getPerformancePlayeroTimeline } from '@/services/analytics/performance-playero/getPerformancePlayeroTimeline'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const playero_id = url.searchParams.get('playero_id') || ''
  const fecha_desde = url.searchParams.get('fecha_desde') || undefined
  const fecha_hasta = url.searchParams.get('fecha_hasta') || undefined
  const intervalo = (url.searchParams.get('intervalo') || 'diario') as
    | 'diario'
    | 'semanal'
    | 'mensual'

  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if (!user.roles.includes(ROL.DUENO)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await getPerformancePlayeroTimeline({
    playero_id,
    fecha_desde,
    fecha_hasta,
    intervalo
  })

  if (error) {
    return NextResponse.json({ error }, { status: 400 })
  }

  return NextResponse.json({ data })
}
