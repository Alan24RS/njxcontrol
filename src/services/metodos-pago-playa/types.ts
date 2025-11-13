import { EstadoMetodoPago, MetodoPago } from '@/constants/metodoPago'
import type { PaginationParams } from '@/types/api'

export type GetMetodosPagoPlayaParams = PaginationParams & {
  playaId?: string
}

export type RawMetodoPagoPlaya = {
  playa_id: string
  metodo_pago: MetodoPago
  estado: EstadoMetodoPago
  fecha_creacion: string
  fecha_modificacion: string
}

export type MetodoPagoPlaya = {
  playaId: string
  metodoPago: MetodoPago
  estado: EstadoMetodoPago
  fechaCreacion: Date
  fechaModificacion: Date
}
