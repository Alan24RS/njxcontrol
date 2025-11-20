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
import type { ReporteOcupacionesPorTurno } from '@/schemas/reportes'

interface ReporteTurnoDetalleProps {
  reporte: ReporteOcupacionesPorTurno
  onClose: () => void
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export function ReporteTurnoDetalle({
  reporte,
  onClose
}: ReporteTurnoDetalleProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Detalle del Turno - {reporte.playa_nombre}</CardTitle>
            <CardDescription>
              {reporte.playero_nombre} |{' '}
              {formatDateTime(reporte.turno_fecha_inicio)}
              {reporte.turno_fecha_fin &&
                ` - ${formatDateTime(reporte.turno_fecha_fin)}`}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen del turno */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 md:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-sm">Total Recaudado</p>
            <p className="text-2xl font-bold text-green-600">
              ${reporte.recaudacion_total.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Ocupaciones</p>
            <p className="text-2xl font-bold">{reporte.total_ocupaciones}</p>
          </div>
        </div>

        {/* Desglose por método de pago */}
        {reporte.pagos_por_metodo.length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">
              Recaudación por Método de Pago
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {reporte.pagos_por_metodo.map((pago, index) => (
                <div key={index} className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-sm">
                    {pago.metodo_pago}
                  </p>
                  <p className="text-lg font-semibold">
                    ${pago.monto.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detalle de ocupaciones */}
        <div>
          <h3 className="mb-3 font-semibold">Ocupaciones del Turno</h3>
          {reporte.ocupaciones.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No hay ocupaciones en este turno
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plaza</TableHead>
                    <TableHead>Patente</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Ingreso</TableHead>
                    <TableHead>Egreso</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reporte.ocupaciones.map((ocupacion) => (
                    <TableRow key={ocupacion.ocupacion_id}>
                      <TableCell className="font-medium">
                        {ocupacion.plaza_identificador}
                      </TableCell>
                      <TableCell>{ocupacion.patente}</TableCell>
                      <TableCell>{ocupacion.tipo_vehiculo}</TableCell>
                      <TableCell>{ocupacion.modalidad}</TableCell>
                      <TableCell>
                        {formatDateTime(ocupacion.hora_ingreso)}
                      </TableCell>
                      <TableCell>
                        {ocupacion.hora_egreso
                          ? formatDateTime(ocupacion.hora_egreso)
                          : 'Activa'}
                      </TableCell>
                      <TableCell>
                        {ocupacion.monto_pago
                          ? `$${ocupacion.monto_pago.toLocaleString()}`
                          : '-'}
                      </TableCell>
                      <TableCell>{ocupacion.metodo_pago || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
