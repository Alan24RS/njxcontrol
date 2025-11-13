import { useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  SelectableCardGroup,
  SelectableCardItem,
  Skeleton
} from '@/components/ui'
import { useGetTiposPlaza } from '@/hooks/queries/tipos-plaza/getTiposPlaza'
import useDebounce from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { CreateAbonoFormData } from '@/schemas/abono'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'

export default function TipoPlazaField() {
  const { control, watch, setValue } = useFormContext<CreateAbonoFormData>()
  const { selectedPlaya } = useSelectedPlaya()
  const tiposVehiculo = watch('tiposVehiculo')
  const tipoPlazaId = watch('tipoPlazaId')

  const debouncedTiposVehiculo = useDebounce(tiposVehiculo, 500)

  const { data: tiposPlazaResponse, isLoading: isLoadingTiposPlaza } =
    useGetTiposPlaza(
      {
        playaId: selectedPlaya?.id || '',
        tiposVehiculo: debouncedTiposVehiculo,
        limit: 100,
        includeAvailability: true,
        onlyAvailable: false
      },
      {
        enabled: !!selectedPlaya?.id && debouncedTiposVehiculo.length > 0
      }
    )

  const tiposPlazaOrdenados = useMemo(() => {
    if (!tiposPlazaResponse?.data) return []

    return [...tiposPlazaResponse.data].sort((a, b) => {
      const tieneDisponibilidadA = (a.plazasDisponibles || 0) > 0
      const tieneDisponibilidadB = (b.plazasDisponibles || 0) > 0
      const tieneTarifaA =
        a.tarifaMaxima !== null && a.tarifaMaxima !== undefined
      const tieneTarifaB =
        b.tarifaMaxima !== null && b.tarifaMaxima !== undefined

      if (
        tieneDisponibilidadA &&
        tieneTarifaA &&
        tieneDisponibilidadB &&
        tieneTarifaB
      ) {
        return a.tarifaMaxima! - b.tarifaMaxima!
      }

      if (tieneDisponibilidadA && tieneTarifaA) return -1
      if (tieneDisponibilidadB && tieneTarifaB) return 1

      if (!tieneDisponibilidadA && !tieneDisponibilidadB) return 0
      if (!tieneDisponibilidadA) return 1
      if (!tieneDisponibilidadB) return -1

      return 0
    })
  }, [tiposPlazaResponse?.data])

  useEffect(() => {
    if (tipoPlazaId && tiposPlazaResponse?.data) {
      const tipoPlazaSeleccionado = tiposPlazaResponse.data.find(
        (tp) => tp.id === tipoPlazaId
      )
      if (
        tipoPlazaSeleccionado &&
        tipoPlazaSeleccionado.tarifaMaxima !== null &&
        tipoPlazaSeleccionado.tarifaMaxima !== undefined
      ) {
        setValue('tarifaMensual', tipoPlazaSeleccionado.tarifaMaxima)
      }
    }
  }, [tipoPlazaId, tiposPlazaResponse?.data, setValue])

  if (debouncedTiposVehiculo.length === 0) {
    return (
      <div className="bg-muted flex h-full grow flex-col items-center justify-center gap-4 rounded-lg p-12 text-center">
        <span className="text-muted-foreground font-medium">
          Debes seleccionar al menos un tipo de vehículo para conocer los tipos
          de plaza disponibles y sus tarifas.
        </span>
      </div>
    )
  }

  return (
    <FormField
      control={control}
      name="tipoPlazaId"
      render={({ field }) => (
        <FormItem className="h-fit">
          <FormLabel>Tipos de plaza</FormLabel>
          <FormControl>
            {isLoadingTiposPlaza ? (
              <div className="flex grow flex-col gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <SelectableCardGroup
                mode="single"
                value={field.value?.toString() ?? ''}
                onValueChange={(value) =>
                  field.onChange(value ? Number(value) : undefined)
                }
                className="flex-col gap-3"
              >
                {tiposPlazaOrdenados.map((tipoPlaza) => {
                  const sinDisponibilidad =
                    (tipoPlaza.plazasDisponibles || 0) === 0
                  const sinTarifa =
                    tipoPlaza.tarifaMaxima === null ||
                    tipoPlaza.tarifaMaxima === undefined
                  const noSeleccionable = sinDisponibilidad || sinTarifa

                  let precioTexto = ''
                  let precioColor = 'text-green-600'

                  if (sinDisponibilidad) {
                    precioTexto = 'Sin disponibilidad'
                    precioColor = 'text-muted-foreground'
                  } else if (sinTarifa) {
                    precioTexto = 'Sin tarifa'
                    precioColor = 'text-muted-foreground'
                  } else {
                    precioTexto = `$${tipoPlaza.tarifaMaxima!.toLocaleString()}`
                    precioColor = 'text-green-600'
                  }

                  return (
                    <SelectableCardItem
                      key={tipoPlaza.id}
                      value={tipoPlaza.id.toString()}
                      disabled={noSeleccionable}
                      className={cn(
                        'min-h-24',
                        noSeleccionable ? 'cursor-not-allowed opacity-50' : ''
                      )}
                    >
                      <p className="text-medium font-medium">
                        {tipoPlaza.nombre}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {tipoPlaza.descripcion}
                      </p>
                      <p className={`text-lg ${precioColor}`}>{precioTexto}</p>
                    </SelectableCardItem>
                  )
                })}
              </SelectableCardGroup>
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
