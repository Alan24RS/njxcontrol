'use client'

import { useState } from 'react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { ReporteOcupacionesPorTurno } from '@/schemas/reportes'

import { ReportesOcupacionesFilters } from './ReportesOcupacionesFilters'
import { ReporteTurnoCard } from './ReporteTurnoCard'
import { ReporteTurnoDetalle } from './ReporteTurnoDetalle'

interface ReportesOcupacionesContentProps {
  reportes: ReporteOcupacionesPorTurno[]
  error: string | null
}

export function ReportesOcupacionesContent({
  reportes,
  error
}: ReportesOcupacionesContentProps) {
  const [selectedTurno, setSelectedTurno] =
    useState<ReporteOcupacionesPorTurno | null>(null)

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

  const totalTurnos = reportes.length
  const turnosActivos = reportes.filter((r) => !r.turno_fecha_fin).length
  const totalRecaudado = reportes.reduce(
    (acc, r) => acc + r.recaudacion_total,
    0
  )

  // Obtener lista única de playas para los filtros
  const playasUnicas = Array.from(
    new Map(
      reportes.map((r) => [
        r.playa_id,
        { playa_id: r.playa_id, nombre: r.playa_nombre }
      ])
    ).values()
  )

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <ReportesOcupacionesFilters playas={playasUnicas} />

      {/* Resumen general */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Turnos</CardDescription>
            <CardTitle className="text-4xl">{totalTurnos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Turnos Activos</CardDescription>
            <CardTitle className="text-4xl">{turnosActivos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Recaudación Total</CardDescription>
            <CardTitle className="text-4xl">
              ${totalRecaudado.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tarjetas de turnos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {reportes.map((reporte) => (
          <ReporteTurnoCard
            key={`${reporte.playa_id}-${reporte.playero_id}-${reporte.turno_fecha_inicio}`}
            reporte={reporte}
            onClick={() => setSelectedTurno(reporte)}
          />
        ))}
      </div>

      {/* Detalle del turno seleccionado */}
      {selectedTurno && (
        <ReporteTurnoDetalle
          reporte={selectedTurno}
          onClose={() => setSelectedTurno(null)}
        />
      )}
    </div>
  )
}
