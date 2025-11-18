'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { AbonoVigenteDetalle } from '@/schemas/reportes'

interface ReporteAbonosTableProps {
  abonos: AbonoVigenteDetalle[]
}

function formatDate(dateString: string, includeTime = false): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()

  if (includeTime) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  return `${day}/${month}/${year}`
}

export function ReporteAbonosTable({ abonos }: ReporteAbonosTableProps) {
  if (abonos.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No hay abonos vigentes para esta playa
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Abonado</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Plaza</TableHead>
            <TableHead>Fecha Inicio</TableHead>
            <TableHead>Fecha Fin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {abonos.map((abono) => (
            <TableRow key={`${abono.abonado_id}-${abono.plaza_id}`}>
              <TableCell className="font-medium">
                {abono.nombre_completo}
              </TableCell>
              <TableCell>{abono.dni}</TableCell>
              <TableCell>{abono.plaza_identificador}</TableCell>
              <TableCell>{formatDate(abono.fecha_inicio, true)}</TableCell>
              <TableCell>{formatDate(abono.fecha_fin)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
