import {
  ESTADO_METODO_PAGO,
  METODO_PAGO
} from '../../../src/constants/metodoPago'
import { MODALIDAD_OCUPACION } from '../../../src/constants/modalidadOcupacion'
import { PLAYA_ESTADO } from '../../../src/constants/playaEstado'
import { PLAZA_ESTADO } from '../../../src/constants/plazaEstado'
import {
  ESTADO_TIPO_VEHICULO,
  TIPO_VEHICULO
} from '../../../src/constants/tipoVehiculo'

import {
  CIUDAD_CORRIENTES_ID,
  CIUDAD_RESISTENCIA_ID,
  PLAYA_1_ID,
  PLAYA_1_PLAZAS,
  PLAYA_2_ID,
  PLAYA_2_PLAZAS,
  PLAYA_3_ID,
  PLAYA_3_PLAZAS,
  PLAYA_4_ID,
  PLAYA_4_PLAZAS
} from './uuids'

export { PLAYA_1_ID, PLAYA_2_ID, PLAYA_3_ID, PLAYA_4_ID }

export const testPlayas = [
  {
    playa_id: PLAYA_1_ID,
    nombre: 'UTN-Parking',
    direccion: 'Avenida Laprida 405',
    ciudad_id: CIUDAD_RESISTENCIA_ID,
    latitud: -27.4479133,
    longitud: -58.9756058,
    horario: '15:00 - 18:00',
    descripcion: 'Parking destinado a alumnos y profesores de la facultad UTN',
    estado: PLAYA_ESTADO.ACTIVO
  },
  {
    playa_id: PLAYA_2_ID,
    nombre: 'Centro Plaza Parking',
    direccion: 'Calle Junín 1250',
    ciudad_id: CIUDAD_CORRIENTES_ID,
    latitud: -27.4692,
    longitud: -58.8306,
    horario: '07:00 - 22:00',
    descripcion:
      'Estacionamiento céntrico con capacidad para vehículos grandes y motocicletas',
    estado: PLAYA_ESTADO.ACTIVO
  },
  {
    playa_id: PLAYA_3_ID,
    nombre: 'Shopping Parking',
    direccion: 'Avenida 25 de Mayo 1200',
    ciudad_id: CIUDAD_RESISTENCIA_ID,
    latitud: -27.451234,
    longitud: -58.987654,
    horario: '08:00 - 23:00',
    descripcion:
      'Estacionamiento del centro comercial con acceso directo al shopping',
    estado: PLAYA_ESTADO.ACTIVO
  },
  {
    playa_id: PLAYA_4_ID,
    nombre: 'Terminal Parking',
    direccion: 'Avenida Sarmiento 800',
    ciudad_id: CIUDAD_CORRIENTES_ID,
    latitud: -27.48,
    longitud: -58.82,
    horario: '06:00 - 24:00',
    descripcion:
      'Estacionamiento cercano a la terminal de ómnibus con servicio 24/7',
    estado: PLAYA_ESTADO.ACTIVO
  }
]

export const testMetodosPago = [
  {
    playa_id: PLAYA_1_ID,
    metodos: [
      { metodo_pago: METODO_PAGO.EFECTIVO, estado: ESTADO_METODO_PAGO.ACTIVO },
      {
        metodo_pago: METODO_PAGO.MERCADO_PAGO,
        estado: ESTADO_METODO_PAGO.ACTIVO
      }
    ]
  },
  {
    playa_id: PLAYA_2_ID,
    metodos: [
      { metodo_pago: METODO_PAGO.EFECTIVO, estado: ESTADO_METODO_PAGO.ACTIVO },
      {
        metodo_pago: METODO_PAGO.MERCADO_PAGO,
        estado: ESTADO_METODO_PAGO.ACTIVO
      },
      {
        metodo_pago: METODO_PAGO.TRANSFERENCIA,
        estado: ESTADO_METODO_PAGO.ACTIVO
      }
    ]
  },
  {
    playa_id: PLAYA_3_ID,
    metodos: [
      { metodo_pago: METODO_PAGO.EFECTIVO, estado: ESTADO_METODO_PAGO.ACTIVO },
      {
        metodo_pago: METODO_PAGO.MERCADO_PAGO,
        estado: ESTADO_METODO_PAGO.ACTIVO
      },
      {
        metodo_pago: METODO_PAGO.TRANSFERENCIA,
        estado: ESTADO_METODO_PAGO.ACTIVO
      }
    ]
  },
  {
    playa_id: PLAYA_4_ID,
    metodos: [
      { metodo_pago: METODO_PAGO.EFECTIVO, estado: ESTADO_METODO_PAGO.ACTIVO },
      {
        metodo_pago: METODO_PAGO.TRANSFERENCIA,
        estado: ESTADO_METODO_PAGO.ACTIVO
      }
    ]
  }
]

