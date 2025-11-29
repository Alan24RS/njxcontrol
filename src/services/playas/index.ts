export * from './createPlaya'
export * from './deletePlaya'
export * from './getPlaya'
export * from './getPlayaFilters'
export * from './getPlayas'
export * from './getPlayasBasicas'
export * from './getPlayasCercanas'
export * from './getPlayasConDisponibilidad'
export * from './getPlayaStats'
export * from './getPublicPlayas'
export * from './updatePlaya'
export * from './updatePlayaEstado'

// Exportar tipos para uso externo
export type {
  DisponibilidadTipoPlaza,
  GetPlayasParams,
  GetPlayasPublicasParams,
  Playa,
  PlayaConDisponibilidad,
  PlayaPublica
} from './types'
