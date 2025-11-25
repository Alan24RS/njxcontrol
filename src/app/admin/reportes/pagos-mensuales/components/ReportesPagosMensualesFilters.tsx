'use client'

import { useCallback, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
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

interface ReportesPagosMensualesFiltersProps {
  playas?: Array<{ playa_id: string; playa_nombre: string }>
  playeros?: Array<{ playero_id: string; playero_nombre: string }>
  esDueno: boolean
  turnoActivo?: boolean
}

const MESES = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
]

const getAnios = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push({ value: i.toString(), label: i.toString() })
  }
  return years
}

export function ReportesPagosMensualesFilters({
  playas = [],
  playeros = [],
  esDueno,
  turnoActivo = false
}: ReportesPagosMensualesFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedPlaya, setSelectedPlaya] = useState<string>(
    searchParams.get('playa') || 'all'
  )
  const [selectedPlayero, setSelectedPlayero] = useState<string>(
    searchParams.get('playero') || 'all'
  )
  const [selectedAnio, setSelectedAnio] = useState<string>(
    searchParams.get('anio') || new Date().getFullYear().toString()
  )
  const [selectedMes, setSelectedMes] = useState<string>(
    searchParams.get('mes') || 'all'
  )

  const aplicarFiltros = useCallback(() => {
    const params = new URLSearchParams()

    if (selectedPlaya && selectedPlaya !== 'all') {
      params.set('playa', selectedPlaya)
    }

    if (selectedPlayero && selectedPlayero !== 'all' && esDueno) {
      params.set('playero', selectedPlayero)
    }

    if (selectedAnio && selectedAnio !== 'all') {
      params.set('anio', selectedAnio)
    }

    if (selectedMes && selectedMes !== 'all') {
      params.set('mes', selectedMes)
    }

    router.push(`?${params.toString()}`)
  }, [
    selectedPlaya,
    selectedPlayero,
    selectedAnio,
    selectedMes,
    esDueno,
    router
  ])

  const limpiarFiltros = useCallback(() => {
    setSelectedPlaya('all')
    setSelectedPlayero('all')
    setSelectedAnio(new Date().getFullYear().toString())
    setSelectedMes('all')
    router.push(window.location.pathname)
  }, [router])

  // Si hay turno activo, mostrar mensaje en lugar de filtros
  if (turnoActivo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vista de Turno Activo</CardTitle>
          <CardDescription>
            Estás viendo únicamente los pagos registrados en tu turno actual.
            Los filtros están deshabilitados.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
        <CardDescription>
          Filtra los reportes mensuales por playa, playero, año y mes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Filtro de playa */}
          {playas.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Playa</label>
              <Select value={selectedPlaya} onValueChange={setSelectedPlaya}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las playas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las playas</SelectItem>
                  {playas.map((playa) => (
                    <SelectItem key={playa.playa_id} value={playa.playa_id}>
                      {playa.playa_nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtro de playero (solo para dueños) */}
          {esDueno && playeros.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Playero</label>
              <Select
                value={selectedPlayero}
                onValueChange={setSelectedPlayero}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los playeros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los playeros</SelectItem>
                  {playeros.map((playero) => (
                    <SelectItem
                      key={playero.playero_id}
                      value={playero.playero_id}
                    >
                      {playero.playero_nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtro de año */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Año</label>
            <Select value={selectedAnio} onValueChange={setSelectedAnio}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {getAnios().map((anio) => (
                  <SelectItem key={anio.value} value={anio.value}>
                    {anio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de mes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mes</label>
            <Select value={selectedMes} onValueChange={setSelectedMes}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {MESES.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
