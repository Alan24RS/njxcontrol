'use server'

import { revalidatePath } from 'next/cache'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformOcupacion } from './transformers'
import type { CreateOcupacionParams, Ocupacion, RawOcupacion } from './types'

/**
 * Crea una nueva ocupación (registro de ingreso de vehículo)
 *
 * Validaciones:
 * - Usuario autenticado (con rol PLAYERO o DUENO)
 * - Si es PLAYERO: Debe existir turno activo para la playa seleccionada
 * - Si es DUENO: No requiere turno activo (bypass)
 * - La plaza está disponible (sin ocupación abierta)
 * - El timestamp de ingreso lo establece el servidor (now())
 *
 * @param data - Datos de la ocupación a crear
 * @returns ApiResponse con la ocupación creada o error
 */
export async function createOcupacion(
  data: CreateOcupacionParams
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

  // 2. Verificar rol: dueños no necesitan turno activo
  const isDueno = user.roles?.includes('DUENO') ?? false

  // 3. Solo validar turno activo si es playero (no dueño)
  if (!isDueno) {
    const { data: turnoActivo, error: turnoError } = await supabase
      .from('turno')
      .select('playa_id, playero_id, fecha_hora_ingreso')
      .eq('playa_id', data.playaId)
      .eq('playero_id', user.id)
      .is('fecha_hora_salida', null) // Turno abierto
      .single()

    if (turnoError || !turnoActivo) {
      return {
        data: null,
        error:
          'No tienes un turno activo en esta playa. Debes iniciar turno antes de registrar ocupaciones.'
      }
    }
  }

  // 3. Insertar la ocupación
  // La hora_ingreso se establece automáticamente en el servidor con DEFAULT now()
  // El constraint único parcial en la BD previene duplicados de patentes activas:
  // - idx_ocupacion_patente_activa: UNIQUE (playa_id, patente) WHERE hora_egreso IS NULL
  // Esto elimina race conditions y garantiza integridad a nivel de base de datos.
  // Además, evita la necesidad de una consulta previa para verificar duplicados (check-then-insert),
  // lo que mejora el rendimiento al reducir el número de queries y previene condiciones de carrera
  // que podrían ocurrir entre la verificación y la inserción. Este enfoque "constraint-first" es
  // preferible al antipatrón de "verificar y luego insertar".
  const { data: rawOcupacion, error: insertError } = await supabase
    .from('ocupacion')
    .insert({
      playa_id: data.playaId,
      plaza_id: data.plazaId,
      playero_id: user.id,
      patente: data.patente,
      tipo_vehiculo: data.tipoVehiculo,
      modalidad_ocupacion: data.modalidadOcupacion,
      numero_pago: data.numeroPago || null
      // hora_ingreso: se establece automáticamente con DEFAULT now()
    })
    .select()
    .single()

  if (insertError) {
    // Manejar errores específicos
    if (insertError.code === '23505') {
      // Violación de constraint único
      if (insertError.message.includes('idx_ocupacion_patente_activa')) {
        return {
          data: null,
          error: `La patente ${data.patente} ya está registrada en una ocupación activa en esta playa.`
        }
      }
      return {
        data: null,
        error:
          'Este espacio ya está ocupado. Selecciona otro espacio disponible.'
      }
    }

    return {
      data: null,
      error: translateDBError(insertError.message)
    }
  }

  // 6. Revalidar cache de ocupaciones
  revalidatePath('/admin/ocupaciones')

  // 7. Transformar y retornar
  const ocupacion = transformOcupacion(rawOcupacion as RawOcupacion)

  if (!ocupacion) {
    return {
      data: null,
      error: 'Error al procesar la ocupación creada'
    }
  }

  return {
    data: ocupacion,
    error: null
  }
}
