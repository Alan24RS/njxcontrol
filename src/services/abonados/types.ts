import { PaginationParams } from '@/types/api'

export type RawAbonado = {
  abonado_id: number
  nombre: string
  apellido: string
  email: string | null
  telefono: string | null
  dni: string
  fecha_alta: string
  estado: boolean
}

export type Abonado = {
  id: number
  nombre: string
  apellido: string
  email: string | null
  telefono: string | null
  dni: string
  fechaAlta: Date
  estado: boolean
}

export type GetAbonadosParams = PaginationParams & {
  sortBy?: string
  order?: 'asc' | 'desc'
  fromDate?: string
  toDate?: string
  estado?: string[]
  playaId?: string
}

export type CreateAbonadoParams = {
  nombre: string
  apellido: string
  email?: string
  telefono?: string
  dni: string
  estado?: boolean
}

export type RawAbono = {
  playa_id: string
  plaza_id: string
  fecha_hora_inicio: string
  fecha_fin: string | null
  abonado_id: number
}

export type Abono = {
  playaId: string
  plazaId: string
  fechaHoraInicio: Date
  fechaFin: Date | null
  abonadoId: number
}

export type CreateAbonoParams = {
  playaId: string
  plazaId: string
  fechaHoraInicio: string
  fechaFin?: string | null
  abonadoId: number
}
