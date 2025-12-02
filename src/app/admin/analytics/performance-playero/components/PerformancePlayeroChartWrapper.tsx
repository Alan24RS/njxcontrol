'use client'

import type { PerformancePlayeroRow } from '@/services/analytics/performance-playero'

import { PerformancePlayeroChartSection } from './PerformancePlayeroChartSection'

interface PerformancePlayeroChartWrapperProps {
  playeros: PerformancePlayeroRow[]
  fechaDesde?: string
  fechaHasta?: string
}

export function PerformancePlayeroChartWrapper({
  playeros,
  fechaDesde,
  fechaHasta
}: PerformancePlayeroChartWrapperProps) {
  const handlePlayeroSelect = async (playeroId: string) => {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : ''
      const url = new URL(`/api/analytics/performance-playero/timeline`, base)
      url.searchParams.set('playero_id', playeroId)
      if (fechaDesde) {
        url.searchParams.set('fecha_desde', fechaDesde)
      }
      if (fechaHasta) {
        url.searchParams.set('fecha_hasta', fechaHasta)
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        return {
          data: null,
          error: 'Error al cargar datos de timeline'
        }
      }

      const result = await response.json()
      return { data: result.data ?? null, error: result.error ?? null }
    } catch (error: any) {
      return {
        data: null,
        error: error?.message || 'Error al cargar datos de timeline'
      }
    }
  }

  return (
    <PerformancePlayeroChartSection
      playeros={playeros}
      onPlayeroSelect={handlePlayeroSelect}
    />
  )
}
