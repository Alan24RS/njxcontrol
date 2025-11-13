'use server'

import { revalidatePath } from 'next/cache'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformOcupacion } from './transformers'
import type { Ocupacion, RawOcupacion, UpdateOcupacionParams } from './types'

/**
 * Actualiza una ocupación existente (solo ocupaciones activas)
 *
 * Validaciones:
 * - Usuario autenticado con rol PLAYERO
 * - Existe turno activo para la playa seleccionada
 * - La ocupación existe y está activa (hora_egreso IS NULL)
 * - La ocupación pertenece a la misma playa donde el playero tiene turno activo
 * - Si se cambia de plaza, la nueva plaza debe estar disponible
 *
 * Campos editables:
 * - patente
 * - tipo_vehiculo
 * - modalidad_ocupacion
 * - plaza_id (cambio de plaza)
 *
 * Nota: numero_pago NO es editable aquí, solo se asigna al finalizar la ocupación
 *
 * @param ocupacionId - ID de la ocupación a actualizar
 * @param data - Datos actualizados de la ocupación
 * @returns ApiResponse con la ocupación actualizada o error
 */
export async function updateOcupacion(
  ocupacionId: string,
  data: UpdateOcupacionParams
): Promise<ApiResponse<Ocupacion>> {
  const supabase = await createClient()

  // 1. Obtener usuario autenticado
  const user = await getAuthenticatedUser()
  if (!user) {
    return {
      data: null,
      error: 'Usuario no autenticado'
    }
  }

  // 2. Verificar que existe un turno activo para este playero
  // Nota: No podemos hacer esto con RLS, es lógica de negocio específica
  const { data: turnoActivo, error: turnoError } = await supabase
    .from('turno')
    .select('playa_id, playero_id')
    .eq('playero_id', user.id)
    .is('fecha_hora_salida', null) // Turno abierto
    .maybeSingle()

  if (turnoError || !turnoActivo) {
    return {
      data: null,
      error:
        'No tienes un turno activo. Debes tener un turno iniciado para editar ocupaciones.'
    }
  }

  // 3. Validar compatibilidad plaza-vehículo antes de actualizar
  // Verificar que existe una tarifa para la combinación tipo_plaza + tipo_vehiculo + modalidad
  const { data: plazaInfo, error: plazaError } = await supabase
    .from('plaza')
    .select('tipo_plaza_id')
    .eq('plaza_id', data.plazaId)
    .single()

  if (plazaError || !plazaInfo) {
    console.error('Error al obtener información de plaza:', plazaError)
    return {
      data: null,
      error: 'Plaza no encontrada'
    }
  }

  const { data: tarifaCompatible, error: tarifaError } = await supabase
    .from('v_tarifas')
    .select('precio_base')
    .eq('playa_id', turnoActivo.playa_id)
    .eq('tipo_plaza_id', plazaInfo.tipo_plaza_id)
    .eq('tipo_vehiculo', data.tipoVehiculo)
    .eq('modalidad_ocupacion', data.modalidadOcupacion)
    .maybeSingle()

  if (tarifaError) {
    console.error('Error al buscar tarifa:', tarifaError)
    return {
      data: null,
      error: 'Error al validar la compatibilidad de la tarifa'
    }
  }

  if (!tarifaCompatible) {
    return {
      data: null,
      error:
        'La combinación de tipo de vehículo y plaza seleccionada no es válida. No existe una tarifa configurada para esta combinación.'
    }
  }

  // 4. Actualizar la ocupación directamente
  // RLS valida automáticamente que el playero tiene acceso a la playa
  // WHERE clause valida:
  //   - Ocupación está activa (hora_egreso IS NULL)
  //   - Ocupación está en la playa del turno activo
  // Constraint único previene patentes duplicadas (idx_ocupacion_patente_activa)
  // Nota: Ya no validamos playero_id para permitir colaboración entre playeros
  const { data: rawOcupacion, error: updateError } = await supabase
    .from('ocupacion')
    .update({
      plaza_id: data.plazaId,
      patente: data.patente,
      tipo_vehiculo: data.tipoVehiculo,
      modalidad_ocupacion: data.modalidadOcupacion
    })
    .eq('ocupacion_id', ocupacionId)
    .eq('playa_id', turnoActivo.playa_id) // Solo en playa con turno activo
    .is('hora_egreso', null) // Solo ocupaciones activas
    .select()
    .single()

  if (updateError) {
    // Manejar errores específicos
    if (updateError.code === 'PGRST116') {
      // No rows returned - puede ser:
      // 1. Ocupación no existe
      // 2. Ocupación ya finalizada (hora_egreso NOT NULL)
      // 3. No tiene turno activo en esa playa
      // 4. RLS policy no permite acceso (no es playero de esa playa)
      return {
        data: null,
        error:
          'No se puede editar esta ocupación. Verifica que esté activa y que tengas acceso a la playa.'
      }
    }

    if (updateError.code === '23505') {
      // Violación de constraint único
      if (updateError.message.includes('idx_ocupacion_patente_activa')) {
        return {
          data: null,
          error: `La patente ${data.patente} ya está registrada en otra ocupación activa en esta playa.`
        }
      }
    }

    return {
      data: null,
      error: translateDBError(updateError.message)
    }
  }

  // 4. Revalidar cache de ocupaciones
  revalidatePath('/admin/ocupaciones')

  // 5. Transformar y retornar
  const ocupacion = transformOcupacion(rawOcupacion as RawOcupacion)

  if (!ocupacion) {
    return {
      data: null,
      error: 'Error al procesar la ocupación actualizada'
    }
  }

  return {
    data: ocupacion,
    error: null
  }
}
