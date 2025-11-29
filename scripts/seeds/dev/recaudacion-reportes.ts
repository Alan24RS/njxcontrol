/**
 * SEED DE DATOS PARA REPORTES DE RECAUDACIÓN
 *
 * Genera datos de prueba realistas para el dashboard de recaudación:
 * - Turnos de playeros en todas las playas
 * - Ocupaciones finalizadas con pagos
 * - Abonos con pagos iniciales y vehículos
 * - Horarios reales de playa: 8 AM - 8 PM
 * - Rango de fechas: últimos 30 días
 */

import { subDays } from 'date-fns'

// Control global de patentes usadas para evitar duplicados
const usedPatentes = new Set<string>()

// Genera una patente única válida (formato AAA123)
function generateUniquePatente(prefix: string, counterRef: { value: number }) {
  while (true) {
    const num = String(counterRef.value % 1000).padStart(3, '0')
    const patente = `${prefix}${num}`
    counterRef.value += 1
    if (!usedPatentes.has(patente)) {
      usedPatentes.add(patente)
      return patente
    }
  }
}

// Tipos de datos de playa
export interface PlayaData {
  id: string
  playeros: string[]
  plazas: string[]
}

export interface PlayasConfig {
  utn: PlayaData
  centro: PlayaData
  shopping: PlayaData
  terminal: PlayaData
}

// Configuración global (se inicializa con setPlayasConfig)
let PLAYAS_CONFIG: PlayasConfig | null = null

export function setPlayasConfig(config: PlayasConfig) {
  PLAYAS_CONFIG = config
}

function getPlayasConfig(): PlayasConfig {
  if (!PLAYAS_CONFIG) {
    throw new Error(
      'Playas config not initialized. Call setPlayasConfig first.'
    )
  }
  return PLAYAS_CONFIG
}

export interface TestTurno {
  playa_id: string
  playero_id: string
  fecha_hora_ingreso: Date
  fecha_hora_salida: Date | null
}

export interface TestOcupacion {
  playa_id: string
  plaza_id: string
  playero_id: string
  patente: string
  tipo_vehiculo: string
  modalidad_ocupacion: string
  hora_ingreso: Date
  hora_egreso: Date
  metodo_pago: string
  monto_pago: number
  playero_cierre_id: string
}

export interface TestAbono {
  playa_id: string
  plaza_id: string
  abonado: {
    nombre: string
    apellido: string
    email: string
    telefono: string
    dni: string
  }
  vehiculos: Array<{
    patente: string
    tipo_vehiculo: string
  }>
  fecha_hora_inicio: Date
  turno_playa_id: string
  turno_playero_id: string
  turno_fecha_hora_ingreso: Date
  metodo_pago: string
  monto_pago: number
}

function generarFechasTurnos(): Date[] {
  const hoy = new Date()
  const fechas: Date[] = []

  // Cada 3 días en los últimos 30 días
  for (let i = 30; i >= 0; i -= 3) {
    const fecha = subDays(hoy, i)
    fecha.setHours(8, 0, 0, 0) // Inicia a las 8 AM
    fechas.push(fecha)
  }

  return fechas
}

export function generarTestTurnos(): TestTurno[] {
  const config = getPlayasConfig()
  const fechas = generarFechasTurnos()
  const turnos: TestTurno[] = []

  const playas = [
    { id: config.utn.id, playeros: config.utn.playeros },
    { id: config.centro.id, playeros: config.centro.playeros },
    { id: config.shopping.id, playeros: config.shopping.playeros },
    { id: config.terminal.id, playeros: config.terminal.playeros }
  ]

  fechas.forEach((fecha) => {
    playas.forEach(({ id: playaId, playeros }) => {
      if (playeros.length === 0) return

      const playeroId = playeros[0] // Usar el primer playero disponible
      const fechaSalida = new Date(fecha)
      fechaSalida.setHours(20, 0, 0, 0) // Termina a las 8 PM

      turnos.push({
        playa_id: playaId,
        playero_id: playeroId,
        fecha_hora_ingreso: new Date(fecha),
        fecha_hora_salida: new Date(fechaSalida)
      })
    })
  })

  return turnos
}

