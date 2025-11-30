'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import type { RecaudacionDiariaRow } from '@/services/analytics/recaudacion/types'

interface RecaudacionChartProps {
  data: RecaudacionDiariaRow[]
  fechaDesde?: Date
  fechaHasta?: Date
}

export function RecaudacionChart({
  data,
  fechaDesde,
  fechaHasta
}: RecaudacionChartProps) {
  // Determinar granularidad según rango
  const start = fechaDesde ?? (data[0] ? new Date(data[0].fecha) : new Date())
  const end =
    fechaHasta ??
    (data[data.length - 1] ? new Date(data[data.length - 1].fecha) : new Date())
  const days = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  )

  type BucketKey = string
  const buckets = new Map<
    BucketKey,
    { label: string; total: number; abonos: number; ocupaciones: number }
  >()

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(
      d
    )

  const formatMonth = (d: Date) =>
    new Intl.DateTimeFormat('es-AR', {
      month: 'short',
      year: 'numeric'
    }).format(d)

  const getWeekKey = (d: Date) => {
    const date = new Date(d)
    const day = date.getDay() || 7
    if (day !== 1) date.setDate(date.getDate() - (day - 1))
    const iso = date.toISOString().slice(0, 10)
    return { key: iso, label: `Sem ${formatDate(date)}` }
  }

  // Rellenar todas las fechas/semanas/meses del rango según granularidad
  if (days < 30) {
    // Diario
    const current = new Date(start)
    while (current <= end) {
      const key = current.toISOString().slice(0, 10)
      if (!buckets.has(key)) {
        buckets.set(key, {
          label: formatDate(current),
          total: 0,
          abonos: 0,
          ocupaciones: 0
        })
      }
      current.setDate(current.getDate() + 1)
    }
  } else if (days < 365) {
    // Semanal: iterar por semanas completas entre start y end
    const cursor = new Date(start)
    // normalizar a lunes
    const startDay = cursor.getDay() || 7
    if (startDay !== 1) cursor.setDate(cursor.getDate() - (startDay - 1))
    while (cursor <= end) {
      const wk = getWeekKey(cursor)
      if (!buckets.has(wk.key)) {
        buckets.set(wk.key, {
          label: wk.label,
          total: 0,
          abonos: 0,
          ocupaciones: 0
        })
      }
      cursor.setDate(cursor.getDate() + 7)
    }
  } else {
    // Mensual: prellenar meses
    const current = new Date(start.getFullYear(), start.getMonth(), 1)
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
    while (current <= endMonth) {
      const key = current.toISOString().slice(0, 7)
      if (!buckets.has(key)) {
        buckets.set(key, {
          label: formatMonth(current),
          total: 0,
          abonos: 0,
          ocupaciones: 0
        })
      }
      current.setMonth(current.getMonth() + 1)
    }
  }

  // Agregar datos reales
  for (const row of data) {
    const d = new Date(row.fecha)
    let key: BucketKey
    let label: string

    if (days < 30) {
      key = d.toISOString().slice(0, 10)
      label = formatDate(d)
    } else if (days < 365) {
      const wk = getWeekKey(d)
      key = wk.key
      label = wk.label
    } else {
      key = d.toISOString().slice(0, 7)
      label = formatMonth(d)
    }

    const existing = buckets.get(key)
    if (existing) {
      existing.total += row.recaudacion_total
      existing.abonos += row.recaudacion_abonos
      existing.ocupaciones += row.recaudacion_ocupaciones
    } else {
      buckets.set(key, {
        label,
        total: row.recaudacion_total,
        abonos: row.recaudacion_abonos,
        ocupaciones: row.recaudacion_ocupaciones
      })
    }
  }

  const chartData = Array.from(buckets.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([_key, b]) => ({
      fecha: b.label,
      fechaCompleta: b.label,
      'Recaudación Total': b.total,
      Abonos: b.abonos,
      Ocupaciones: b.ocupaciones
    }))

  return (
    <div className="bg-card rounded-lg border p-4">
      <h3 className="mb-4 text-lg font-semibold">
        {days < 30
          ? 'Recaudación Diaria por Tipo'
          : days < 365
            ? 'Recaudación Semanal por Tipo'
            : 'Recaudación Mensual por Tipo'}
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="fecha"
            className="text-xs"
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'hsl(var(--foreground))' }}
            tickFormatter={(value) =>
              new Intl.NumberFormat('es-AR', {
                notation: 'compact',
                compactDisplay: 'short'
              }).format(value)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.fechaCompleta
              }
              return label
            }}
            formatter={(value: number) =>
              new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0
              }).format(value)
            }
          />
          <Legend />
          <Bar
            dataKey="Recaudación Total"
            fill="hsl(217 91% 60%)"
            radius={[8, 8, 0, 0]}
          />
          <Bar dataKey="Abonos" fill="hsl(142 76% 36%)" radius={[8, 8, 0, 0]} />
          <Bar
            dataKey="Ocupaciones"
            fill="hsl(24 95% 53%)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
