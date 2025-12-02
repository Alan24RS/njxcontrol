'use client'

import { useState } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type {
  PerformancePlayeroRow,
  PerformancePlayeroTimelineRow
} from '@/services/analytics/performance-playero'

import { PerformancePlayeroChart } from './PerformancePlayeroChart'

interface PerformancePlayeroChartSectionProps {
  playeros: PerformancePlayeroRow[]
  onPlayeroSelect: (
    playeroId: string,
    intervalo: 'diario' | 'semanal' | 'mensual'
  ) => Promise<{
    data: PerformancePlayeroTimelineRow[] | null
    error: string | null
  }>
}

export function PerformancePlayeroChartSection({
  playeros,
  onPlayeroSelect
}: PerformancePlayeroChartSectionProps) {
  const [selectedPlayeroId, setSelectedPlayeroId] = useState<string>('')
  const [intervalo, setIntervalo] = useState<'diario' | 'semanal' | 'mensual'>(
    'diario'
  )
  const [timelineData, setTimelineData] = useState<
    PerformancePlayeroTimelineRow[]
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePlayeroChange = async (playeroId: string) => {
    setSelectedPlayeroId(playeroId)
    setError(null)

    if (!playeroId || playeroId === 'none') {
      setTimelineData([])
      return
    }

    setLoading(true)
    const result = await onPlayeroSelect(playeroId, intervalo)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      setTimelineData([])
    } else {
      setTimelineData(result.data || [])
    }
  }

  const handleIntervaloChange = async (
    nuevoIntervalo: 'diario' | 'semanal' | 'mensual'
  ) => {
    setIntervalo(nuevoIntervalo)
    if (selectedPlayeroId && selectedPlayeroId !== 'none') {
      setLoading(true)
      const result = await onPlayeroSelect(selectedPlayeroId, nuevoIntervalo)
      setLoading(false)

      if (result.error) {
        setError(result.error)
        setTimelineData([])
      } else {
        setTimelineData(result.data || [])
      }
    }
  }

  const selectedPlayero = playeros.find(
    (p) => p.playeroId === selectedPlayeroId
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Gráfico de Actividad</CardTitle>
            <CardDescription>
              Visualiza la evolución diaria de horas trabajadas, ocupaciones y
              recaudación
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={intervalo}
              onValueChange={(v) =>
                handleIntervaloChange(v as 'diario' | 'semanal' | 'mensual')
              }
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diario">Diario</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedPlayeroId || 'none'}
              onValueChange={handlePlayeroChange}
            >
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Seleccionar playero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Seleccionar playero</SelectItem>
                {playeros.map((playero) => (
                  <SelectItem
                    key={`${playero.playeroId}-${playero.playaId}`}
                    value={playero.playeroId}
                  >
                    {playero.playeroNombre} - {playero.playaNombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground text-sm">Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : !selectedPlayero ? (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Selecciona un playero para visualizar su actividad
            </p>
          </div>
        ) : (
          <PerformancePlayeroChart
            data={timelineData}
            playeroNombre={selectedPlayero.playeroNombre}
          />
        )}
      </CardContent>
    </Card>
  )
}