export function generarTestOcupaciones(turnos: TestTurno[]): TestOcupacion[] {
  const config = getPlayasConfig()
  const ocupaciones: TestOcupacion[] = []
  const occCounter = { value: 100 }

  // Crear mapa de plazas por playa
  const plazasPorPlaya = new Map<string, string[]>([
    [config.utn.id, config.utn.plazas],
    [config.centro.id, config.centro.plazas],
    [config.shopping.id, config.shopping.plazas],
    [config.terminal.id, config.terminal.plazas]
  ])

  turnos.forEach((turno, turnoIndex) => {
    const plazas = plazasPorPlaya.get(turno.playa_id)
    if (!plazas || plazas.length === 0) return

    const baseTime = new Date(turno.fecha_hora_ingreso)
    const numOcupaciones = 2 + (turnoIndex % 3) // 2-4 ocupaciones por turno

    for (let i = 0; i < numOcupaciones; i++) {
      // Horarios entre 9 AM y 5 PM para cerrar antes de las 8 PM
      const horaBase = 9 + i * 2 // 9, 11, 13, 15
      const horaIngreso = new Date(baseTime)
      horaIngreso.setHours(horaBase, 0, 0, 0)

      const modalidad = i % 3 === 0 ? 'DIARIA' : 'POR_HORA'
      const horaEgreso = new Date(horaIngreso)

      if (modalidad === 'POR_HORA') {
        horaEgreso.setHours(horaBase + 2 + (i % 2), 0, 0, 0) // 2-3 horas
      } else {
        horaEgreso.setHours(horaBase + 8, 0, 0, 0) // 8 horas
      }

      // Asegurar cierre antes de las 8 PM
      if (horaEgreso.getHours() > 20) {
        horaEgreso.setHours(20, 0, 0, 0)
      }

      const tipos = ['MOTOCICLETA', 'AUTOMOVIL', 'CAMIONETA']
      const tipoVehiculo = tipos[i % tipos.length]
      const metodoPago = 'EFECTIVO' // Usar solo EFECTIVO que está en todas las playas

      // Calcular monto
      let monto = 0
      if (modalidad === 'POR_HORA') {
        const horas = Math.ceil(
          (horaEgreso.getTime() - horaIngreso.getTime()) / (1000 * 60 * 60)
        )
        const tarifasPorHora: Record<string, number> = {
          MOTOCICLETA: 500,
          AUTOMOVIL: 800,
          CAMIONETA: 1200
        }
        monto = horas * (tarifasPorHora[tipoVehiculo] || 800)
      } else {
        const tarifasDiarias: Record<string, number> = {
          MOTOCICLETA: 3000,
          AUTOMOVIL: 5000,
          CAMIONETA: 8000
        }
        monto = tarifasDiarias[tipoVehiculo] || 5000
      }

      ocupaciones.push({
        playa_id: turno.playa_id,
        plaza_id: plazas[i % plazas.length],
        playero_id: turno.playero_id,
        patente: generateUniquePatente('AAA', occCounter),
        tipo_vehiculo: tipoVehiculo,
        modalidad_ocupacion: modalidad,
        hora_ingreso: horaIngreso,
        hora_egreso: horaEgreso,
        metodo_pago: metodoPago,
        monto_pago: monto,
        playero_cierre_id: turno.playero_id
      })
    }
  })

  return ocupaciones
}

