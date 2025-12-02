'use client'

import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  DollarSign,
  MapPin,
  TrendingUp,
  User
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { PerformancePlayeroRow } from '@/services/analytics/performance-playero'

interface PerformancePlayeroCardProps {
  data: PerformancePlayeroRow
  incluirDiasSinActividad: boolean
  totalDiasPeriodo?: number
}

export function PerformancePlayeroCard({
  data,
  incluirDiasSinActividad,
  totalDiasPeriodo
}: PerformancePlayeroCardProps) {
  const fechaUltimo = data.fechaUltimoTurno
    ? new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).format(data.fechaUltimoTurno)
    : '—'

  const diasParaPromedio = incluirDiasSinActividad
    ? totalDiasPeriodo || data.totalDiasTrabajados
    : data.totalDiasTrabajados

  const promedioDiario =
    diasParaPromedio > 0 ? data.totalHorasTrabajadas / diasParaPromedio : 0

  const promedioHsTurno =
    data.totalTurnos > 0 ? data.totalHorasTrabajadas / data.totalTurnos : 0
  const tieneIrregularidad = promedioHsTurno > 12

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              {data.playeroNombre}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {data.playaNombre}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta de irregularidad */}
        {tieneIrregularidad && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Irregularidad detectada</AlertTitle>
            <AlertDescription>
              El promedio de {promedioHsTurno.toFixed(1)} hs/turno excede las 12
              horas. Esto puede indicar turnos no cerrados correctamente o
              registros superpuestos.
            </AlertDescription>
          </Alert>
        )}

        {/* Primary Metric */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4" />
            <span>Recaudación Total</span>
          </div>
          <span className="text-2xl font-bold text-green-600">
            $
            {data.volumenRecaudadoTotal.toLocaleString('es-AR', {
              minimumFractionDigits: 0
            })}
          </span>
        </div>

        {/* Secondary Metrics */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horas trabajadas:
            </span>
            <span className="font-medium">
              {data.totalHorasTrabajadas.toFixed(1)} hs
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-muted-foreground flex items-center gap-2"
              title="Promedio de horas por día (basado en días con o sin actividad según selección)"
            >
              <Clock className="h-4 w-4" />
              Promedio hs/día:
            </span>
            <span className="font-medium">{promedioDiario.toFixed(1)} hs</span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-muted-foreground flex items-center gap-2"
              title="Promedio de horas por turno (duración del turno recortada al período)"
            >
              <Clock className="h-4 w-4" />
              Promedio hs/turno:
            </span>
            <span className="font-medium">{promedioHsTurno.toFixed(1)} hs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" />
              Ocupaciones cerradas:
            </span>
            <span className="font-medium">{data.ocupacionesCerradas}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Turnos realizados:</span>
            <span className="font-medium">{data.totalTurnos}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span title="Recaudación promedio por ocupación/boleta cerrada">
                Ticket promedio:
              </span>
            </span>
            <span className="font-medium">
              $
              {data.ticketPromedio.toLocaleString('es-AR', {
                minimumFractionDigits: 0
              })}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 text-xs">
            <span className="text-muted-foreground">Último turno:</span>
            <span className="font-medium">{fechaUltimo}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
