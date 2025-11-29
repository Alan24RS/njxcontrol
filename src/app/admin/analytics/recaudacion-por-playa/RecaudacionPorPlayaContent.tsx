'use client'

import { useMemo, useState } from 'react'

import { Download, Info, TrendingDown, TrendingUp } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetPlayeros } from '@/hooks/queries/analytics/useGetPlayeros'
import { useRecaudacionPorPlaya } from '@/hooks/queries/analytics/useRecaudacionPorPlaya'
import { useGetUserPlayas } from '@/hooks/queries/playas/useGetUserPlayas'
import type { RecaudacionPorPlayaFiltersInput } from '@/schemas/analytics/recaudacion-por-playa'
import { exportRecaudacionToExcel } from '@/utils/analytics'

import { RecaudacionPorPlayaChart } from './components/RecaudacionPorPlayaChart'
import { RecaudacionPorPlayaFilters } from './components/RecaudacionPorPlayaFilters'
import { RecaudacionPorPlayaTable } from './components/RecaudacionPorPlayaTable'

export function RecaudacionPorPlayaContent() {
  const [filters, setFilters] = useState<RecaudacionPorPlayaFiltersInput>({
    fecha_desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    fecha_hasta: new Date(),
    playa_id: null
  })

  const [enabled, setEnabled] = useState<boolean>(false)
  const [contarSoloDiasActivos, setContarSoloDiasActivos] =
    useState<boolean>(true)
  const { data, isLoading, isError, error, refetch } = useRecaudacionPorPlaya(
    filters,
    enabled
  )
  const { playas, isLoading: isLoadingPlayas } = useGetUserPlayas()
  const { data: playeros, isLoading: isLoadingPlayeros } = useGetPlayeros(
    playas?.map((p) => p.id)
  )
  const estadisticas = useMemo(() => {
    if (!data || data.dataDiaria.length === 0) return null

    const diasTotales =
      Math.ceil(
        (filters.fecha_hasta.getTime() - filters.fecha_desde.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1

    const diasConActividad = data.dataDiaria.filter(
      (d) => d.recaudacion_total > 0
    ).length
    const diasParaPromedio = contarSoloDiasActivos
      ? diasConActividad
      : diasTotales

    const promedioDiario =
      diasParaPromedio > 0
        ? data.totales.recaudacion_total / diasParaPromedio
        : 0

    const diasOrdenados = [...data.dataDiaria]
      .filter((d) => d.recaudacion_total > 0)
      .sort((a, b) => b.recaudacion_total - a.recaudacion_total)

    const diaMejor = diasOrdenados[0] ?? null
    const diaPeor = diasOrdenados[diasOrdenados.length - 1] ?? null

    return {
      diasTotales,
      diasConActividad,
      promedioDiario,
      diaMejor,
      diaPeor
    }
  }, [data, filters.fecha_desde, filters.fecha_hasta, contarSoloDiasActivos])

  const onFiltersSubmit = (next: RecaudacionPorPlayaFiltersInput) => {
    setFilters(next)
    if (!enabled) setEnabled(true)
    // Forzar refetch con los nuevos filtros
    setTimeout(() => refetch(), 0)
  }

  const handleExport = () => {
    if (data && data.data.length > 0) {
      exportRecaudacionToExcel(data.data)
    }
  }

  return (
    <div className="m-2 space-y-6">
      {/* Filtros */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Filtros</h3>
        <p className="text-muted-foreground text-sm">
          Define rango de fechas, playa, playero y tipo de ingreso.
        </p>
      </div>
      <RecaudacionPorPlayaFilters
        playas={
          playas
            ?.filter((p) => p.nombre) // Filtrar playas sin nombre
            .map((p) => ({
              playa_id: p.id,
              nombre: p.nombre!
            })) || []
        }
        playeros={playeros || []}
        onFilterChange={onFiltersSubmit}
        isLoadingPlayas={isLoadingPlayas}
        isLoadingPlayeros={isLoadingPlayeros}
      />
      {/* Mensaje informativo inicial */}
      {!enabled && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Instrucciones:</strong> Selecciona un rango de fechas y
            ajusta los filtros según necesites. Luego presiona{' '}
            <strong>Filtrar</strong> para generar el reporte de recaudación.
            Puedes filtrar por playa específica, playero y tipo de ingreso
            (abonos u ocupaciones).
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      {data && (
        <>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Resumen de Ingresos</h3>
            <p className="text-muted-foreground text-sm">
              Totales y estadísticas clave del periodo seleccionado.
            </p>
          </div>
          {/* Información de filtros activos */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Reporte generado:</strong>{' '}
              {new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
                filters.fecha_desde
              )}{' '}
              al{' '}
              {new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
                filters.fecha_hasta
              )}
              {filters.playa_id && (
                <span>
                  {' '}
                  • Playa:{' '}
                  {playas?.find((p) => p.id === filters.playa_id)?.nombre ||
                    'Seleccionada'}
                </span>
              )}
              {filters.playero_id && (
                <span>
                  {' '}
                  • Playero:{' '}
                  {playeros?.find((p) => p.playero_id === filters.playero_id)
                    ?.usuario_nombre || 'Seleccionado'}
                </span>
              )}
              {filters.tipo && (
                <span>
                  {' '}
                  • Tipo: {filters.tipo === 'ABONO' ? 'Abonos' : 'Ocupaciones'}
                </span>
              )}
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-card rounded-lg border p-6">
              <div className="text-muted-foreground text-sm font-medium">
                Recaudación Total
              </div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  minimumFractionDigits: 0
                }).format(data.totales.recaudacion_total)}
              </div>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <div className="text-muted-foreground text-sm font-medium">
                Recaudación Abonos
              </div>
              <div className="mt-2 text-3xl font-bold text-green-700">
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  minimumFractionDigits: 0
                }).format(data.totales.recaudacion_abonos)}
              </div>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <div className="text-muted-foreground text-sm font-medium">
                Recaudación Ocupaciones
              </div>
              <div className="mt-2 text-3xl font-bold text-orange-600">
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  minimumFractionDigits: 0
                }).format(data.totales.recaudacion_ocupaciones)}
              </div>
            </div>
          </div>

          {/* Estadísticas adicionales */}
          {estadisticas && (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-sm font-medium">
                    Promedio Diario
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={contarSoloDiasActivos}
                      onChange={(e) =>
                        setContarSoloDiasActivos(e.target.checked)
                      }
                      className="rounded"
                    />
                    <span className="text-muted-foreground">
                      Solo días activos
                    </span>
                  </label>
                </div>
                <div className="mt-2 text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 0
                  }).format(estadisticas.promedioDiario)}
                </div>
                <div className="text-muted-foreground mt-1 text-xs">
                  {contarSoloDiasActivos
                    ? `${estadisticas.diasConActividad} días con actividad`
                    : `${estadisticas.diasTotales} días totales`}
                </div>
              </div>

              <div className="bg-card rounded-lg border p-6">
                <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Día con Más Recaudación
                </div>
                {estadisticas.diaMejor ? (
                  <>
                    <div className="mt-2 text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                        minimumFractionDigits: 0
                      }).format(estadisticas.diaMejor.recaudacion_total)}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {new Intl.DateTimeFormat('es-AR', {
                        dateStyle: 'long'
                      }).format(new Date(estadisticas.diaMejor.fecha))}
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground mt-2 text-sm">
                    Sin datos
                  </div>
                )}
              </div>

              <div className="bg-card rounded-lg border p-6">
                <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  Día con Menos Recaudación
                </div>
                {estadisticas.diaPeor ? (
                  <>
                    <div className="mt-2 text-2xl font-bold text-orange-600">
                      {new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                        minimumFractionDigits: 0
                      }).format(estadisticas.diaPeor.recaudacion_total)}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {new Intl.DateTimeFormat('es-AR', {
                        dateStyle: 'long'
                      }).format(new Date(estadisticas.diaPeor.fecha))}
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground mt-2 text-sm">
                    Sin datos
                  </div>
                )}
              </div>

              <div className="bg-card rounded-lg border p-6">
                <div className="text-muted-foreground text-sm font-medium">
                  Días con Actividad
                </div>
                <div className="mt-2 text-2xl font-bold text-purple-600">
                  {estadisticas.diasConActividad}
                </div>
                <div className="text-muted-foreground mt-1 text-xs">
                  de {estadisticas.diasTotales} días (
                  {Math.round(
                    (estadisticas.diasConActividad / estadisticas.diasTotales) *
                      100
                  )}
                  %)
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Error al cargar datos: {error?.message || 'Error desconocido'}
          </AlertDescription>
        </Alert>
      )}

      {/* Gráfico */}
      {data && data.dataDiaria.length > 0 && (
        <>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Evolución en el Tiempo</h3>
            <p className="text-muted-foreground text-sm">
              Visualiza la recaudación diaria, semanal o mensual.
              <br />
              Desliza horizontalmente para explorar.
            </p>
          </div>
          <RecaudacionPorPlayaChart
            data={data.dataDiaria}
            fechaDesde={filters.fecha_desde}
            fechaHasta={filters.fecha_hasta}
          />

          {/* Tabla */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Detalle de Pagos</h3>
                <p className="text-muted-foreground text-sm">
                  Lista de pagos con herramientas de filtrado y exportación.
                </p>
              </div>
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar a Excel
              </Button>
            </div>
          </div>
          <RecaudacionPorPlayaTable data={data.pagos} />
        </>
      )}

      {/* Sin datos */}
      {data && data.data.length === 0 && (
        <Alert>
          <AlertDescription>
            No se encontraron datos para los filtros seleccionados.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
