'use client'

import { useQuery } from '@tanstack/react-query'

import { getInvitationDetailsAction } from '@/app/auth/queries'
import type { InvitationDetails } from '@/services/playeros/getInvitationDetails'
import type { ApiResponse } from '@/types/api'

export function useGetInvitationDetails(email: string, duenoId: string) {
  return useQuery<ApiResponse<InvitationDetails>>({
    queryKey: ['invitation-details', email, duenoId],
    queryFn: async () => {
      return await getInvitationDetailsAction(email, duenoId)
    },
    enabled: !!(email && duenoId),
    staleTime: 0,
    gcTime: 0
  })
}
