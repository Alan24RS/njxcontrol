'use client'

import { useState } from 'react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { ReportePagosMensuales } from '@/schemas/reportes'

import { ReporteMensualCard } from './ReporteMensualCard'
import { ReporteMensualDetalle } from './ReporteMensualDetalle'
import { ReportesPagosMensualesFilters } from './ReportesPagosMensualesFilters'

interface ReportesPagosMensualesContentProps {
  reportes: ReportePagosMensuales[]
  error: string | null
  esDueno: boolean
}

export function ReportesPagosMensualesContent({
  reportes,
  error,
  esDueno
}: ReportesPagosMensualesContentProps) {
  const [selectedReporte, setSelectedReporte] =
    useState<ReportePagosMensuales | null>(null)

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

  const totalRecaudado = reportes.reduce(
    (acc, r) => acc + r.recaudacion_total,
    0
  )
  const totalPagos = reportes.reduce((acc, r) => acc + r.total_pagos, 0)
  const totalOcupaciones = reportes.reduce(
    (acc, r) => acc + r.recaudacion_ocupaciones,
    0
  )
  const totalBoletas = reportes.reduce(
    (acc, r) => acc + r.recaudacion_boletas,
    0
  )

  // Obtener listas únicas para filtros
  const playasUnicas = Array.from(
    new Map(
      reportes.map((r) => [
        r.playa_id,
        { playa_id: r.playa_id, playa_nombre: r.playa_nombre }
      ])
    ).values()
  )

  const playerosUnicos = esDueno
    ? Array.from(
        new Map(
          reportes.map((r) => [
            r.playero_id,
            { playero_id: r.playero_id, playero_nombre: r.playero_nombre }
          ])
        ).values()
      )
    : []

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <ReportesPagosMensualesFilters
        playas={playasUnicas}
        playeros={playerosUnicos}
        esDueno={esDueno}
      />

      {/* Resumen general */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Recaudación Total</CardDescription>
            <CardTitle className="text-4xl">
              ${totalRecaudado.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Pagos</CardDescription>
            <CardTitle className="text-4xl">{totalPagos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ocupaciones</CardDescription>
            <CardTitle className="text-3xl">
              ${totalOcupaciones.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Boletas</CardDescription>
            <CardTitle className="text-3xl">
              ${totalBoletas.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tarjetas de reportes mensuales */}
      {reportes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay datos</CardTitle>
            <CardDescription>
              No se encontraron pagos para los filtros seleccionados
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {reportes.map((reporte) => (
            <ReporteMensualCard
              key={`${reporte.playa_id}-${reporte.playero_id}-${reporte.anio}-${reporte.mes}`}
              reporte={reporte}
              onClick={() => setSelectedReporte(reporte)}
            />
          ))}
        </div>
      )}

      {/* Detalle del reporte seleccionado */}
      {selectedReporte && (
        <ReporteMensualDetalle
          reporte={selectedReporte}
          onClose={() => setSelectedReporte(null)}
        />
      )}
    </div>
  )
}
