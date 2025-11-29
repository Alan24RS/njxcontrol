import {
  PLAYA_1_ID,
  PLAYA_1_PLAZAS,
  PLAYA_2_ID,
  PLAYA_2_PLAZAS,
  PLAYA_3_ID,
  PLAYA_3_PLAZAS,
  PLAYA_4_ID,
  PLAYA_4_PLAZAS
} from './uuids'

// Función auxiliar para generar fechas aleatorias en un rango
function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  )
}

// Función para calcular el primer día del mes hace N meses
function getStartOfMonthsAgo(monthsAgo: number): Date {
  const date = new Date()
  date.setMonth(date.getMonth() - monthsAgo)
  date.setDate(1)
  date.setHours(8, 0, 0, 0)
  return date
}

// Función para calcular el último día del mes hace N meses
function getEndOfMonthsAgo(monthsAgo: number): Date {
  const date = new Date()
  date.setMonth(date.getMonth() - monthsAgo + 1)
  date.setDate(0)
  date.setHours(20, 0, 0, 0)
  return date
}

// Precios mensuales realistas por playa (basados en tarifas existentes)
const PRECIOS_MENSUALES: Record<string, number[]> = {
  [PLAYA_1_ID]: [100000, 120000, 180000], // UTN-Parking: Estándar, Premium, Eléctricos
  [PLAYA_2_ID]: [140000, 160000, 200000, 60000], // Centro Plaza: Regular, Regular Camioneta, VIP, Motos
  [PLAYA_3_ID]: [110000, 150000, 70000], // Shopping: Descubierta, Cubierta, Motos
  [PLAYA_4_ID]: [90000, 120000] // Terminal: Solo diario en seed original, agregamos precios ficticios
}

// Estados posibles
type AbonoEstado = 'ACTIVO' | 'FINALIZADO' | 'SUSPENDIDO'

// Interface para abono de prueba
interface TestAbono {
  playa_id: string
  plaza_id: string
  fecha_hora_inicio: string
  fecha_fin: string | null
  abonado_id: number
  precio_mensual: number
  estado: AbonoEstado
  turno_creacion_playa_id: string
  turno_creacion_playero_id: string
  turno_creacion_fecha_hora_ingreso: string
  turno_finalizacion_playa_id: string | null
  turno_finalizacion_playero_id: string | null
  turno_finalizacion_fecha_hora_ingreso: string | null
}

// Datos de abonados ficticios (IDs de prueba)
export const testAbonados = [
  {
    abonado_id: 1,
    dni: '12345678',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@test.com',
    telefono: '3794123456'
  },
  {
    abonado_id: 2,
    dni: '23456789',
    nombre: 'María',
    apellido: 'González',
    email: 'maria.gonzalez@test.com',
    telefono: '3794234567'
  },
  {
    abonado_id: 3,
    dni: '34567890',
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    email: 'carlos.rodriguez@test.com',
    telefono: '3794345678'
  },
  {
    abonado_id: 4,
    dni: '45678901',
    nombre: 'Ana',
    apellido: 'Martínez',
    email: 'ana.martinez@test.com',
    telefono: '3794456789'
  },
  {
    abonado_id: 5,
    dni: '56789012',
    nombre: 'Luis',
    apellido: 'López',
    email: 'luis.lopez@test.com',
    telefono: '3794567890'
  },
  {
    abonado_id: 6,
    dni: '67890123',
    nombre: 'Laura',
    apellido: 'Sánchez',
    email: 'laura.sanchez@test.com',
    telefono: '3794678901'
  },
  {
    abonado_id: 7,
    dni: '78901234',
    nombre: 'Diego',
    apellido: 'Fernández',
    email: 'diego.fernandez@test.com',
    telefono: '3794789012'
  },
  {
    abonado_id: 8,
    dni: '89012345',
    nombre: 'Sofía',
    apellido: 'García',
    email: 'sofia.garcia@test.com',
    telefono: '3794890123'
  },
  {
    abonado_id: 9,
    dni: '90123456',
    nombre: 'Martín',
    apellido: 'Ramírez',
    email: 'martin.ramirez@test.com',
    telefono: '3794901234'
  },
  {
    abonado_id: 10,
    dni: '01234567',
    nombre: 'Valentina',
    apellido: 'Torres',
    email: 'valentina.torres@test.com',
    telefono: '3794012345'
  },
  {
    abonado_id: 11,
    dni: '11234567',
    nombre: 'Facundo',
    apellido: 'Gómez',
    email: 'facundo.gomez@test.com',
    telefono: '3794112345'
  },
  {
    abonado_id: 12,
    dni: '21234567',
    nombre: 'Camila',
    apellido: 'Díaz',
    email: 'camila.diaz@test.com',
    telefono: '3794212345'
  },
  {
    abonado_id: 13,
    dni: '31234567',
    nombre: 'Nicolás',
    apellido: 'Morales',
    email: 'nicolas.morales@test.com',
    telefono: '3794312345'
  },
  {
    abonado_id: 14,
    dni: '41234567',
    nombre: 'Florencia',
    apellido: 'Castro',
    email: 'florencia.castro@test.com',
    telefono: '3794412345'
  },
  {
    abonado_id: 15,
    dni: '51234567',
    nombre: 'Mateo',
    apellido: 'Romero',
    email: 'mateo.romero@test.com',
    telefono: '3794512345'
  }
]

