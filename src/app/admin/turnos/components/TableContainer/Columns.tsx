'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { CellLink, SortHeader } from '@/components/ui/DataTable'
import type { Turno } from '@/services/turnos/types'
import { formatCurrency } from '@/utils/formatters'

function formatHoraIngreso(date: Date, now: Date): string {
  const isToday = date.toDateString() === now.toDateString()
  const isSameYear = date.getFullYear() === now.getFullYear()

  const timeStr = date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  if (isToday) {
    return timeStr
  }

  if (isSameYear) {
    const dateStr = date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit'
    })
    return `${dateStr} ${timeStr}`
  }

  const dateStr = date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
  return `${dateStr} ${timeStr}`
}

const getHref = (row: Turno) => {
  const fechaIngreso = encodeURIComponent(row.fechaHoraIngreso.toISOString())
  return `/admin/turnos/${row.playaId}?fromDate=${fechaIngreso.split('T')[0]}`
}

export function getColumns(now: Date = new Date()): ColumnDef<Turno>[] {
  return [
    {
      accessorKey: 'playaNombre',
      id: 'playa',
      meta: 'Playa',
      header: () =>
        SortHeader({
          children: 'Playa',
          id: 'playa',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => {
        const nombre = row.original.playaNombre
        const direccion = row.original.playaDireccion
        return (
          <CellLink href={getHref(row.original)} className="justify-start">
            <p className="text-left text-sm">
              {nombre || direccion || 'Sin nombre'}
            </p>
          </CellLink>
        )
      }
    },
    {
      accessorKey: 'fechaHoraIngreso',
      id: 'fecha_hora_ingreso',
      meta: 'Ingreso',
      header: () =>
        SortHeader({
          children: 'Ingreso',
          id: 'fecha_hora_ingreso',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => {
        const date = row.original.fechaHoraIngreso
        return (
          <CellLink href={getHref(row.original)} className="justify-center">
            <p className="text-center text-sm">
              {formatHoraIngreso(date, now)}
            </p>
          </CellLink>
        )
      }
    },
    {
      accessorKey: 'fechaHoraSalida',
      id: 'fecha_hora_salida',
      meta: 'Salida',
      header: () =>
        SortHeader({
          children: 'Salida',
          id: 'fecha_hora_salida',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => {
        const date = row.original.fechaHoraSalida
        return (
          <CellLink href={getHref(row.original)} className="justify-center">
            <p className="text-center text-sm">
              {date ? formatHoraIngreso(date, now) : 'En curso'}
            </p>
          </CellLink>
        )
      }
    },
    {
      accessorKey: 'efectivoInicial',
      id: 'efectivo_inicial',
      meta: 'Efectivo inicial',
      header: () =>
        SortHeader({
          children: 'Efectivo inicial',
          id: 'efectivo_inicial',
          type: 'number',
          className: 'justify-center'
        }),
      cell: ({ row }) => {
        const value = row.original.efectivoInicial
        return (
          <CellLink href={getHref(row.original)} className="justify-center">
            <p className="text-center text-sm font-medium">
              {formatCurrency(value)}
            </p>
          </CellLink>
        )
      }
    },
    {
      accessorKey: 'efectivoFinal',
      id: 'efectivo_final',
      meta: 'Efectivo final',
      header: () =>
        SortHeader({
          children: 'Efectivo final',
          id: 'efectivo_final',
          type: 'number',
          className: 'justify-center'
        }),
      cell: ({ row }) => {
        const value = row.original.efectivoFinal
        return (
          <CellLink href={getHref(row.original)} className="justify-center">
            <p className="text-center text-sm font-medium">
              {formatCurrency(value)}
            </p>
          </CellLink>
        )
      }
    }
  ]
}
