'use client'

import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
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
import useQueryParams from '@/hooks/useQueryParams'
import { cn } from '@/lib/utils'
import type { RecaudacionPorPlayaFiltersInput } from '@/schemas/analytics/recaudacion-por-playa'
import { recaudacionPorPlayaFiltersSchema } from '@/schemas/analytics/recaudacion-por-playa'

interface RecaudacionPorPlayaFiltersProps {
  playas: Array<{ playa_id: string; nombre: string }>
  playeros: Array<{ playero_id: string; usuario_nombre: string }>
  onFilterChange: (filters: RecaudacionPorPlayaFiltersInput) => void
  isLoadingPlayas?: boolean
  isLoadingPlayeros?: boolean
}

export function RecaudacionPorPlayaFilters({
  playas,
  playeros,
  onFilterChange,
  isLoadingPlayas = false,
  isLoadingPlayeros = false
}: RecaudacionPorPlayaFiltersProps) {
  const { searchParams, handleParamsChange } = useQueryParams()

  // Valores iniciales desde URL o defaults
  const defaultValues: RecaudacionPorPlayaFiltersInput = {
    fecha_desde: searchParams.get('fecha_desde')
      ? new Date(searchParams.get('fecha_desde')!)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    fecha_hasta: searchParams.get('fecha_hasta')
      ? new Date(searchParams.get('fecha_hasta')!)
      : new Date(),
    playa_id: searchParams.get('playa_id') || null,
    playero_id: searchParams.get('playero_id') || null,
    tipo: (searchParams.get('tipo') as 'ABONO' | 'OCUPACION' | null) || null
  }

  const form = useForm<RecaudacionPorPlayaFiltersInput>({
    resolver: zodResolver(recaudacionPorPlayaFiltersSchema),
    defaultValues
  })

  const onSubmit = (data: RecaudacionPorPlayaFiltersInput) => {
    // Actualizar URL params
    handleParamsChange([
      {
        name: 'fecha_desde',
        value: data.fecha_desde.toISOString().split('T')[0]
      },
      {
        name: 'fecha_hasta',
        value: data.fecha_hasta.toISOString().split('T')[0]
      },
      { name: 'playa_id', value: data.playa_id || undefined },
      { name: 'playero_id', value: data.playero_id || undefined },
      { name: 'tipo', value: data.tipo || undefined }
    ])

    // Notificar padre
    onFilterChange(data)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg-card rounded-lg border p-4"
      >
        <div className="space-y-4">
          {/* Fila de filtros */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Fecha Desde */}
            <FormField
              control={form.control}
              name="fecha_desde"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha Desde</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha Hasta */}
            <FormField
              control={form.control}
              name="fecha_hasta"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha Hasta</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Playa */}
            <FormField
              control={form.control}
              name="playa_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playa</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === 'all' ? null : value)
                    }
                    value={field.value || 'all'}
                  >
                    <FormControl>
                      <SelectTrigger disabled={isLoadingPlayas}>
                        <SelectValue
                          placeholder={
                            isLoadingPlayas
                              ? 'Cargando playas...'
                              : 'Todas las playas'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">Todas las playas</SelectItem>
                      {playas.map((playa) => (
                        <SelectItem key={playa.playa_id} value={playa.playa_id}>
                          {playa.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Playero */}
            <FormField
              control={form.control}
              name="playero_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playero</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === 'all' ? null : value)
                    }
                    value={field.value || 'all'}
                  >
                    <FormControl>
                      <SelectTrigger disabled={isLoadingPlayeros}>
                        <SelectValue
                          placeholder={
                            isLoadingPlayeros
                              ? 'Cargando playeros...'
                              : 'Todos los playeros'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">Todos los playeros</SelectItem>
                      {playeros.map((playero) => (
                        <SelectItem
                          key={playero.playero_id}
                          value={playero.playero_id}
                        >
                          {playero.usuario_nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de ingreso */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de ingreso</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === 'all' ? null : value)
                    }
                    value={field.value || 'all'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ABONO">Abono</SelectItem>
                      <SelectItem value="OCUPACION">Ocupación</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Botón Filtrar en su propia fila */}
          <div className="flex justify-start pt-2">
            <Button type="submit" className="w-full md:w-auto md:px-8">
              <Search className="mr-2 h-4 w-4" />
              generar reporte
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