// Función para generar abonos de prueba por playa
function generateAbonosForPlaya(
  playaId: string,
  plazaIds: string[],
  playeroId: string,
  startAbonadoId: number,
  count: number
): TestAbono[] {
  const abonos: TestAbono[] = []
  const precios = PRECIOS_MENSUALES[playaId] || [100000]

  // Distribución: 60% ACTIVO, 30% FINALIZADO, 10% SUSPENDIDO
  const estados: AbonoEstado[] = []
  for (let i = 0; i < count; i++) {
    if (i < count * 0.6) estados.push('ACTIVO')
    else if (i < count * 0.9) estados.push('FINALIZADO')
    else estados.push('SUSPENDIDO')
  }

  // Mezclar estados
  estados.sort(() => Math.random() - 0.5)

  for (let i = 0; i < count; i++) {
    const estado = estados[i]
    const plazaId = plazaIds[i % plazaIds.length]
    const precioMensual = precios[i % precios.length]
    const abonadoIndex = (startAbonadoId + i) % 15 // Reutilizar los 15 abonados

    // Determinar mes de inicio (distribuir entre los últimos 6-12 meses)
    const mesesAtras = Math.floor(Math.random() * 12) + 1
    const fechaInicio = randomDate(
      getStartOfMonthsAgo(mesesAtras),
      getEndOfMonthsAgo(mesesAtras)
    )

    // Determinar fecha fin según el estado
    let fechaFin: Date | null = null
    let turnoFinPlaya: string | null = null
    let turnoFinPlayero: string | null = null
    let turnoFinFecha: Date | null = null

    if (estado === 'FINALIZADO') {
      // Finalizado: fecha_fin entre 1-6 meses después del inicio
      const mesesDuracion = Math.floor(Math.random() * 6) + 1
      fechaFin = new Date(fechaInicio)
      fechaFin.setMonth(fechaFin.getMonth() + mesesDuracion)

      // Agregar turno de finalización
      turnoFinPlaya = playaId
      turnoFinPlayero = playeroId
      turnoFinFecha = fechaFin
    } else if (estado === 'SUSPENDIDO') {
      // Suspendido: fecha_fin en el pasado reciente (1-3 meses después del inicio)
      const mesesDuracion = Math.floor(Math.random() * 3) + 1
      fechaFin = new Date(fechaInicio)
      fechaFin.setMonth(fechaFin.getMonth() + mesesDuracion)

      turnoFinPlaya = playaId
      turnoFinPlayero = playeroId
      turnoFinFecha = fechaFin
    }
    // Si es ACTIVO, fecha_fin = null (abono continuo)

    abonos.push({
      playa_id: playaId,
      plaza_id: plazaId,
      fecha_hora_inicio: fechaInicio.toISOString(),
      fecha_fin: fechaFin ? fechaFin.toISOString().split('T')[0] : null,
      abonado_id: abonadoIndex,
      precio_mensual: precioMensual,
      estado,
      turno_creacion_playa_id: playaId,
      turno_creacion_playero_id: playeroId,
      turno_creacion_fecha_hora_ingreso: fechaInicio.toISOString(),
      turno_finalizacion_playa_id: turnoFinPlaya,
      turno_finalizacion_playero_id: turnoFinPlayero,
      turno_finalizacion_fecha_hora_ingreso: turnoFinFecha
        ? turnoFinFecha.toISOString()
        : null
    })
  }

  return abonos
}

