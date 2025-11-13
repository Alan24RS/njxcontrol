import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createAbonadoWithAbonoCompleteAction } from '@/app/admin/abonados/actions'
import type { CreateAbonadoWithAbonoFormData } from '@/schemas/abonado'

export const useCreateAbonadoWithAbono = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAbonadoWithAbonoFormData) => {
      const result = await createAbonadoWithAbonoCompleteAction(data)

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['abonados']
      })
      queryClient.invalidateQueries({
        queryKey: ['abonos-vigentes']
      })
    }
  })
}
