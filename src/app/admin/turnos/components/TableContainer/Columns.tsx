'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { AlertCircle, AlertTriangle, Clock } from 'lucide-react'

import { CellLink, SortHeader } from '@/components/ui/DataTable'
import type { Turno } from '@/services/turnos/types'
import { formatCurrency } from '@/utils/formatters'

function parseHorarioPlaya(horario: string): Array<{
  dias: string[]
  horaInicio: string
  horaFin: string
}> {
  const bloques = horario.split('|').map((b) => b.trim())
  const resultado: Array<{
    dias: string[]
    horaInicio: string
    horaFin: string
  }> = []

  for (const bloque of bloques) {
    const match = bloque.match(/^([A-Z,\-]+)\s+([\d:]+)\s*-\s*([\d:]+)$/)
    if (!match) continue

    const [, diasStr, horaInicio, horaFin] = match
    let dias: string[] = []

    if (diasStr.includes('-')) {
      const [inicio, fin] = diasStr.split('-')
      const todosLosDias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
      const idxInicio = todosLosDias.indexOf(inicio)
      const idxFin = todosLosDias.indexOf(fin)
      if (idxInicio !== -1 && idxFin !== -1) {
        if (idxInicio <= idxFin) {
          dias = todosLosDias.slice(idxInicio, idxFin + 1)
        } else {
          dias = [
            ...todosLosDias.slice(idxInicio),
            ...todosLosDias.slice(0, idxFin + 1)
          ]
        }
      }
    } else {
      dias = diasStr.split(',').map((d) => d.trim())
    }

    resultado.push({ dias, horaInicio, horaFin })
  }

  return resultado
}

function getDayKey(date: Date): string {
  const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
  return dias[date.getDay()]
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function esTurnoFueraDeHorario(fechaIngreso: Date, horario?: string): boolean {
  if (!horario) return false

  const bloques = parseHorarioPlaya(horario)
  if (bloques.length === 0) return false

  const diaKey = getDayKey(fechaIngreso)
  const bloqueDelDia = bloques.find((b) => b.dias.includes(diaKey))

  if (!bloqueDelDia) return true // No hay horario definido para este día

  const minutosIngreso =
    fechaIngreso.getHours() * 60 + fechaIngreso.getMinutes()
  const minutosInicio = timeToMinutes(bloqueDelDia.horaInicio)
  const minutosFin = timeToMinutes(bloqueDelDia.horaFin)

  // Margen de tolerancia: 1 hora antes o después
  const margen = 60
  const dentroDeLimites =
    minutosIngreso >= minutosInicio - margen &&
    minutosIngreso <= minutosFin + margen

  return !dentroDeLimites
}

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
      accessorKey: 'duracionMinutos',
      id: 'duracion',
      meta: 'Duración',
      header: () =>
        SortHeader({
          children: 'Duración',
          id: 'duracion',
          type: 'number',
          className: 'justify-center'
        }),
      cell: ({ row }) => {
        const duracionMinutos = row.original.duracionMinutos
        const duracionFormateada = row.original.duracionFormateada
        const fechaIngreso = row.original.fechaHoraIngreso
        const horarioPlaya = row.original.playaHorario

        if (!duracionMinutos || !duracionFormateada) {
          return (
            <CellLink href={getHref(row.original)} className="justify-center">
              <p className="text-muted-foreground text-center text-sm">-</p>
            </CellLink>
          )
        }

        // Determinar tipo de irregularidad
        const duracionHoras = duracionMinutos / 60
        const fueraDeHorario = esTurnoFueraDeHorario(fechaIngreso, horarioPlaya)

        let colorClass = 'text-foreground' // Normal
        let Icon = Clock
        let tooltip = ''

        if (duracionHoras > 12) {
          // Más de 12 horas - rojo (prioridad más alta)
          colorClass = 'text-red-600 dark:text-red-500 font-bold'
          Icon = AlertCircle
          tooltip = 'Turno mayor a 12 horas'
        } else if (duracionMinutos < 60 || fueraDeHorario) {
          // Menos de 1 hora o fuera de horario - amarillo
          colorClass = 'text-yellow-600 dark:text-yellow-500 font-semibold'
          Icon = AlertTriangle
          if (duracionMinutos < 60 && fueraDeHorario) {
            tooltip = 'Turno menor a 1 hora y fuera de horario'
          } else if (duracionMinutos < 60) {
            tooltip = 'Turno menor a 1 hora'
          } else {
            tooltip = 'Turno fuera de horario'
          }
        }

        return (
          <CellLink href={getHref(row.original)} className="justify-center">
            <div className="flex items-center justify-center gap-1.5">
              <Icon className={`h-4 w-4 ${colorClass}`} />
              <p
                className={`text-center font-mono text-sm ${colorClass}`}
                title={tooltip}
              >
                {duracionFormateada}
              </p>
            </div>
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