export function generarTestAbonos(turnos: TestTurno[]): TestAbono[] {
  const config = getPlayasConfig()
  const abonos: TestAbono[] = []
  let dniCounter = 30000000
  const abnCounter = { value: 0 }

  // Crear mapa de plazas por playa
  const plazasPorPlaya = new Map<string, string[]>([
    [config.utn.id, config.utn.plazas],
    [config.centro.id, config.centro.plazas],
    [config.shopping.id, config.shopping.plazas],
    [config.terminal.id, config.terminal.plazas]
  ])

  // Generar abonos para todas las playas
  const playasIds = [
    config.utn.id,
    config.centro.id,
    config.shopping.id,
    config.terminal.id
  ]

  playasIds.forEach((playaId) => {
    // Usar últimos 5 turnos de cada playa
    const turnosPlaya = turnos.filter((t) => t.playa_id === playaId).slice(-5)
    const plazas = plazasPorPlaya.get(playaId)
    if (!plazas || plazas.length === 0) return

    turnosPlaya.forEach((turno, index) => {
      const numAbonos = 1 // 1 abono por turno

      for (let i = 0; i < numAbonos; i++) {
        const multiVehiculo = i % 2 === 0
        const vehiculos = [
          {
            patente: generateUniquePatente('BBA', abnCounter),
            tipo_vehiculo: 'AUTOMOVIL'
          }
        ]

        if (multiVehiculo) {
          vehiculos.push({
            patente: generateUniquePatente('BBM', abnCounter),
            tipo_vehiculo: 'AUTOMOVIL'
          })
        }

        const metodoPago = 'EFECTIVO' // Usar solo EFECTIVO que está en todas las playas
        const monto = multiVehiculo ? 30000 : 15000

        // Timestamp único
        const fechaInicioBase = new Date(turno.fecha_hora_ingreso)
        const fechaInicio = new Date(
          fechaInicioBase.getTime() + abnCounter.value * 3 * 60 * 1000
        )
        fechaInicio.setSeconds((i * 11) % 59)

        // Clamp para no pasar las 20:00
        if (fechaInicio.getHours() >= 20) {
          fechaInicio.setHours(19, 59, 50, 0)
        }

        abonos.push({
          playa_id: playaId,
          plaza_id: plazas[(abnCounter.value + index + i) % plazas.length],
          abonado: {
            nombre: `Abonado${dniCounter + i}`,
            apellido: `Apellido${index}`,
            email: `abonado${dniCounter + i}@test.com`,
            telefono: `11${dniCounter + i}`,
            dni: `${dniCounter + i}`
          },
          vehiculos,
          fecha_hora_inicio: fechaInicio,
          turno_playa_id: turno.playa_id,
          turno_playero_id: turno.playero_id,
          turno_fecha_hora_ingreso: turno.fecha_hora_ingreso,
          metodo_pago: metodoPago,
          monto_pago: monto
        })
        abnCounter.value += 1
      }

      dniCounter += 10
    })
  })

  return abonos
}

export function obtenerResumenDatos(
  turnos: TestTurno[],
  ocupaciones: TestOcupacion[],
  abonos: TestAbono[]
) {
  const config = getPlayasConfig()

  const turnosPorPlaya = {
    utn: turnos.filter((t) => t.playa_id === config.utn.id).length,
    centro: turnos.filter((t) => t.playa_id === config.centro.id).length,
    shopping: turnos.filter((t) => t.playa_id === config.shopping.id).length,
    terminal: turnos.filter((t) => t.playa_id === config.terminal.id).length
  }

  const recaudacionOcupaciones = ocupaciones.reduce(
    (sum, o) => sum + (o.monto_pago || 0),
    0
  )
  const recaudacionAbonos = abonos.reduce((sum, a) => sum + a.monto_pago, 0)

  return {
    turnos: {
      total: turnos.length,
      ...turnosPorPlaya
    },
    ocupaciones: {
      total: ocupaciones.length,
      porHora: ocupaciones.filter((o) => o.modalidad_ocupacion === 'POR_HORA')
        .length,
      diarias: ocupaciones.filter((o) => o.modalidad_ocupacion === 'DIARIA')
        .length,
      recaudacion: recaudacionOcupaciones
    },
    abonos: {
      total: abonos.length,
      conMultiplesVehiculos: abonos.filter((a) => a.vehiculos.length > 1)
        .length,
      recaudacion: recaudacionAbonos
    },
    recaudacionTotal: recaudacionOcupaciones + recaudacionAbonos
  }
}