export const testTiposVehiculo = [
  {
    playa_id: PLAYA_1_ID,
    tipos: [
      {
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        estado: ESTADO_TIPO_VEHICULO.ACTIVO
      },
      {
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        estado: ESTADO_TIPO_VEHICULO.ACTIVO
      }
    ]
  },
  {
    playa_id: PLAYA_2_ID,
    tipos: [
      {
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        estado: ESTADO_TIPO_VEHICULO.ACTIVO
      },
      {
        tipo_vehiculo: TIPO_VEHICULO.CAMIONETA,
        estado: ESTADO_TIPO_VEHICULO.ACTIVO
      },
      {
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        estado: ESTADO_TIPO_VEHICULO.ACTIVO
      }
    ]
  },
  {
    playa_id: PLAYA_3_ID,
    tipos: [
      {
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        estado: ESTADO_TIPO_VEHICULO.ACTIVO
      },
      {
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        estado: ESTADO_TIPO_VEHICULO.ACTIVO
      }
    ]
  },
  {
    playa_id: PLAYA_4_ID,
    tipos: [
      {
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        estado: ESTADO_TIPO_VEHICULO.ACTIVO
      },
      {
        tipo_vehiculo: TIPO_VEHICULO.CAMIONETA,
        estado: ESTADO_TIPO_VEHICULO.ACTIVO
      },
      {
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        estado: ESTADO_TIPO_VEHICULO.ACTIVO
      }
    ]
  }
]

export const testTiposPlaza = [
  {
    playa_id: PLAYA_1_ID,
    tipos: [
      {
        tipo_plaza_id: 41,
        nombre: 'Estándar',
        descripcion: 'Plaza básica sin características especiales'
      },
      {
        tipo_plaza_id: 39,
        nombre: 'Eléctricos',
        descripcion: 'Plaza con punto de carga para vehículos eléctricos'
      },
      {
        tipo_plaza_id: 40,
        nombre: 'Premium',
        descripcion: 'Plaza techada y protegida'
      }
    ]
  },
  {
    playa_id: PLAYA_2_ID,
    tipos: [
      {
        tipo_plaza_id: 50,
        nombre: 'VIP',
        descripcion: 'Plaza exclusiva con servicio preferencial'
      },
      {
        tipo_plaza_id: 51,
        nombre: 'Regular',
        descripcion: 'Plaza estándar para todo tipo de vehículos'
      },
      {
        tipo_plaza_id: 52,
        nombre: 'Motos',
        descripcion: 'Espacio especial para motocicletas'
      }
    ]
  },
  {
    playa_id: PLAYA_3_ID,
    tipos: [
      {
        tipo_plaza_id: 60,
        nombre: 'Cubierta',
        descripcion: 'Plaza techada para protección del vehículo'
      },
      {
        tipo_plaza_id: 61,
        nombre: 'Descubierta',
        descripcion: 'Plaza al aire libre'
      },
      {
        tipo_plaza_id: 62,
        nombre: 'Motos',
        descripcion: 'Espacio para motocicletas'
      }
    ]
  },
  {
    playa_id: PLAYA_4_ID,
    tipos: [
      {
        tipo_plaza_id: 70,
        nombre: 'Grande',
        descripcion: 'Plaza para vehículos grandes y ómnibus'
      },
      {
        tipo_plaza_id: 71,
        nombre: 'Estándar',
        descripcion: 'Plaza para automóviles y camionetas'
      },
      {
        tipo_plaza_id: 72,
        nombre: 'Compacta',
        descripcion: 'Plaza para motocicletas y vehículos pequeños'
      }
    ]
  }
]

