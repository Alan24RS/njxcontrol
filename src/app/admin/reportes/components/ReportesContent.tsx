'use client'

import { useState } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { ReporteAbonosVigentes } from '@/schemas/reportes'

import { ReporteAbonosCard } from './ReporteAbonosCard'
import { ReporteAbonosTable } from './ReporteAbonosTable'

interface ReportesContentProps {
  reportes: ReporteAbonosVigentes[]
  error: string | null
}

export function ReportesContent({ reportes, error }: ReportesContentProps) {
  const [selectedPlaya, setSelectedPlaya] =
    useState<ReporteAbonosVigentes | null>(null)

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalAbonos = reportes.reduce(
    (acc, playa) => acc + playa.total_abonos_vigentes,
    0
  )

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Playas</CardDescription>
            <CardTitle className="text-4xl">{reportes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Abonos Vigentes</CardDescription>
            <CardTitle className="text-4xl">{totalAbonos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Promedio por Playa</CardDescription>
            <CardTitle className="text-4xl">
              {reportes.length > 0
                ? Math.round((totalAbonos / reportes.length) * 10) / 10
                : 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tarjetas de playas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {reportes.map((reporte) => (
          <ReporteAbonosCard
            key={reporte.playa_id}
            reporte={reporte}
            onClick={() => setSelectedPlaya(reporte)}
          />
        ))}
      </div>

      {/* Detalle de abonos */}
      {selectedPlaya && (
        <Card>
          <CardHeader>
            <CardTitle>
              Detalle de Abonos - {selectedPlaya.playa_nombre}
            </CardTitle>
            <CardDescription>
              {selectedPlaya.total_abonos_vigentes} abono(s) vigente(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReporteAbonosTable abonos={selectedPlaya.detalle_abonos} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
