'use client'

import { useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useGetPlayeros } from '@/hooks/queries/analytics/useGetPlayeros'
import { cn } from '@/lib/utils'
import type { Playa } from '@/services/playas/types'

interface PerformancePlayeroFiltersProps {
  playas?: Playa[]
}

export function PerformancePlayeroFilters({
  playas = []
}: PerformancePlayeroFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Fetch playeros based on playa selection
  const playasIds = playas.map((p) => p.id)
  const { data: playeros = [] } = useGetPlayeros(playasIds)

  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(
    searchParams.get('fecha_desde')
      ? new Date(searchParams.get('fecha_desde')!)
      : undefined
  )
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(
    searchParams.get('fecha_hasta')
      ? new Date(searchParams.get('fecha_hasta')!)
      : undefined
  )
  const [playaId, setPlayaId] = useState(searchParams.get('playa_id') || 'all')
  const [playeroId, setPlayeroId] = useState(
    searchParams.get('playero_id') || 'all'
  )
  const [incluirDiasSinActividad, setIncluirDiasSinActividad] = useState(
    searchParams.get('incluir_dias_sin_actividad') === 'true'
  )
  const [excluirIrregulares, setExcluirIrregulares] = useState(
    searchParams.get('excluir_irregulares') === 'true'
  )

  const aplicarFiltros = () => {
    const params = new URLSearchParams()
    if (fechaDesde) params.set('fecha_desde', format(fechaDesde, 'yyyy-MM-dd'))
    if (fechaHasta) params.set('fecha_hasta', format(fechaHasta, 'yyyy-MM-dd'))
    if (playaId && playaId !== 'all') params.set('playa_id', playaId)
    if (playeroId && playeroId !== 'all') params.set('playero_id', playeroId)
    if (incluirDiasSinActividad)
      params.set('incluir_dias_sin_actividad', 'true')
    if (excluirIrregulares) params.set('excluir_irregulares', 'true')
    // Flag to indicate user explicitly applied filters
    params.set('aplicar', '1')

    router.push(`${pathname}?${params.toString()}`)
  }

  const limpiarFiltros = () => {
    setFechaDesde(undefined)
    setFechaHasta(undefined)
    setPlayaId('all')
    setPlayeroId('all')
    setIncluirDiasSinActividad(false)
    setExcluirIrregulares(false)
    router.push(pathname)
  }

  const hayFiltros =
    fechaDesde ||
    fechaHasta ||
    (playaId && playaId !== 'all') ||
    (playeroId && playeroId !== 'all')

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Fecha Desde */}
        <div className="min-w-0 space-y-1.5">
          <label className="text-sm font-medium">Fecha desde</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-10 w-full pl-3 text-left font-normal',
                  !fechaDesde && 'text-muted-foreground'
                )}
              >
                {fechaDesde ? (
                  format(fechaDesde, 'PPP', { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fechaDesde}
                onSelect={setFechaDesde}
                disabled={(date) =>
                  date > new Date() || date < new Date('1900-01-01')
                }
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Fecha Hasta */}
        <div className="min-w-0 space-y-1.5">
          <label className="text-sm font-medium">Fecha hasta</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-10 w-full pl-3 text-left font-normal',
                  !fechaHasta && 'text-muted-foreground'
                )}
              >
                {fechaHasta ? (
                  format(fechaHasta, 'PPP', { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fechaHasta}
                onSelect={setFechaHasta}
                disabled={(date) =>
                  date > new Date() || date < new Date('1900-01-01')
                }
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Playa */}
        <div className="min-w-0 space-y-1.5">
          <label className="text-sm font-medium">Playa</label>
          <Select value={playaId} onValueChange={setPlayaId}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Todas las playas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las playas</SelectItem>
              {playas.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Playero */}
        <div className="min-w-0 space-y-1.5">
          <label className="text-sm font-medium">Playero</label>
          <Select value={playeroId} onValueChange={setPlayeroId}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Todos los playeros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los playeros</SelectItem>
              {playeros.map((p) => (
                <SelectItem key={p.playero_id} value={p.playero_id}>
                  {p.usuario_nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botones */}
        <div className="flex items-end gap-2">
          <Button onClick={aplicarFiltros} className="h-10 flex-1">
            <Search className="mr-2 h-4 w-4" />
            Aplicar
          </Button>
          {hayFiltros && (
            <Button
              variant="ghost"
              size="icon"
              onClick={limpiarFiltros}
              className="h-10 w-10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Opción: Incluir días sin actividad */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="incluir-dias-sin-actividad"
            checked={incluirDiasSinActividad}
            onCheckedChange={(checked) =>
              setIncluirDiasSinActividad(checked === true)
            }
          />
          <label
            htmlFor="incluir-dias-sin-actividad"
            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Incluir días sin actividad en promedio diario
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="excluir-irregulares"
            checked={excluirIrregulares}
            onCheckedChange={(checked) =>
              setExcluirIrregulares(checked === true)
            }
          />
          <label
            htmlFor="excluir-irregulares"
            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Excluir turnos irregulares (menos de 1 hora o más de 12 horas)
          </label>
        </div>
      </div>
    </div>
  )
}
