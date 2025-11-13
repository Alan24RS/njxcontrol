'use server'

import { createClient } from '@/lib/supabase/server'

export type ModalidadAbonoStatus = {
  exists: boolean
  isActive: boolean
  estado?: string
}

export async function getModalidadAbonoStatus(
  playaId: string
): Promise<ModalidadAbonoStatus> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modalidad_ocupacion_playa')
    .select('estado')
    .eq('playa_id', playaId)
    .eq('modalidad_ocupacion', 'ABONO')
    .maybeSingle()

  if (error) {
    console.error('Error checking ABONO modalidad:', error)
    return { exists: false, isActive: false }
  }

  if (!data) {
    return { exists: false, isActive: false }
  }

  return {
    exists: true,
    isActive: data.estado === 'ACTIVO',
    estado: data.estado
  }
}
