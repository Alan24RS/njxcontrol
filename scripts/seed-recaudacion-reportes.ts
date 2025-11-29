/**
 * SCRIPT: Semilla de datos para reportes de recaudación
 *
 * Este script genera datos de prueba realistas para validar los reportes
 * de recaudación, incluyendo:
 * - Turnos históricos (últimos 30 días)
 * - Ocupaciones finalizadas con pagos
 * - Abonos con pagos iniciales
 *
 * PREREQUISITOS:
 * - Ejecutar primero db-seed.ts para crear la estructura base
 * - Base de datos local activa (supabase start)
 *
 * USO:
 * pnpm tsx scripts/seed-recaudacion-reportes.ts
 */

import { createClient } from '@supabase/supabase-js'

import {
  generarTestAbonos,
  generarTestOcupaciones,
  generarTestTurnos,
  obtenerResumenDatos,
  setPlayasConfig,
  type TestAbono,
  type TestOcupacion,
  type TestTurno
} from './seeds/dev/recaudacion-reportes'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceRoleKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

async function obtenerPlayasYPlayeros() {
  // Obtener playas
  const { data: playasData, error: playasError } = await supabase
    .from('playa')
    .select('playa_id, nombre')
    .in('nombre', [
      'UTN-Parking',
      'Centro Plaza Parking',
      'Shopping Parking',
      'Terminal Parking'
    ])

  if (playasError || !playasData || playasData.length !== 4) {
    console.error('❌ Error obteniendo playas:', playasError)
    return { playas: null, playeros: null }
  }

  // Obtener playeros de cada playa
  const { data: playerosData, error: playerosError } = await supabase
    .from('playero_playa')
    .select('playa_id, playero_id')

  if (playerosError || !playerosData) {
    console.error('❌ Error obteniendo playeros:', playerosError)
    return { playas: null, playeros: null }
  }

  // Construir mapas
  const playasMap = new Map(playasData.map((p) => [p.nombre, p.playa_id]))
  const playerosPorPlaya = playerosData.reduce(
    (acc, pp) => {
      if (!acc[pp.playa_id]) {
        acc[pp.playa_id] = []
      }
      acc[pp.playa_id].push(pp.playero_id)
      return acc
    },
    {} as Record<string, string[]>
  )

  // Obtener plazas por playa
  const { data: plazasData, error: plazasError } = await supabase
    .from('plaza')
    .select('plaza_id, playa_id')

  if (plazasError || !plazasData) {
    console.error('❌ Error obteniendo plazas:', plazasError)
    return { playas: null, playeros: null }
  }

  const plazasPorPlaya = plazasData.reduce(
    (acc, p) => {
      if (!acc[p.playa_id]) {
        acc[p.playa_id] = []
      }
      acc[p.playa_id].push(p.plaza_id)
      return acc
    },
    {} as Record<string, string[]>
  )

  return {
    playas: {
      utn: {
        id: playasMap.get('UTN-Parking')!,
        playeros: playerosPorPlaya[playasMap.get('UTN-Parking')!] || [],
        plazas: plazasPorPlaya[playasMap.get('UTN-Parking')!] || []
      },
      centro: {
        id: playasMap.get('Centro Plaza Parking')!,
        playeros:
          playerosPorPlaya[playasMap.get('Centro Plaza Parking')!] || [],
        plazas: plazasPorPlaya[playasMap.get('Centro Plaza Parking')!] || []
      },
      shopping: {
        id: playasMap.get('Shopping Parking')!,
        playeros: playerosPorPlaya[playasMap.get('Shopping Parking')!] || [],
        plazas: plazasPorPlaya[playasMap.get('Shopping Parking')!] || []
      },
      terminal: {
        id: playasMap.get('Terminal Parking')!,
        playeros: playerosPorPlaya[playasMap.get('Terminal Parking')!] || [],
        plazas: plazasPorPlaya[playasMap.get('Terminal Parking')!] || []
      }
    },
    playeros: playerosPorPlaya
  }
}

