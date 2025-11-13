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
import { TIPO_VEHICULO, TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import { useGetTiposVehiculo } from '@/hooks/queries/tipos-vehiculo/getTiposVehiculo'
import type { CreateAbonoFormData } from '@/schemas/abono'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'

export default function TiposVehiculoField() {
  const { control, watch, setValue } = useFormContext<CreateAbonoFormData>()
  const tiposVehiculo = watch('tiposVehiculo')
  const { selectedPlaya } = useSelectedPlaya()

  const tiposVehiculoKey = useMemo(
    () => tiposVehiculo.join(','),
    [tiposVehiculo]
  )

  const prevTiposVehiculoKey = useRef<string | null>(null)

  useEffect(() => {
    if (
      prevTiposVehiculoKey.current !== null &&
      prevTiposVehiculoKey.current !== tiposVehiculoKey
    ) {
      setValue('tipoPlazaId', undefined as any, {
        shouldValidate: false,
        shouldDirty: false
      })
    }
    prevTiposVehiculoKey.current = tiposVehiculoKey
  }, [tiposVehiculoKey, setValue])
  const {
    data: tiposVehiculoPlayaResponse,
    isLoading: isLoadingTiposVehiculoPlaya
  } = useGetTiposVehiculo(
    {
      playaId: selectedPlaya?.id || '',
      page: 1,
      limit: 100
    },
    {
      enabled: !!selectedPlaya?.id
    }
  )

  const tiposVehiculoPlaya = tiposVehiculoPlayaResponse?.data || []

  return (
    <FormField
      control={control}
      name="tiposVehiculo"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tipos de vehículo</FormLabel>
          <FormControl>
            {isLoadingTiposVehiculoPlaya ? (
              <div className="flex flex-col gap-4 sm:flex-row">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <SelectableCardGroup
                mode="multiple"
                value={field.value}
                onValueChange={field.onChange}
              >
                {tiposVehiculoPlaya.map((tipoVehiculo) => (
                  <SelectableCardItem
                    key={tipoVehiculo.tipoVehiculo}
                    value={tipoVehiculo.tipoVehiculo}
                    className="w-full"
                  >
                    {
                      TIPO_VEHICULO_LABEL[
                        tipoVehiculo.tipoVehiculo as keyof typeof TIPO_VEHICULO
                      ]
                    }
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