export const testTarifas = [
  {
    playa_id: PLAYA_1_ID,
    tarifas: [
      {
        tipo_plaza_id: 41,
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 800
      },
      {
        tipo_plaza_id: 41,
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        precio_base: 400
      },
      {
        tipo_plaza_id: 41,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 5000
      },
      {
        tipo_plaza_id: 41,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        precio_base: 2500
      },
      {
        tipo_plaza_id: 41,
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 100000
      },
      {
        tipo_plaza_id: 41,
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        precio_base: 50000
      },
      {
        tipo_plaza_id: 39,
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 1500
      },
      {
        tipo_plaza_id: 39,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 10000
      },
      {
        tipo_plaza_id: 39,
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 180000
      },
      {
        tipo_plaza_id: 40,
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 1200
      },
      {
        tipo_plaza_id: 40,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 8000
      },
      {
        tipo_plaza_id: 40,
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 120000
      }
    ]
  },
  {
    playa_id: PLAYA_2_ID,
    tarifas: [
      {
        tipo_plaza_id: 50,
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 2000
      },
      {
        tipo_plaza_id: 50,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 15000
      },
      {
        tipo_plaza_id: 50,
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 200000
      },
      {
        tipo_plaza_id: 51,
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 1000
      },
      {
        tipo_plaza_id: 51,
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        tipo_vehiculo: TIPO_VEHICULO.CAMIONETA,
        precio_base: 1200
      },
      {
        tipo_plaza_id: 51,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 7000
      },
      {
        tipo_plaza_id: 51,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.CAMIONETA,
        precio_base: 9000
      },
      {
        tipo_plaza_id: 51,
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 140000
      },
      {
        tipo_plaza_id: 51,
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        tipo_vehiculo: TIPO_VEHICULO.CAMIONETA,
        precio_base: 160000
      },
      {
        tipo_plaza_id: 52,
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        precio_base: 500
      },
      {
        tipo_plaza_id: 52,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        precio_base: 3000
      },
      {
        tipo_plaza_id: 52,
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        precio_base: 60000
      }
    ]
  },
  {
    playa_id: PLAYA_3_ID,
    tarifas: [
      {
        tipo_plaza_id: 60,
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 1500
      },
      {
        tipo_plaza_id: 60,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 12000
      },
      {
        tipo_plaza_id: 60,
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 150000
      },
      {
        tipo_plaza_id: 61,
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 1000
      },
      {
        tipo_plaza_id: 61,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 8000
      },
      {
        tipo_plaza_id: 61,
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 110000
      },
      {
        tipo_plaza_id: 62,
        modalidad_ocupacion: MODALIDAD_OCUPACION.POR_HORA,
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        precio_base: 600
      },
      {
        tipo_plaza_id: 62,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        precio_base: 4000
      },
      {
        tipo_plaza_id: 62,
        modalidad_ocupacion: MODALIDAD_OCUPACION.ABONO,
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        precio_base: 70000
      }
    ]
  },
  {
    playa_id: PLAYA_4_ID,
    tarifas: [
      {
        tipo_plaza_id: 70,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.CAMIONETA,
        precio_base: 12000
      },
      {
        tipo_plaza_id: 71,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.AUTOMOVIL,
        precio_base: 9000
      },
      {
        tipo_plaza_id: 71,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.CAMIONETA,
        precio_base: 11000
      },
      {
        tipo_plaza_id: 72,
        modalidad_ocupacion: MODALIDAD_OCUPACION.DIARIA,
        tipo_vehiculo: TIPO_VEHICULO.MOTOCICLETA,
        precio_base: 3500
      }
    ]
  }
]

