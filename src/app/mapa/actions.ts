'use server'

import { getPlayasConDisponibilidad } from '@/services/playas/getPlayasConDisponibilidad'

export async function getPlayasConDisponibilidadAction() {
  const result = await getPlayasConDisponibilidad()
  console.log('🔍 Server Action - result:', JSON.stringify(result, null, 2))
  return result
}
