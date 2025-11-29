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

import type { RecaudacionDiariaRow } from '@/services/analytics/recaudacion-por-playa/types'

interface RecaudacionPorPlayaChartProps {
  data: RecaudacionDiariaRow[]
}

export function RecaudacionPorPlayaChart({
  data
}: RecaudacionPorPlayaChartProps) {
  // Transformar datos para recharts
  const chartData = data.map((row) => ({
    fecha: new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short'
    }).format(new Date(row.fecha)),
    fechaCompleta: new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium'
    }).format(new Date(row.fecha)),
    'Recaudación Total': row.recaudacion_total,
    Abonos: row.recaudacion_abonos,
    Ocupaciones: row.recaudacion_ocupaciones
  }))

  return (
    <div className="bg-card rounded-lg border p-4">
      <h3 className="mb-4 text-lg font-semibold">
        Recaudación Diaria por Tipo
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