// Generar abonos para cada playa (necesitaremos los IDs de playeros del seed)
// Por ahora, usaremos IDs de playeros ficticios que deben coincidir con los del seed
// NOTA: Estos IDs deben ser reemplazados por los reales cuando se ejecute el seed

export function generateTestAbonos(userIds: {
  [key: string]: string
}): TestAbono[] {
  const playeroId = userIds['playero@test.com'] || 'playero-id-placeholder'
  const playerodosId =
    userIds['playerodos@test.com'] || 'playerodos-id-placeholder'
  const playerotresId =
    userIds['playerotres@test.com'] || 'playerotres-id-placeholder'
  const playerocuatroId =
    userIds['playerocuatro@test.com'] || 'playerocuatro-id-placeholder'

  const abonos: TestAbono[] = []

  // PLAYA 1 (UTN-Parking): 15 abonos (abonado_id 1-15)
  abonos.push(
    ...generateAbonosForPlaya(
      PLAYA_1_ID,
      [
        PLAYA_1_PLAZAS.PLAZA_1,
        PLAYA_1_PLAZAS.PLAZA_2,
        PLAYA_1_PLAZAS.PLAZA_3,
        PLAYA_1_PLAZAS.PLAZA_4,
        PLAYA_1_PLAZAS.PLAZA_5,
        PLAYA_1_PLAZAS.PLAZA_6,
        PLAYA_1_PLAZAS.PLAZA_7
      ],
      playeroId,
      0,
      15
    )
  )

  // PLAYA 2 (Centro Plaza): 20 abonos (abonado_id 1-15 reutilizados)
  abonos.push(
    ...generateAbonosForPlaya(
      PLAYA_2_ID,
      [
        PLAYA_2_PLAZAS.PLAZA_1,
        PLAYA_2_PLAZAS.PLAZA_2,
        PLAYA_2_PLAZAS.PLAZA_3,
        PLAYA_2_PLAZAS.PLAZA_4,
        PLAYA_2_PLAZAS.PLAZA_5,
        PLAYA_2_PLAZAS.PLAZA_6,
        PLAYA_2_PLAZAS.PLAZA_7,
        PLAYA_2_PLAZAS.PLAZA_8,
        PLAYA_2_PLAZAS.PLAZA_9
      ],
      playerodosId,
      0,
      15
    )
  )

  // PLAYA 3 (Shopping): 18 abonos (abonado_id 1-15 reutilizados)
  abonos.push(
    ...generateAbonosForPlaya(
      PLAYA_3_ID,
      [
        PLAYA_3_PLAZAS.PLAZA_1,
        PLAYA_3_PLAZAS.PLAZA_2,
        PLAYA_3_PLAZAS.PLAZA_3,
        PLAYA_3_PLAZAS.PLAZA_4,
        PLAYA_3_PLAZAS.PLAZA_5,
        PLAYA_3_PLAZAS.PLAZA_6,
        PLAYA_3_PLAZAS.PLAZA_7
      ],
      playerotresId,
      0,
      15
    )
  )

  // PLAYA 4 (Terminal): 12 abonos (abonado_id 1-12)
  abonos.push(
    ...generateAbonosForPlaya(
      PLAYA_4_ID,
      [
        PLAYA_4_PLAZAS.PLAZA_1,
        PLAYA_4_PLAZAS.PLAZA_2,
        PLAYA_4_PLAZAS.PLAZA_3,
        PLAYA_4_PLAZAS.PLAZA_4,
        PLAYA_4_PLAZAS.PLAZA_5,
        PLAYA_4_PLAZAS.PLAZA_6,
        PLAYA_4_PLAZAS.PLAZA_7,
        PLAYA_4_PLAZAS.PLAZA_8,
        PLAYA_4_PLAZAS.PLAZA_9
      ],
      playerocuatroId,
      0,
      12
    )
  )

  return abonos
}
