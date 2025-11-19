'use client'

import { BadgeCheck, CircleDollarSign, Clock, MapPin, User } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { ReporteOcupacionesPorTurno } from '@/schemas/reportes'

interface ReporteTurnoCardProps {
  reporte: ReporteOcupacionesPorTurno
  onClick: () => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}/${month} ${hours}:${minutes}`
}

export function ReporteTurnoCard({ reporte, onClick }: ReporteTurnoCardProps) {
  const esActivo = !reporte.turno_fecha_fin

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              {reporte.playa_nombre}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {reporte.playero_nombre}
            </CardDescription>
          </div>
          {esActivo && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              Activo
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          <span>
            {formatDate(reporte.turno_fecha_inicio)}
            {reporte.turno_fecha_fin &&
              ` - ${formatDate(reporte.turno_fecha_fin)}`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <BadgeCheck className="h-4 w-4" />
              <span>Ocupaciones</span>
            </div>
            <span className="text-xl font-bold">
              {reporte.total_ocupaciones}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <CircleDollarSign className="h-4 w-4" />
              <span>Recaudado</span>
            </div>
            <span className="text-xl font-bold">
              ${reporte.recaudacion_total.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-2 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Finalizadas:</span>
            <span className="font-medium">
              {reporte.ocupaciones_finalizadas}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Activas:</span>
            <span className="font-medium">{reporte.ocupaciones_activas}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
