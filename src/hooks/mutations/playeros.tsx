import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { InvitarPlayeroRequest } from '@/schemas/playero'
import { invitePlayero, toggleSelfPlayeroRole } from '@/services/playeros'

export const useInvitePlayero = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: InvitarPlayeroRequest) => {
      const result = await invitePlayero(params)

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    },
    onSuccess: () => {
      // Invalidar queries relacionadas con playeros
      queryClient.invalidateQueries({
        queryKey: ['playeros']
      })
    }
  })
}

export const useToggleSelfPlayeroRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      playaId: string
      currentlyIsPlayero: boolean
    }) => {
      const result = await toggleSelfPlayeroRole(
        params.playaId,
        params.currentlyIsPlayero
      )

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ['playeros']
      })
      queryClient.invalidateQueries({
        queryKey: ['user-is-playero', variables.playaId]
      })
    }
  })
}