async function main() {
  console.log('🌱 Iniciando seed de reportes de recaudación...\n')

  // 1. Obtener IDs de playas y playeros desde la base de datos
  console.log('🏖️  Obteniendo playas y playeros...')
  const { playas, playeros } = await obtenerPlayasYPlayeros()
  if (!playas || !playeros) {
    console.error('❌ No se pudieron obtener las playas o playeros')
    process.exit(1)
  }
  console.log('   ✅ Playas y playeros encontrados\n')

  // Configurar el módulo de generación de datos
  setPlayasConfig(playas)

  // 2. Generar estructuras de datos
  console.log('📊 Generando datos de prueba...')
  const turnos = generarTestTurnos()
  const ocupaciones = generarTestOcupaciones(turnos)
  const abonos = generarTestAbonos(turnos)

  const resumen = obtenerResumenDatos(turnos, ocupaciones, abonos)
  console.log('   📈 Resumen:')
  console.log(
    `      - Turnos: ${resumen.turnos.total} (UTN: ${resumen.turnos.utn}, Centro: ${resumen.turnos.centro})`
  )
  console.log(
    `      - Ocupaciones: ${resumen.ocupaciones.total} (Por hora: ${resumen.ocupaciones.porHora}, Diarias: ${resumen.ocupaciones.diarias})`
  )
  console.log(
    `      - Abonos: ${resumen.abonos.total} (Con múltiples vehículos: ${resumen.abonos.conMultiplesVehiculos})`
  )
  console.log(
    `      - Recaudación total: $${resumen.recaudacionTotal.toLocaleString('es-AR')}\n`
  )

  // 3. Insertar turnos
  console.log('🕐 Insertando turnos...')
  await insertarTurnos(turnos)
  console.log('   ✅ Turnos insertados\n')

  // 4. Insertar ocupaciones y registrar pagos
  console.log('🅿️  Procesando ocupaciones...')
  await procesarOcupaciones(ocupaciones)
  console.log('   ✅ Ocupaciones procesadas\n')

  // 5. Insertar abonos y registrar pagos
  console.log('📝 Procesando abonos...')
  await procesarAbonos(abonos)
  console.log('   ✅ Abonos procesados\n')

  console.log('✅ Seed de reportes completado exitosamente!')
  console.log('\n📊 Ahora puedes probar los reportes en:')
  console.log('   http://localhost:3000/admin/analytics/recaudacion-por-playa')
}

async function insertarTurnos(turnos: TestTurno[]) {
  let insertados = 0
  let errores = 0

  for (const turno of turnos) {
    const { error } = await supabase.from('turno').upsert(
      {
        playa_id: turno.playa_id,
        playero_id: turno.playero_id,
        fecha_hora_ingreso: turno.fecha_hora_ingreso.toISOString(),
        fecha_hora_salida: turno.fecha_hora_salida?.toISOString() || null
      },
      {
        onConflict: 'playa_id,playero_id,fecha_hora_ingreso'
      }
    )

    if (error) {
      console.error(`   ⚠️  Error insertando turno:`, error.message)
      errores++
    } else {
      insertados++
    }
  }

  console.log(`   📊 Insertados: ${insertados}, Errores: ${errores}`)
}

async function procesarOcupaciones(ocupaciones: TestOcupacion[]) {
  let procesadas = 0
  let errores = 0

  for (const ocupacion of ocupaciones) {
    // 1. Insertar ocupación
    const { data: ocupacionCreada, error: errorOcupacion } = await supabase
      .from('ocupacion')
      .insert({
        playa_id: ocupacion.playa_id,
        plaza_id: ocupacion.plaza_id,
        playero_id: ocupacion.playero_id,
        patente: ocupacion.patente,
        tipo_vehiculo: ocupacion.tipo_vehiculo,
        modalidad_ocupacion: ocupacion.modalidad_ocupacion,
        hora_ingreso: ocupacion.hora_ingreso.toISOString(),
        estado: 'ACTIVO'
      })
      .select()
      .single()

    if (errorOcupacion) {
      console.error(
        `   ⚠️  Error creando ocupación ${ocupacion.patente}:`,
        errorOcupacion.message
      )
      errores++
      continue
    }

    // 2. Si tiene hora_egreso, finalizarla con RPC
    if (ocupacion.hora_egreso && ocupacion.monto_pago) {
      // Actualizar hora_egreso manualmente (el RPC la establece en now())
      await supabase
        .from('ocupacion')
        .update({ hora_egreso: ocupacion.hora_egreso.toISOString() })
        .eq('ocupacion_id', ocupacionCreada.ocupacion_id)

      // Obtener turno para vincularlo al pago
      const { data: turno } = await supabase
        .from('turno')
        .select('fecha_hora_ingreso')
        .eq('playa_id', ocupacion.playa_id)
        .eq('playero_id', ocupacion.playero_id)
        .lte('fecha_hora_ingreso', ocupacion.hora_ingreso.toISOString())
        .order('fecha_hora_ingreso', { ascending: false })
        .limit(1)
        .single()

      if (!turno) {
        console.error(
          `   ⚠️  No se encontró turno para ocupación ${ocupacion.patente}`
        )
        errores++
        continue
      }

      // Generar numero_pago secuencial
      const { data: maxPago } = await supabase
        .from('pago')
        .select('numero_pago')
        .eq('playa_id', ocupacion.playa_id)
        .order('numero_pago', { ascending: false })
        .limit(1)
        .maybeSingle()

      const numeroPago = (maxPago?.numero_pago || 0) + 1

      // Insertar pago manualmente
      const { error: errorPago } = await supabase.from('pago').insert({
        playa_id: ocupacion.playa_id,
        numero_pago: numeroPago,
        ocupacion_id: ocupacionCreada.ocupacion_id,
        metodo_pago: ocupacion.metodo_pago,
        monto_pago: ocupacion.monto_pago,
        playero_id: ocupacion.playero_cierre_id,
        turno_fecha_hora_ingreso: turno.fecha_hora_ingreso,
        fecha_hora_pago: ocupacion.hora_egreso.toISOString()
      })

      if (errorPago) {
        console.error(
          `   ⚠️  Error registrando pago para ${ocupacion.patente}:`,
          errorPago.message
        )
        errores++
        continue
      }

      // Actualizar ocupación como finalizada
      await supabase
        .from('ocupacion')
        .update({
          numero_pago: numeroPago,
          estado: 'FINALIZADO',
          playero_cierre_id: ocupacion.playero_cierre_id
        })
        .eq('ocupacion_id', ocupacionCreada.ocupacion_id)
    }

    procesadas++
  }

  console.log(`   📊 Procesadas: ${procesadas}, Errores: ${errores}`)
}

