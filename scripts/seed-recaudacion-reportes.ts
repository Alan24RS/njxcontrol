/**
 * SCRIPT: Semilla de datos para reportes de recaudación
 *
 * Este script genera datos de prueba realistas para validar los reportes
 * de recaudación, incluyendo:
 * - Turnos históricos (últimos 30 días)
 * - Ocupaciones finalizadas con pagos
 * - Abonos con pagos iniciales
 *
 * ⚠️ LIMPIEZA DE DATOS:
 * Este script NO limpia datos automáticamente para evitar acumulación.
 *
 * Para limpiar datos de seed en producción/local:
 *
 *   # Opción 1: Script TypeScript (interactivo)
 *   pnpm db:cleanup --prod   # Producción
 *   pnpm db:cleanup --local  # Local
 *
 *   # Opción 2: SQL directo (recomendado para producción)
 *   # Ejecutar scripts/cleanup-seed-sql.sql en Supabase SQL Editor
 *
 * 🔍 IDENTIFICACIÓN DE DATOS SEED:
 * Los datos de seed se identifican por patrones únicos:
 *   · Ocupaciones: patentes AAA*, BBA*, BBM*
 *   · Abonados: emails abonado{dni}@test.com
 *   · Vehículos: patentes de ocupaciones/abonos seed
 *
 * ⚠️ IMPORTANTE: Estos patrones NUNCA deben usarse en datos reales
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

// --------------------------------------------------------------
//  VALIDACIÓN DE ENTORNO / CLAVES
// --------------------------------------------------------------
const inCI =
  process.env.CI === 'true' ||
  process.env.VERCEL === '1' ||
  process.env.GITHUB_ACTIONS === 'true'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

// Intentar varias variables posibles por si el nombre varía
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_KEY ||
  ''

const isKeyPlausible = (key: string) => key.length > 40 && key.startsWith('ey')

if (!supabaseUrl) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL.')
  // En CI no podemos continuar de forma útil, pero no queremos tumbar el build si es opcional.
  if (inCI) {
    console.warn('⚠️ Seed de recaudación omitido: URL ausente en CI.')
    process.exit(0)
  } else {
    process.exit(1)
  }
}

if (!isKeyPlausible(supabaseServiceRoleKey)) {
  console.error('⚠️ Clave service role inválida o ausente.')
  if (inCI) {
    console.warn(
      '⚠️ Seed OMITIDO en CI: revisa SUPABASE_SERVICE_ROLE_KEY. No se generarán datos de reportes.'
    )
    process.exit(0)
  } else {
    console.error(
      '❌ Debes definir SUPABASE_SERVICE_ROLE_KEY (service role) para ejecutar este seed localmente.'
    )
    process.exit(1)
  }
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

async function limpiarDatosAnteriores() {
  console.log('🧹 Limpiando datos de reportes anteriores...')

  try {
    // ESTRATEGIA: Identificar datos de seed por patrones únicos
    // Las patentes de seed tienen prefijos específicos: AAA*, BBA*, BBM*
    // Los abonados de seed tienen emails con patrón: abonado*@test.com

    // 1. Obtener ocupaciones de seed (por patente)
    const { data: ocupacionesSeed } = await supabase
      .from('ocupacion')
      .select('ocupacion_id, playa_id, plaza_id')
      .or('patente.like.AAA%,patente.like.BBA%,patente.like.BBM%')

    let countPagos = 0
    let countOcupaciones = 0

    if (ocupacionesSeed && ocupacionesSeed.length > 0) {
      // Eliminar pagos de estas ocupaciones
      const ocupacionIds = ocupacionesSeed.map((o) => o.ocupacion_id)

      // Eliminar en lotes de 100 para evitar timeouts
      for (let i = 0; i < ocupacionIds.length; i += 100) {
        const batch = ocupacionIds.slice(i, i + 100)
        const { count } = await supabase
          .from('pago')
          .delete({ count: 'exact' })
          .in('ocupacion_id', batch)

        countPagos += count || 0
      }

      // Eliminar las ocupaciones
      for (let i = 0; i < ocupacionIds.length; i += 100) {
        const batch = ocupacionIds.slice(i, i + 100)
        const { count } = await supabase
          .from('ocupacion')
          .delete({ count: 'exact' })
          .in('ocupacion_id', batch)

        countOcupaciones += count || 0
      }
    }

    console.log(`   🗑️  Pagos eliminados: ${countPagos}`)
    console.log(`   🗑️  Ocupaciones eliminadas: ${countOcupaciones}`)

    // 2. Obtener abonados de seed (por email)
    const { data: abonadosSeed } = await supabase
      .from('abonado')
      .select('abonado_id')
      .like('email', '%@test.com')
      .like('email', 'abonado%')

    let countBoletas = 0
    let countAbonoVeh = 0
    let countAbonos = 0

    if (abonadosSeed && abonadosSeed.length > 0) {
      const abonadoIds = abonadosSeed.map((a) => a.abonado_id)

      // Obtener abonos de estos abonados
      const { data: abonosSeed } = await supabase
        .from('abono')
        .select('playa_id, plaza_id, fecha_hora_inicio')
        .in('abonado_id', abonadoIds)

      if (abonosSeed && abonosSeed.length > 0) {
        // Eliminar boletas de estos abonos
        for (const abono of abonosSeed) {
          const { count: cBoletas } = await supabase
            .from('boleta')
            .delete({ count: 'exact' })
            .eq('playa_id', abono.playa_id)
            .eq('plaza_id', abono.plaza_id)
            .eq('fecha_hora_inicio_abono', abono.fecha_hora_inicio)

          countBoletas += cBoletas || 0

          // Eliminar abono_vehiculo
          const { count: cAbonoVeh } = await supabase
            .from('abono_vehiculo')
            .delete({ count: 'exact' })
            .eq('playa_id', abono.playa_id)
            .eq('plaza_id', abono.plaza_id)
            .eq('fecha_hora_inicio', abono.fecha_hora_inicio)

          countAbonoVeh += cAbonoVeh || 0
        }

        // Eliminar abonos en lotes
        for (let i = 0; i < abonosSeed.length; i += 100) {
          const batch = abonosSeed.slice(i, i + 100)
          const { count } = await supabase
            .from('abono')
            .delete({ count: 'exact' })
            .or(
              batch
                .map(
                  (a) =>
                    `and(playa_id.eq.${a.playa_id},plaza_id.eq.${a.plaza_id},fecha_hora_inicio.eq.${a.fecha_hora_inicio})`
                )
                .join(',')
            )

          countAbonos += count || 0
        }
      }
    }

    console.log(`   🗑️  Boletas eliminadas: ${countBoletas}`)
    console.log(`   🗑️  Abono-vehículos eliminados: ${countAbonoVeh}`)
    console.log(`   🗑️  Abonos eliminados: ${countAbonos}`)

    // 3. Eliminar turnos de seed (los que tienen ocupaciones/abonos de seed)
    // Buscar turnos en las últimas 8 semanas (máximo histórico razonable para seed)
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - 56) // 8 semanas

    const { count: countTurnos } = await supabase
      .from('turno')
      .delete({ count: 'exact' })
      .gte('fecha_hora_ingreso', fechaLimite.toISOString())
      .not('fecha_hora_salida', 'is', null) // Solo turnos cerrados

    console.log(`   🗑️  Turnos eliminados: ${countTurnos || 0}`)

    // 4. Limpiar vehículos huérfanos de seed (opcional)
    const { count: countVehiculos } = await supabase
      .from('vehiculo')
      .delete({ count: 'exact' })
      .or('patente.like.AAA%,patente.like.BBA%,patente.like.BBM%')

    console.log(`   🗑️  Vehículos de seed eliminados: ${countVehiculos || 0}`)

    console.log('   ✅ Limpieza completada')
  } catch (error: any) {
    console.warn('   ⚠️  Error durante limpieza:', error?.message)
    // No bloqueamos el seed si falla la limpieza
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

  // 1.5 Limpiar datos previos del seed (últimos 30 días)
  console.log('🧹 Limpiando datos anteriores del seed...')
  await limpiarDatosAnteriores()
  console.log('   ✅ Datos antiguos eliminados\n')

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
  console.log(
    '🅿️  Verificando plazas objetivo y limpiando ocupaciones de seed activas...'
  )
  const plazasBloqueadas = await precheckYLimpiarPlazas(ocupaciones)
  console.log('   ✅ Prechequeo de plazas completado\n')

  console.log('🅿️  Procesando ocupaciones...')
  await procesarOcupaciones(ocupaciones, plazasBloqueadas)
  console.log('   ✅ Ocupaciones procesadas\n')

  // 5. Insertar abonos y registrar pagos
  console.log('📝 Procesando abonos...')
  await procesarAbonos(abonos)
  console.log('   ✅ Abonos procesados\n')

  console.log('✅ Seed de reportes completado exitosamente!')
  console.log('\n📊 Ahora puedes probar los reportes en:')
  console.log('   http://localhost:3000/admin/analytics/recaudacion')
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

function pairKey(playaId: string, plazaId: string) {
  return `${playaId}|${plazaId}`
}

async function precheckYLimpiarPlazas(ocupaciones: TestOcupacion[]) {
  const objetivos = new Map<string, { playa_id: string; plaza_id: string }>()
  for (const o of ocupaciones) {
    objetivos.set(pairKey(o.playa_id, o.plaza_id), {
      playa_id: o.playa_id,
      plaza_id: o.plaza_id
    })
  }

  const pares = Array.from(objetivos.values())
  if (pares.length === 0) return new Set<string>()

  const orExpr = pares
    .slice(0, 500) // limitar tamaño del OR por seguridad
    .map((p) => `and(playa_id.eq.${p.playa_id},plaza_id.eq.${p.plaza_id})`)
    .join(',')

  // 1) Diagnóstico de ocupaciones activas en plazas objetivo
  const { data: activasObj } = await supabase
    .from('ocupacion')
    .select('ocupacion_id,playa_id,plaza_id,patente')
    .eq('estado', 'ACTIVO')
    .or(orExpr)

  const activasPorPar = new Map<string, { total: number; seed: number }>()
  const seedRegex = /^(AAA|BBA|BBM)\d{3}$/

  for (const row of activasObj || []) {
    const key = pairKey(row.playa_id as string, row.plaza_id as string)
    const curr = activasPorPar.get(key) || { total: 0, seed: 0 }
    curr.total += 1
    if (seedRegex.test(String(row.patente))) curr.seed += 1
    activasPorPar.set(key, curr)
  }

  // Log de diagnóstico
  let conflictivas = 0
  for (const [_key, info] of activasPorPar.entries()) {
    if (info.total > 0) conflictivas++
  }
  if (conflictivas > 0) {
    console.log(
      `   ℹ️  Plazas con ocupaciones ACTIVAS antes de insertar: ${conflictivas}`
    )
  } else {
    console.log('   ℹ️  No hay ocupaciones ACTIVAS en plazas objetivo')
  }

  // 2) Eliminar ocupaciones ACTIVAS de seed en esas plazas (defensivo)
  const { data: activasCandidatas } = await supabase
    .from('ocupacion')
    .select('ocupacion_id,patente')
    .eq('estado', 'ACTIVO')
    .or(orExpr)

  const seedIds = (activasCandidatas || [])
    .filter((r) => seedRegex.test(String(r.patente)))
    .map((r) => r.ocupacion_id)
  let pagosEliminados = 0
  let ocupEliminadas = 0
  for (let i = 0; i < seedIds.length; i += 100) {
    const batch = seedIds.slice(i, i + 100)
    const { count: c1 } = await supabase
      .from('pago')
      .delete({ count: 'exact' })
      .in('ocupacion_id', batch)
    pagosEliminados += c1 || 0

    const { count: c2 } = await supabase
      .from('ocupacion')
      .delete({ count: 'exact' })
      .in('ocupacion_id', batch)
    ocupEliminadas += c2 || 0
  }

  if (seedIds.length > 0) {
    console.log(
      `   🗑️  Ocupaciones de seed activas eliminadas: ${ocupEliminadas} (pagos: ${pagosEliminados})`
    )
  }

  // 3) Rechequear plazas conflictivas (no-seed)
  const { data: activasRestantes } = await supabase
    .from('ocupacion')
    .select('playa_id,plaza_id')
    .eq('estado', 'ACTIVO')
    .or(orExpr)

  const bloqueadas = new Set<string>()
  for (const row of activasRestantes || []) {
    bloqueadas.add(pairKey(row.playa_id as string, row.plaza_id as string))
  }

  if (bloqueadas.size > 0) {
    console.log(
      `   ⚠️  ${bloqueadas.size} plazas tienen ocupaciones reales ACTIVAS. Esas inserciones se omitirán.`
    )
  }

  return bloqueadas
}

async function procesarOcupaciones(
  ocupaciones: TestOcupacion[],
  plazasBloqueadas?: Set<string>
) {
  let procesadas = 0
  let errores = 0

  for (const ocupacion of ocupaciones) {
    const key = pairKey(ocupacion.playa_id, ocupacion.plaza_id)
    if (plazasBloqueadas && plazasBloqueadas.has(key)) {
      console.warn(
        `   ⏭️  Omitida ocupación en plaza bloqueada (playa=${ocupacion.playa_id}, plaza=${ocupacion.plaza_id})`
      )
      continue
    }
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
        .upsert(
          {
            playa_id: abono.playa_id,
            plaza_id: abono.plaza_id,
            abonado_id: abonadoData.abonado_id,
            fecha_hora_inicio: abono.fecha_hora_inicio.toISOString(),
            estado: 'ACTIVO',
            turno_creacion_playa_id: abono.turno_playa_id,
            turno_creacion_playero_id: abono.turno_playero_id,
            turno_creacion_fecha_hora_ingreso:
              abono.turno_fecha_hora_ingreso.toISOString()
          },
          { onConflict: 'playa_id,plaza_id,fecha_hora_inicio' }
        )
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
          .upsert(
            {
              playa_id: abonoData.playa_id,
              plaza_id: abonoData.plaza_id,
              fecha_hora_inicio: abonoData.fecha_hora_inicio,
              patente: vehiculo.patente
            },
            { onConflict: 'playa_id,plaza_id,fecha_hora_inicio,patente' }
          )

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
        .upsert(
          {
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
          },
          {
            onConflict:
              'playa_id,plaza_id,fecha_hora_inicio_abono,fecha_generacion_boleta'
          }
        )
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

main().catch((error: any) => {
  const msg = error?.message || ''
  if (inCI && /Invalid API key/i.test(msg)) {
    console.warn(
      '⚠️ Seed de recaudación abortado (Invalid API key) pero CI continuará. Verifica la service role key.'
    )
    process.exit(0)
  }
  console.error('❌ Error fatal:', error)
  process.exit(1)
})
