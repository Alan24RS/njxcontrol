import { NextResponse } from 'next/server'

import { getPerformancePlayeroTimeline } from '@/services/analytics/performance-playero'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playeroId = searchParams.get('playero_id')
  const fechaDesde = searchParams.get('fecha_desde')
  const fechaHasta = searchParams.get('fecha_hasta')

  if (!playeroId) {
    return NextResponse.json(
      { data: null, error: 'playero_id es requerido' },
      { status: 400 }
    )
  }

  const result = await getPerformancePlayeroTimeline({
    playero_id: playeroId,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined
  })

  if (result.error) {
    return NextResponse.json(result, { status: 400 })
  }

  return NextResponse.json(result)
}
