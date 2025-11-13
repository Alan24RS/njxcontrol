export enum PLAYA_ESTADO {
  BORRADOR = 'BORRADOR',
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO'
}

export const ESTADO_PLAYA_LABEL = {
  [PLAYA_ESTADO.BORRADOR]: 'Borrador',
  [PLAYA_ESTADO.ACTIVO]: 'Activo',
  [PLAYA_ESTADO.SUSPENDIDO]: 'Suspendido'
}

export type PlayaEstado = (typeof PLAYA_ESTADO)[keyof typeof PLAYA_ESTADO]