async function procesarAbonos(abonos: TestAbono[]) {
  let procesados = 0
  let errores = 0

  for (const abono of abonos) {
    try {
      // 1. Insertar/actualizar abonado
      const { data: abonadoData, error: errorAbonado } = await supabase
        .from('abonado')
        .upsert(
          {
            nombre: abono.abonado.nombre,
            apellido: abono.abonado.apellido,
            email: abono.abonado.email,
            telefono: abono.abonado.telefono,
            dni: abono.abonado.dni
          },
          { onConflict: 'dni' }
        )
        .select()
        .single()

      if (errorAbonado) throw errorAbonado

      // 2. Insertar abono
      const { data: abonoData, error: errorAbono } = await supabase
        .from('abono')
        .insert({
          playa_id: abono.playa_id,
          plaza_id: abono.plaza_id,
          abonado_id: abonadoData.abonado_id,
          fecha_hora_inicio: abono.fecha_hora_inicio.toISOString(),
          estado: 'ACTIVO',
          turno_creacion_playa_id: abono.turno_playa_id,
          turno_creacion_playero_id: abono.turno_playero_id,
          turno_creacion_fecha_hora_ingreso:
            abono.turno_fecha_hora_ingreso.toISOString()
        })
        .select()
        .single()

      if (errorAbono) throw errorAbono

      // 3. Insertar vehículos
      for (const vehiculo of abono.vehiculos) {
        const { error: errorVehiculo } = await supabase.from('vehiculo').upsert(
          {
            patente: vehiculo.patente,
            tipo_vehiculo: vehiculo.tipo_vehiculo
          },
          { onConflict: 'patente' }
        )

        if (errorVehiculo) {
          console.error(
            `   ⚠️  Error insertando vehículo ${vehiculo.patente}:`,
            errorVehiculo.message
          )
        }

        const { error: errorAbonoVehiculo } = await supabase
          .from('abono_vehiculo')
          .insert({
            playa_id: abonoData.playa_id,
            plaza_id: abonoData.plaza_id,
            fecha_hora_inicio: abonoData.fecha_hora_inicio,
            patente: vehiculo.patente
          })

        if (errorAbonoVehiculo) {
          console.error(
            `   ⚠️  Error vinculando vehículo ${vehiculo.patente} al abono:`,
            errorAbonoVehiculo.message
          )
          throw errorAbonoVehiculo
        }
      }

      // 4. Crear boleta inicial
      const { data: boletaData, error: errorBoleta } = await supabase
        .from('boleta')
        .insert({
          playa_id: abonoData.playa_id,
          plaza_id: abonoData.plaza_id,
          fecha_hora_inicio_abono: abonoData.fecha_hora_inicio,
          fecha_generacion_boleta: abono.fecha_hora_inicio
            .toISOString()
            .split('T')[0],
          fecha_vencimiento_boleta: new Date(
            abono.fecha_hora_inicio.getTime() + 15 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split('T')[0],
          monto: abono.monto_pago,
          estado: 'PAGADA'
        })
        .select()
        .single()

      if (errorBoleta) throw errorBoleta

      // 5. Generar numero_pago
      const { data: maxPago } = await supabase
        .from('pago')
        .select('numero_pago')
        .eq('playa_id', abono.playa_id)
        .order('numero_pago', { ascending: false })
        .limit(1)
        .maybeSingle()

      const numeroPago = (maxPago?.numero_pago || 0) + 1

      // 6. Registrar pago
      await supabase.from('pago').insert({
        playa_id: abono.playa_id,
        numero_pago: numeroPago,
        boleta_id: boletaData.boleta_id,
        metodo_pago: abono.metodo_pago,
        monto_pago: abono.monto_pago,
        playero_id: abono.turno_playero_id,
        turno_fecha_hora_ingreso: abono.turno_fecha_hora_ingreso.toISOString(),
        fecha_hora_pago: abono.fecha_hora_inicio.toISOString()
      })

      procesados++
    } catch (error: any) {
      console.error(
        `   ⚠️  Error creando abono para ${abono.abonado.dni}:`,
        error.message
      )
      errores++
    }
  }

  console.log(`   📊 Procesados: ${procesados}, Errores: ${errores}`)
}

main().catch((error) => {
  console.error('❌ Error fatal:', error)
  process.exit(1)
})
