import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateMetodoPagoEstado } from '@/services/metodos-pago-playa'

type UpdateMetodoPagoEstadoParams = {
  playaId: string
  metodoPago: string
  estado: 'ACTIVO' | 'SUSPENDIDO'
}

export const useUpdateMetodoPagoEstado = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateMetodoPagoEstadoParams) => {
      const result = await updateMetodoPagoEstado(params)

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['metodos-pago-playa']
      })
    }
  })
}
