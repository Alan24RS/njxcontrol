import { redirect } from 'next/navigation'

import { PageContainer, PageHeader } from '@/components/layout'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { MessageCard } from '@/components/ui/MessageCard'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import type { PerformancePlayeroRow } from '@/services/analytics/performance-playero'
import { getPerformancePlayero } from '@/services/analytics/performance-playero'
import { getPlayas } from '@/services/playas'

import {
  PerformancePlayeroCard,
  PerformancePlayeroChartWrapper,
  PerformancePlayeroFilters
} from './components'

type SearchParams = {
  fecha_desde?: string
  fecha_hasta?: string
  playa_id?: string
  playero_id?: string
  incluir_dias_sin_actividad?: string
  excluir_irregulares?: string
  aplicar?: string
}

export default async function PerformancePlayeroPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/auth/login')
  }

  if (!user.roles.includes(ROL.DUENO)) {
    return (
      <PageContainer className="px-6">
        <MessageCard
          title="Acceso restringido"
          description="Esta página es exclusiva para dueños de playas"
          type="warning"
        />
      </PageContainer>
    )
  }

  const params = await searchParams

  // Fetch user's playas
  const { data: userPlayas } = await getPlayas({ limit: 100 })
  const playas = userPlayas || []

  const shouldLoad = params.aplicar === '1'
  let fetchedRows: PerformancePlayeroRow[] | null = null
  let error: string | null = null
  if (shouldLoad) {
    const result = await getPerformancePlayero({
      fecha_desde: params.fecha_desde,
      fecha_hasta: params.fecha_hasta,
      playa_id: params.playa_id,
      playero_id: params.playero_id,
      incluir_dias_sin_actividad: params.incluir_dias_sin_actividad === 'true',
      excluir_irregulares: params.excluir_irregulares === 'true'
    })
    fetchedRows = result.data
    error = result.error
  }

  if (error) {
    return (
      <PageContainer className="px-6">
        <PageHeader
          title="Performance de Playeros"
          description="Analiza el rendimiento individual de cada playero"
        />
        <MessageCard
          title="Error al cargar datos"
          description={error}
          type="error"
        />
      </PageContainer>
    )
  }

  const performanceData = shouldLoad && fetchedRows ? fetchedRows : []

  const incluirDiasSinActividad = params.incluir_dias_sin_actividad === 'true'

  // Calculate total days in period
  const totalDiasPeriodo =
    params.fecha_desde && params.fecha_hasta
      ? Math.ceil(
          (new Date(params.fecha_hasta).getTime() -
            new Date(params.fecha_desde).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : undefined

  // Calculate summary stats
  const totalRecaudacion = performanceData.reduce(
    (sum, p) => sum + p.volumenRecaudadoTotal,
    0
  )
  const totalHoras = performanceData.reduce(
    (sum, p) => sum + p.totalHorasTrabajadas,
    0
  )
  const totalOcupaciones = performanceData.reduce(
    (sum, p) => sum + p.ocupacionesCerradas,
    0
  )

  // Playero con más horas trabajadas
  const playeroMasHoras =
    performanceData.length > 0
      ? performanceData.reduce((max, p) =>
          p.totalHorasTrabajadas > max.totalHorasTrabajadas ? p : max
        )
      : null

  // Playero con mayor volumen de ocupaciones cerradas
  const playeroMasOcupaciones =
    performanceData.length > 0
      ? performanceData.reduce((max, p) =>
          p.ocupacionesCerradas > max.ocupacionesCerradas ? p : max
        )
      : null

  // Carga de trabajo promedio (horas totales / turnos totales)
  const totalTurnos = performanceData.reduce((sum, p) => sum + p.totalTurnos, 0)
  const cargaTrabajoPromedio = totalTurnos > 0 ? totalHoras / totalTurnos : 0

  return (
    <PageContainer className="px-6">
      <PageHeader
        title="Performance de Playeros"
        description="Rendimiento individual: horas trabajadas, ocupaciones cerradas, y volumen recaudado"
      />

      <div className="space-y-6">
        {/* Filtros */}
        <PerformancePlayeroFilters playas={playas} />

        {/* Summary Cards */}
        {shouldLoad ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Recaudación Total</CardDescription>
                <CardTitle className="text-4xl">
                  $
                  {totalRecaudacion.toLocaleString('es-AR', {
                    minimumFractionDigits: 0
                  })}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Horas Trabajadas</CardDescription>
                <CardTitle className="text-4xl">
                  {totalHoras.toFixed(1)} hs
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Ocupaciones Cerradas</CardDescription>
                <CardTitle className="text-4xl">{totalOcupaciones}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <MessageCard
            title="Configura los filtros"
            description="Aplica un rango de fechas y opcionalmente playa o playero para ver el reporte."
            type="info"
          />
        )}

        {/* Performance Highlights */}
        {shouldLoad && performanceData.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Playero con Más Horas</CardDescription>
                <CardTitle className="text-2xl">
                  {playeroMasHoras?.playeroNombre}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {playeroMasHoras?.totalHorasTrabajadas.toFixed(1)} hs en{' '}
                  {playeroMasHoras?.playaNombre}
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Mayor Volumen de Ocupaciones</CardDescription>
                <CardTitle className="text-2xl">
                  {playeroMasOcupaciones?.playeroNombre}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {playeroMasOcupaciones?.ocupacionesCerradas} cerradas,{' '}
                  {playeroMasOcupaciones?.ocupacionesAbiertas} abiertas
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader
                className="pb-3"
                title="Promedio global: suma de horas de todos los playeros / total de turnos en el rango"
              >
                <CardDescription>Promedio Global hs/turno</CardDescription>
                <CardTitle className="text-2xl">
                  {cargaTrabajoPromedio.toFixed(1)} hs/turno
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {totalTurnos} turnos acumulados en el período
                </p>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Performance Cards */}
        {shouldLoad &&
          (performanceData.length === 0 ? (
            <MessageCard
              title="Sin datos"
              description="No se encontraron registros para los filtros seleccionados."
              type="info"
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {performanceData.map((perf) => (
                <PerformancePlayeroCard
                  key={`${perf.playeroId}-${perf.playaId}`}
                  data={perf}
                  incluirDiasSinActividad={incluirDiasSinActividad}
                  totalDiasPeriodo={totalDiasPeriodo}
                />
              ))}
            </div>
          ))}

        {/* Chart Section: actividad por playero */}
        {shouldLoad && (
          <PerformancePlayeroChartWrapper
            playeros={performanceData}
            fechaDesde={params.fecha_desde}
            fechaHasta={params.fecha_hasta}
          />
        )}
      </div>
    </PageContainer>
  )
}
