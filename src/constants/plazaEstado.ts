export enum PLAZA_ESTADO {
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO'
}

export type PlazaEstado = (typeof PLAZA_ESTADO)[keyof typeof PLAZA_ESTADO]
