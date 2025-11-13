'use server'

import { getInvitationDetails } from '@/services/playeros/getInvitationDetails'

export async function getInvitationDetailsAction(
  email: string,
  duenoId: string
) {
  if (!email || !duenoId) {
    return {
      data: null,
      error: 'Email y duenoId son requeridos'
    }
  }

  return await getInvitationDetails(email, duenoId)
}
