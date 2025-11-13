import type {
  Caracteristica,
  RawCaracteristica
} from '@/services/caracteristicas/types'
import type { PaginationParams } from '@/types/api'

export type GetTiposPlazaParams = PaginationParams & {
  playaId?: string
  caracteristicas?: number[]
  includeAvailability?: boolean
  tiposVehiculo?: string[]
  onlyAvailable?: boolean
}

export type RawTipoPlaza = {
  tipo_plaza_id: number
  playa_id: string
  nombre: string
  descripcion: string | null
  fecha_creacion: string
  fecha_modificacion: string
  fecha_eliminacion: string | null
}

export type RawTipoPlazaWithCaracteristicas = RawTipoPlaza & {
  tipo_plaza_caracteristica: {
    caracteristica: RawCaracteristica
  }[]
}

export type TipoPlaza = {
  id: number
  playaId: string
  nombre: string
  descripcion: string | null
  fechaCreacion: Date
  fechaModificacion: Date
  fechaEliminacion: Date | null
  caracteristicas: Caracteristica[]
  plazasDisponibles?: number
  tarifaMaxima?: number | null
}
