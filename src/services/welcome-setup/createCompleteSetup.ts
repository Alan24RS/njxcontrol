'use server'

import { createClient } from '@/lib/supabase/server'
import type { WelcomeSetupFormData } from '@/schemas/welcome-setup'
import { revalidateAll } from '@/utils/revalidation'

export interface CreateCompleteSetupResult {
  success: boolean
  playaId?: string
  error?: string
}

export async function createCompleteSetup(
  data: WelcomeSetupFormData
): Promise<CreateCompleteSetupResult> {
  const supabase = await createClient()

  try {
    // Extraer modalidades únicas de las tarifas
    const tarifas = data.tarifas || []
    const uniqueModalidades = Array.from(
      new Set(tarifas.map((t) => t.modalidadOcupacion))
    ).map((modalidad) => ({ modalidad_ocupacion: modalidad }))

    // Extraer tipos de vehículo únicos de las tarifas
    const uniqueTiposVehiculo = Array.from(
      new Set(tarifas.map((t) => t.tipoVehiculo))
    )

    // Las modalidades y tipos de vehículo se pasan directamente a la función

    // Iniciar transacción
    const { data: transactionResult, error: transactionError } =
      await supabase.rpc('create_complete_playa_setup', {
        playa_data: {
          nombre: data.playa.nombre || null,
          descripcion: data.playa.descripcion || null,
          direccion: data.playa.direccion,
          ciudad: data.playa.ciudad,
          provincia: data.playa.provincia,
          latitud: parseFloat(data.playa.latitud.toString()),
          longitud: parseFloat(data.playa.longitud.toString()),
          horario: data.playa.horario
        },
        tipos_plaza_data: (data.tiposPlaza || []).map((tp) => ({
          nombre: tp.nombre,
          descripcion: tp.descripcion || null,
          caracteristicas: tp.caracteristicas
        })),
        modalidades_ocupacion_data: uniqueModalidades,
        metodos_pago_data: (data.metodosPago || []).map((mp) => ({
          metodo_pago: mp.metodoPago
        })),
        plazas_data: (data.plazas || []).map((p) => ({
          tipo_plaza_index: p.tipoPlazaIndex,
          identificador:
            p.identificador && p.identificador.trim() !== ''
              ? p.identificador
              : null
        })),
        tarifas_data: tarifas.map((t) => ({
          tipo_plaza_index: t.tipoPlazaIndex,
          modalidad_ocupacion: t.modalidadOcupacion,
          tipo_vehiculo: t.tipoVehiculo,
          precio_base: t.precioBase
        })),
        tipos_vehiculo_data: uniqueTiposVehiculo
      })

    if (transactionError) {
      console.error('Error en transacción:', transactionError)
      return {
        success: false,
        error:
          transactionError.message || 'Error al crear la configuración completa'
      }
    }

    // Revalidar todo el cache después de crear la configuración completa
    await revalidateAll()

    return {
      success: true,
      playaId: transactionResult?.playa_id
    }
  } catch (error) {
    console.error('Error inesperado:', error)
    return {
      success: false,
      error: 'Error inesperado al crear la configuración'
    }
  }
}
