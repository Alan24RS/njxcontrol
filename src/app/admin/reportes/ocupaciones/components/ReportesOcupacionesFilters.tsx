'use client'

import { useCallback, useState } from 'react'
import type { DateRange } from 'react-day-picker'

import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { FilterCalendar } from '@/components/ui/DataTable/Filters/components'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface ReportesOcupacionesFiltersProps {
  playas?: Array<{ playa_id: string; nombre: string }>
}

export function ReportesOcupacionesFilters({
  playas = []
}: ReportesOcupacionesFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedPlaya, setSelectedPlaya] = useState<string>(
    searchParams.get('playa') || ''
  )
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    if (fechaDesde && fechaHasta) {
      return {
        from: new Date(fechaDesde),
        to: new Date(fechaHasta)
      }
    }
    return undefined
  })

  const aplicarFiltros = useCallback(() => {
    const params = new URLSearchParams()

    if (selectedPlaya) {
      params.set('playa', selectedPlaya)
    }

    if (dateRange?.from) {
      params.set('fechaDesde', dateRange.from.toISOString().split('T')[0])
    }

    if (dateRange?.to) {
      params.set('fechaHasta', dateRange.to.toISOString().split('T')[0])
    }

    router.push(`?${params.toString()}`)
  }, [selectedPlaya, dateRange, router])

  const limpiarFiltros = useCallback(() => {
    setSelectedPlaya('')
    setDateRange(undefined)
    router.push(window.location.pathname)
  }, [router])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
        <CardDescription>
          Filtra los reportes por playa y rango de fechas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Filtro de playa */}
          {playas.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Playa</label>
              <Select value={selectedPlaya} onValueChange={setSelectedPlaya}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las playas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las playas</SelectItem>
                  {playas.map((playa) => (
                    <SelectItem key={playa.playa_id} value={playa.playa_id}>
                      {playa.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtro de rango de fechas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rango de fechas</label>
            <FilterCalendar
              options={[]}
              selectedRange={dateRange}
              onChange={setDateRange}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={aplicarFiltros} className="flex-1">
            Aplicar filtros
          </Button>
          <Button onClick={limpiarFiltros} variant="outline">
            Limpiar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
