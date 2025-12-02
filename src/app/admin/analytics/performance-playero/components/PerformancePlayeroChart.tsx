'use client'

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import type { PerformancePlayeroTimelineRow } from '@/services/analytics/performance-playero'

interface PerformancePlayeroChartProps {
  data: PerformancePlayeroTimelineRow[]
  playeroNombre: string
}

export function PerformancePlayeroChart({
  data,
  playeroNombre
}: PerformancePlayeroChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card flex h-[300px] items-center justify-center rounded-lg border">
        <p className="text-muted-foreground text-sm">
          No hay datos disponibles para el período seleccionado
        </p>
      </div>
    )
  }

  const chartData = data
    .filter((row) => row.fecha !== null)
    .map((row) => ({
      fecha: new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'short'
      }).format(row.fecha!),
      horas: row.totalHorasTrabajadas,
      ocupaciones: row.ocupacionesCerradas,
      recaudacion: row.volumenRecaudado
    }))

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Actividad de {playeroNombre}</h3>
        <p className="text-muted-foreground text-sm">
          Evolución diaria de horas trabajadas, ocupaciones cerradas y
          recaudación
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="fecha"
            className="text-muted-foreground text-xs"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            className="text-muted-foreground text-xs"
            tick={{ fontSize: 12 }}
            label={{
              value: 'Horas / Ocupaciones',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12 }
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            className="text-muted-foreground text-xs"
            tick={{ fontSize: 12 }}
            label={{
              value: 'Recaudación ($)',
              angle: 90,
              position: 'insideRight',
              style: { fontSize: 12 }
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'recaudacion') {
                return [
                  `$${value.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`,
                  'Recaudación'
                ]
              }
              if (name === 'horas') {
                return [`${value.toFixed(1)} hs`, 'Horas trabajadas']
              }
              if (name === 'ocupaciones') {
                return [value, 'Ocupaciones cerradas']
              }
              return [value, name]
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                horas: 'Horas trabajadas',
                ocupaciones: 'Ocupaciones cerradas',
                recaudacion: 'Recaudación'
              }
              return labels[value] || value
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="ocupaciones"
            fill="hsl(var(--chart-2))"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="horas"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="recaudacion"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
