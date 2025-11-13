import {
  ESTADO_MODALIDAD_OCUPACION,
  MODALIDAD_OCUPACION
} from '../../../src/constants/modalidadOcupacion'

import { PLAYA_1_ID, PLAYA_2_ID, PLAYA_3_ID, PLAYA_4_ID } from './playas'

export const testModalidadesOcupacion = [
  {
    playa_id: PLAYA_1_ID,
    modalidades: [
      {
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        estado: ESTADO_MODALIDAD_OCUPACION.ACTIVO
      },
      {
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        estado: ESTADO_MODALIDAD_OCUPACION.ACTIVO
      },
      {
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        estado: ESTADO_MODALIDAD_OCUPACION.ACTIVO
      }
    ]
  },
  {
    playa_id: PLAYA_2_ID,
    modalidades: [
      {
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        estado: ESTADO_MODALIDAD_OCUPACION.ACTIVO
      },
      {
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        estado: ESTADO_MODALIDAD_OCUPACION.ACTIVO
      },
      {
        modalidad_ocupacion: MODALIDAD_OCUPACION.SEMANAL,
        estado: ESTADO_MODALIDAD_OCUPACION.ACTIVO
      }
    ]
  },
  {
    playa_id: PLAYA_3_ID,
    modalidades: [
      {
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        estado: ESTADO_MODALIDAD_OCUPACION.ACTIVO
      },
      {
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        estado: ESTADO_MODALIDAD_OCUPACION.ACTIVO
      },
      {
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        estado: ESTADO_MODALIDAD_OCUPACION.ACTIVO
      }
    ]
  },
  {
    playa_id: PLAYA_4_ID,
    modalidades: [
      {
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        estado: ESTADO_MODALIDAD_OCUPACION.ACTIVO
      },
      {
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        estado: ESTADO_MODALIDAD_OCUPACION.ACTIVO
      }
    ]
  }
]
