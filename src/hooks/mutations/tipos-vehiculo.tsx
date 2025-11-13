import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { EstadoTipoVehiculo } from '@/constants/tipoVehiculo'
import { updateTipoVehiculoEstado } from '@/services/tipos-vehiculo'

type UpdateTipoVehiculoEstadoParams = {
  playaId: string
  tipoVehiculo: string
  estado: EstadoTipoVehiculo
}

export const useUpdateTipoVehiculoEstado = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateTipoVehiculoEstadoParams) => {
      const result = await updateTipoVehiculoEstado(params)

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tipos-vehiculo']
      })
    }
  })
}
