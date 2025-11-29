'use client'

import {
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  User
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { ReportePagosMensuales } from '@/schemas/reportes'

interface ReporteMensualCardProps {
  reporte: ReportePagosMensuales
  onClick: () => void
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
]

export function ReporteMensualCard({
  reporte,
  onClick
}: ReporteMensualCardProps) {
  const mesNombre = MESES[reporte.mes - 1]

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
          <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <CalendarDays className="h-3.5 w-3.5" />
            {mesNombre} {reporte.anio}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <CircleDollarSign className="h-4 w-4" />
              <span>Total</span>
            </div>
            <span className="text-xl font-bold">
              ${reporte.recaudacion_total.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <BadgeCheck className="h-4 w-4" />
              <span>Pagos</span>
            </div>
            <span className="text-xl font-bold">{reporte.total_pagos}</span>
          </div>
        </div>

        <div className="space-y-2 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ocupaciones:</span>
            <span className="font-medium">
              ${reporte.recaudacion_ocupaciones.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Boletas:</span>
            <span className="font-medium">
              ${reporte.recaudacion_boletas.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
