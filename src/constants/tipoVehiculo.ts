export const TIPO_VEHICULO = {
  AUTOMOVIL: 'AUTOMOVIL',
  MOTOCICLETA: 'MOTOCICLETA',
  CAMIONETA: 'CAMIONETA'
}

export const TIPO_VEHICULO_LABEL = {
  [TIPO_VEHICULO.AUTOMOVIL]: 'Auto',
  [TIPO_VEHICULO.MOTOCICLETA]: 'Moto',
  [TIPO_VEHICULO.CAMIONETA]: 'Camioneta'
}

export type TipoVehiculo = (typeof TIPO_VEHICULO)[keyof typeof TIPO_VEHICULO]

export const ESTADO_TIPO_VEHICULO = {
  ACTIVO: 'ACTIVO',
  SUSPENDIDO: 'SUSPENDIDO'
}

export type EstadoTipoVehiculo = keyof typeof ESTADO_TIPO_VEHICULO

export const ESTADO_TIPO_VEHICULO_LABEL = {
  [ESTADO_TIPO_VEHICULO.ACTIVO]: 'Activo',
  [ESTADO_TIPO_VEHICULO.SUSPENDIDO]: 'Suspendido'
}

export const TIPOS_VEHICULO_OPTIONS = [
  { value: 'AUTOMOVIL', label: 'Auto' },
  { value: 'MOTOCICLETA', label: 'Moto' },
  { value: 'CAMIONETA', label: 'Camioneta' }
]
