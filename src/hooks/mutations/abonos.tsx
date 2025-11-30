'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateAbono } from '@/services/abonos'
import type { UpdateAbonoParams } from '@/services/abonos/types'

export const useUpdateAbono = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateAbonoParams) => {
      const result = await updateAbono(params)

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: (data) => {
      toast.success('Abono actualizado exitosamente', {
        description:
          data?.mensaje || 'Los cambios se han guardado correctamente'
      })

      queryClient.invalidateQueries({
        queryKey: ['abonos-vigentes']
      })
      queryClient.invalidateQueries({
        queryKey: ['abono']
      })
    },
    onError: (error) => {
      toast.error('Error al actualizar el abono', {
        description: error.message
      })
    }
  })
}
