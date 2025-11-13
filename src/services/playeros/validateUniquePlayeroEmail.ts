'use server'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'

export async function validateUniquePlayeroEmail(
  email: string,
  playaId: string
): Promise<boolean> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser()

  if (!user) {
    return false
  }

  // Verificar si ya existe un playero con este email invitado por este dueño para esta playa
  const { data } = await supabase
    .from('playero_playa')
    .select(
      `
      playero_id,
      usuario:playero_id!inner (
        email
      )
    `
    )
    .eq('playa_id', playaId)
    .eq('dueno_invitador_id', user.id)
    .single()

  if (data && (data.usuario as any)?.email === email) {
    return false // Email ya existe
  }

  return true // Email es único
}
