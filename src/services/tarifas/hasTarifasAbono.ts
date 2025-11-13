'use server'

import { MODALIDAD_OCUPACION } from '@/constants/modalidadOcupacion'
import { createClient } from '@/lib/supabase/server'

export async function hasTarifasAbono(playaId: string): Promise<boolean> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('tarifa')
    .select('*', { count: 'exact', head: true })
    .eq('playa_id', playaId)
    .eq('modalidad_ocupacion', MODALIDAD_OCUPACION.ABONO)

  if (error) {
    return false
  }

  return (count ?? 0) > 0
}
