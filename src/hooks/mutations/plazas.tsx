import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createPlaza, deletePlaza } from '@/services/plazas'

export const useCreatePlaza = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPlaza,
    onSuccess: () => {
      // Invalidar las consultas relacionadas para actualizar la UI
      queryClient.invalidateQueries({ queryKey: ['plazas'] })
    }
  })
}

export const useDeletePlaza = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePlaza,
    onSuccess: () => {
      // Invalidar las consultas relacionadas para actualizar la UI
      queryClient.invalidateQueries({ queryKey: ['plazas'] })
    }
  })
}
