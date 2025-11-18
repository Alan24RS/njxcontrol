'use client'

import { MapPin, ParkingSquare, Users } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { ReporteAbonosVigentes } from '@/schemas/reportes'

interface ReporteAbonosCardProps {
  reporte: ReporteAbonosVigentes
  onClick: () => void
}

export function ReporteAbonosCard({
  reporte,
  onClick
}: ReporteAbonosCardProps) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {reporte.playa_nombre}
        </CardTitle>
        {reporte.direccion && (
          <CardDescription>{reporte.direccion}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span>Abonos vigentes</span>
          </div>
          <span className="text-2xl font-bold">
            {reporte.total_abonos_vigentes}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <ParkingSquare className="h-4 w-4" />
            <span>Plazas ocupadas</span>
          </div>
          <span className="text-2xl font-bold">
            {reporte.plazas_ocupadas_por_abono}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
