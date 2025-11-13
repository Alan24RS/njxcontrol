/**
 * Utilidades para lógica de negocio de ocupaciones
 */

import { OCUPACION_ESTADO } from '@/constants/ocupacionEstado'

/**
 * Ventana de tiempo en horas durante la cual se puede editar el método de pago
 * de una ocupación finalizada
 */
export const VENTANA_EDICION_METODO_PAGO_HORAS = 48

/**
 * Determina si una ocupación finalizada puede tener su método de pago editado.
 * Solo se permite editar si finalizó hace menos de 48 horas.
 *
 * @param estado - Estado actual de la ocupación
 * @param horaEgreso - Fecha/hora de egreso (finalización) de la ocupación
 * @returns true si se puede editar el método de pago, false en caso contrario
 */
export function puedeEditarMetodoPago(
  estado: string,
  horaEgreso: string | Date | null
): boolean {
  // Solo aplica para ocupaciones finalizadas
  if (estado !== OCUPACION_ESTADO.FINALIZADO) {
    return false
  }

  // Debe tener hora de egreso
  if (!horaEgreso) {
    return false
  }

  const fechaEgreso = new Date(horaEgreso)
  const ahora = new Date()
  const diferenciaMs = ahora.getTime() - fechaEgreso.getTime()
  const diferenciaHoras = diferenciaMs / (1000 * 60 * 60)

  return diferenciaHoras < VENTANA_EDICION_METODO_PAGO_HORAS
}

/**
 * Obtiene un mensaje descriptivo sobre el estado de edición de una ocupación finalizada
 *
 * @param horaEgreso - Fecha/hora de egreso de la ocupación
 * @returns Mensaje descriptivo para mostrar al usuario
 */
export function getMensajeVentanaEdicion(
  horaEgreso: string | Date | null
): string {
  if (!horaEgreso) {
    return 'No se puede editar esta ocupación.'
  }

  const fechaEgreso = new Date(horaEgreso)
  const ahora = new Date()
  const diferenciaMs = ahora.getTime() - fechaEgreso.getTime()
  const diferenciaHoras = diferenciaMs / (1000 * 60 * 60)

  if (diferenciaHoras < VENTANA_EDICION_METODO_PAGO_HORAS) {
    const horasRestantes = Math.ceil(
      VENTANA_EDICION_METODO_PAGO_HORAS - diferenciaHoras
    )
    return `Puedes editar el método de pago durante las próximas ${horasRestantes} horas.`
  }

  return `La ventana de edición expiró. Solo se puede editar el método de pago dentro de las ${VENTANA_EDICION_METODO_PAGO_HORAS} horas posteriores a la finalización.`
}
