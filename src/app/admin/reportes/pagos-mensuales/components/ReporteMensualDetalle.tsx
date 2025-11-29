'use client'

import { X } from 'lucide-react'

import { Button } from '@/components/ui'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { ReportePagosMensuales } from '@/schemas/reportes'

interface ReporteMensualDetalleProps {
  reporte: ReportePagosMensuales
  onClose: () => void
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

export function ReporteMensualDetalle({
  reporte,
  onClose
}: ReporteMensualDetalleProps) {
  const mesNombre = MESES[reporte.mes - 1]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Detalle Mensual - {reporte.playa_nombre}</CardTitle>
            <CardDescription>
              {reporte.playero_nombre} | {mesNombre} {reporte.anio}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen general */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 md:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-sm">Total Recaudado</p>
            <p className="text-2xl font-bold text-green-600">
              ${reporte.recaudacion_total.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Total Pagos</p>
            <p className="text-2xl font-bold">{reporte.total_pagos}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Ocupaciones</p>
            <p className="text-xl font-semibold">
              ${reporte.recaudacion_ocupaciones.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-xs">
              {reporte.cantidad_pagos_ocupaciones} pago(s)
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Boletas</p>
            <p className="text-xl font-semibold">
              ${reporte.recaudacion_boletas.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-xs">
              {reporte.cantidad_pagos_boletas} pago(s)
            </p>
          </div>
        </div>

        {/* Desglose por método de pago */}
        {reporte.pagos_por_metodo.length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">
              Recaudación por Método de Pago
            </h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reporte.pagos_por_metodo.map((pago, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {pago.metodo_pago}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            pago.tipo_pago === 'ocupacion'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}
                        >
                          {pago.tipo_pago === 'ocupacion'
                            ? 'Ocupación'
                            : 'Boleta'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {pago.cantidad}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${pago.monto.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
