import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { EstadoModalidadOcupacion } from '@/constants/modalidadOcupacion'
import { updateModalidadOcupacionEstado } from '@/services/modalidades-ocupacion'

type UpdateModalidadOcupacionEstadoParams = {
  playaId: string
  modalidadOcupacion: string
  estado: EstadoModalidadOcupacion
}

export const useUpdateModalidadOcupacionEstado = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateModalidadOcupacionEstadoParams) => {
      const result = await updateModalidadOcupacionEstado(params)

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['modalidades-ocupacion']
      })
    }
  })
}
