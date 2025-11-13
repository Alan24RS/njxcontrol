import { useEffect, useMemo, useRef } from 'react'
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
import { useGetPlazas } from '@/hooks/queries/plazas/getPlazas'
import { CreateAbonoFormData } from '@/schemas/abono'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'

export default function PlazaField() {
  const { control, watch, setValue } = useFormContext<CreateAbonoFormData>()
  const { selectedPlaya } = useSelectedPlaya()
  const tipoPlazaId = watch('tipoPlazaId')

  const prevTipoPlazaId = useRef<number | undefined | null>(null)

  useEffect(() => {
    if (
      prevTipoPlazaId.current !== null &&
      prevTipoPlazaId.current !== tipoPlazaId
    ) {
      setValue('plazaId', '', {
        shouldValidate: false,
        shouldDirty: false
      })
    }
    prevTipoPlazaId.current = tipoPlazaId
  }, [tipoPlazaId, setValue])

  const { data: plazasResponse, isLoading: isLoadingPlazas } = useGetPlazas(
    {
      playaId: selectedPlaya?.id || '',
      tipoPlaza: tipoPlazaId,
      estado: 'ACTIVO',
      onlyAvailable: true,
      limit: 100
    },
    {
      enabled: !!selectedPlaya?.id && !!tipoPlazaId
    }
  )

  const plazasDisponibles = useMemo(() => {
    if (!plazasResponse?.data) return []
    return plazasResponse.data
  }, [plazasResponse?.data])

  if (!tipoPlazaId) {
    return (
      <div className="bg-muted flex h-full grow flex-col items-center justify-center gap-4 rounded-lg p-12 text-center">
        <span className="text-muted-foreground font-medium">
          Debes seleccionar un tipo de plaza para conocer las plazas
          disponibles.
        </span>
      </div>
    )
  }

  return (
    <FormField
      control={control}
      name="plazaId"
      render={({ field }) => (
        <FormItem className="h-fit">
          <FormLabel>Plaza</FormLabel>
          <FormControl>
            {isLoadingPlazas ? (
              <div className="flex grow flex-col gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : plazasDisponibles.length === 0 ? (
              <div className="bg-muted flex h-full grow flex-col items-center justify-center gap-4 rounded-lg p-8 text-center">
                <span className="text-muted-foreground font-medium">
                  No hay plazas disponibles para este tipo de plaza.
                </span>
              </div>
            ) : (
              <SelectableCardGroup
                mode="single"
                value={field.value ?? ''}
                onValueChange={field.onChange}
                className="grow flex-col gap-3"
              >
                {plazasDisponibles.map((plaza) => (
                  <SelectableCardItem
                    key={plaza.id}
                    value={plaza.id}
                    className="min-h-16"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">
                          {plaza.identificador ||
                            `Plaza ${plaza.id.slice(0, 8)}`}
                        </p>
                        {plaza.tipoPlaza && (
                          <p className="text-muted-foreground text-xs">
                            {plaza.tipoPlaza.nombre}
                          </p>
                        )}
                      </div>
                    </div>
                  </SelectableCardItem>
                ))}
              </SelectableCardGroup>
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