export const testPlazas = [
  {
    playa_id: PLAYA_1_ID,
    plazas: [
      {
        plaza_id: PLAYA_1_PLAZAS.PLAZA_1,
        tipo_plaza_id: 41,
        identificador: 'A1',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_1_PLAZAS.PLAZA_2,
        tipo_plaza_id: 41,
        identificador: 'A2',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_1_PLAZAS.PLAZA_3,
        tipo_plaza_id: 41,
        identificador: 'A3',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_1_PLAZAS.PLAZA_4,
        tipo_plaza_id: 41,
        identificador: 'A4',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_1_PLAZAS.PLAZA_5,
        tipo_plaza_id: 39,
        identificador: 'E1',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_1_PLAZAS.PLAZA_6,
        tipo_plaza_id: 39,
        identificador: 'E2',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_1_PLAZAS.PLAZA_7,
        tipo_plaza_id: 40,
        identificador: 'P1',
        estado: PLAZA_ESTADO.ACTIVO
      }
    ]
  },
  {
    playa_id: PLAYA_2_ID,
    plazas: [
      {
        plaza_id: PLAYA_2_PLAZAS.PLAZA_1,
        tipo_plaza_id: 50,
        identificador: 'VIP-1',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_2_PLAZAS.PLAZA_2,
        tipo_plaza_id: 50,
        identificador: 'VIP-2',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_2_PLAZAS.PLAZA_3,
        tipo_plaza_id: 51,
        identificador: 'R1',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_2_PLAZAS.PLAZA_4,
        tipo_plaza_id: 51,
        identificador: 'R2',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_2_PLAZAS.PLAZA_5,
        tipo_plaza_id: 51,
        identificador: 'R3',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_2_PLAZAS.PLAZA_6,
        tipo_plaza_id: 51,
        identificador: 'R4',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_2_PLAZAS.PLAZA_7,
        tipo_plaza_id: 52,
        identificador: 'M1',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_2_PLAZAS.PLAZA_8,
        tipo_plaza_id: 52,
        identificador: 'M2',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_2_PLAZAS.PLAZA_9,
        tipo_plaza_id: 52,
        identificador: 'M3',
        estado: PLAZA_ESTADO.ACTIVO
      }
    ]
  },
  {
    playa_id: PLAYA_3_ID,
    plazas: [
      {
        plaza_id: PLAYA_3_PLAZAS.PLAZA_1,
        tipo_plaza_id: 60,
        identificador: 'C1',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_3_PLAZAS.PLAZA_2,
        tipo_plaza_id: 60,
        identificador: 'C2',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_3_PLAZAS.PLAZA_3,
        tipo_plaza_id: 61,
        identificador: 'D1',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_3_PLAZAS.PLAZA_4,
        tipo_plaza_id: 61,
        identificador: 'D2',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_3_PLAZAS.PLAZA_5,
        tipo_plaza_id: 61,
        identificador: 'D3',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_3_PLAZAS.PLAZA_6,
        tipo_plaza_id: 62,
        identificador: 'M1',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_3_PLAZAS.PLAZA_7,
        tipo_plaza_id: 62,
        identificador: 'M2',
        estado: PLAZA_ESTADO.ACTIVO
      }
    ]
  },
  {
    playa_id: PLAYA_4_ID,
    plazas: [
      {
        plaza_id: PLAYA_4_PLAZAS.PLAZA_1,
        tipo_plaza_id: 70,
        identificador: 'G1',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_4_PLAZAS.PLAZA_2,
        tipo_plaza_id: 70,
        identificador: 'G2',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_4_PLAZAS.PLAZA_3,
        tipo_plaza_id: 71,
        identificador: 'E1',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_4_PLAZAS.PLAZA_4,
        tipo_plaza_id: 71,
        identificador: 'E2',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_4_PLAZAS.PLAZA_5,
        tipo_plaza_id: 71,
        identificador: 'E3',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_4_PLAZAS.PLAZA_6,
        tipo_plaza_id: 71,
        identificador: 'E4',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_4_PLAZAS.PLAZA_7,
        tipo_plaza_id: 72,
        identificador: 'C1',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_4_PLAZAS.PLAZA_8,
        tipo_plaza_id: 72,
        identificador: 'C2',
        estado: PLAZA_ESTADO.ACTIVO
      },
      {
        plaza_id: PLAYA_4_PLAZAS.PLAZA_9,
        tipo_plaza_id: 72,
        identificador: 'C3',
        estado: PLAZA_ESTADO.ACTIVO
      }
    ]
  }
]
