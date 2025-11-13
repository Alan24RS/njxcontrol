'use server'

import { createClient } from '@/lib/supabase/server'

export async function hasModalidadAbono(playaId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modalidad_ocupacion_playa')
    .select('modalidad_ocupacion')
    .eq('playa_id', playaId)
    .eq('modalidad_ocupacion', 'ABONO')
    .eq('estado', 'ACTIVO')
    .maybeSingle()

  if (error) {
    console.error('Error checking ABONO modalidad:', error)
    return false
  }

  return !!data
}
