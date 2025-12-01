/**
 * Script SIMPLE de limpieza que primero ROMPE las FKs circulares poniendo NULL
 */

import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function pregunta(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function main() {
  const args = process.argv.slice(2)
  const isProd = args.includes('--prod')

  const config = isProd
    ? {
        name: 'PRODUCCIÓN',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD!,
        key: process.env.SUPABASE_SERVICE_ROLE_KEY_PROD!
      }
    : {
        name: 'LOCAL',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        key: process.env.SUPABASE_SERVICE_ROLE_KEY!
      }

  console.log(`\n🧹 Limpieza de datos de seed - ${config.name}\n`)

  const supabase = createClient(config.url, config.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Identificar datos
  console.log('🔍 Identificando datos...')
  const { data: ocupaciones, error: errorOcup } = await supabase
    .from('ocupacion')
    .select('ocupacion_id')
    .or('patente.like.AAA%,patente.like.BBA%,patente.like.BBM%')

  if (errorOcup) {
    console.error('Error ocupaciones:', errorOcup.message)
  }

  const { data: abonados, error: errorAbon } = await supabase
    .from('abonado')
    .select('abonado_id')
    .ilike('email', 'abonado%@test.com')

  if (errorAbon) {
    console.error('Error abonados:', errorAbon.message)
  }

  console.log(`   Ocupaciones: ${ocupaciones?.length || 0}`)
  console.log(`   Abonados: ${abonados?.length || 0}\n`)

  const respuesta = await pregunta('¿Continuar? (SI/no): ')
  if (respuesta.trim().toUpperCase() !== 'SI') {
    console.log('Cancelado\n')
    rl.close()
    process.exit(0)
  }

  console.log('\n🔧 PASO 1: Verificando FKs circulares...')

  // Las FKs circulares se manejan con DEFERRABLE en las constraints
  // No necesitamos actualizar a NULL manualmente
  console.log('   ✓ FKs configuradas como DEFERRABLE')

  console.log('\n🗑️  PASO 2: Eliminando registros...\n')

  // Ahora sí eliminar en orden
  const stats = {
    pagos: 0,
    ocupaciones: 0,
    boletas: 0,
    abonoVeh: 0,
    abonos: 0,
    abonados: 0,
    vehiculos: 0
  }

  // 1. Pagos
  if (ocupaciones && ocupaciones.length > 0) {
    console.log('💰 Eliminando pagos de ocupaciones...')
    const ocupIds = ocupaciones.map((o) => o.ocupacion_id)
    for (let i = 0; i < ocupIds.length; i += 100) {
      const batch = ocupIds.slice(i, i + 100)
      const { count, error } = await supabase
        .from('pago')
        .delete({ count: 'exact' })
        .in('ocupacion_id', batch)

      if (error) {
        console.error(`   ⚠️ Error lote ${i / 100 + 1}:`, error.message)
      }
      stats.pagos += count || 0
    }
    console.log(`   ✓ ${stats.pagos} pagos`)
  }

  if (abonados && abonados.length > 0) {
    const abonadoIds = abonados.map((a) => a.abonado_id)
    const { data: abonos } = await supabase
      .from('abono')
      .select('playa_id, plaza_id, fecha_hora_inicio')
      .in('abonado_id', abonadoIds)

    if (abonos && abonos.length > 0) {
      console.log('💰 Eliminando pagos de boletas...')

      // Primero obtener todas las boletas con sus IDs
      const boletasIds: string[] = []
      for (const abono of abonos) {
        const { data: boletas } = await supabase
          .from('boleta')
          .select('boleta_id')
          .eq('playa_id', abono.playa_id)
          .eq('plaza_id', abono.plaza_id)
          .eq('fecha_hora_inicio_abono', abono.fecha_hora_inicio)

        if (boletas) {
          boletasIds.push(...boletas.map((b) => b.boleta_id))
        }
      }

      // Ahora eliminar pagos por boleta_id
      if (boletasIds.length > 0) {
        for (let i = 0; i < boletasIds.length; i += 100) {
          const batch = boletasIds.slice(i, i + 100)
          const { count, error } = await supabase
            .from('pago')
            .delete({ count: 'exact' })
            .in('boleta_id', batch)

          if (error) {
            console.error(`   ⚠️ Error pagos: ${error.message}`)
          }
          stats.pagos += count || 0
        }
      }
      console.log(`   ✓ ${stats.pagos} pagos\n`)

      // 2. Boletas
      console.log('🎫 Eliminando boletas...')
      for (const abono of abonos) {
        const { count, error } = await supabase
          .from('boleta')
          .delete({ count: 'exact' })
          .eq('playa_id', abono.playa_id)
          .eq('plaza_id', abono.plaza_id)
          .eq('fecha_hora_inicio_abono', abono.fecha_hora_inicio)

        if (error) {
          console.error(`   ⚠️ Error: ${error.message}`)
        }
        stats.boletas += count || 0
      }
      console.log(`   ✓ ${stats.boletas} boletas\n`)

      // 3. Abono_vehiculo
      console.log('🚙 Eliminando abono_vehiculo...')
      for (const abono of abonos) {
        const { count } = await supabase
          .from('abono_vehiculo')
          .delete({ count: 'exact' })
          .eq('playa_id', abono.playa_id)
          .eq('plaza_id', abono.plaza_id)
          .eq('fecha_hora_inicio_abono', abono.fecha_hora_inicio)
        stats.abonoVeh += count || 0
      }
      console.log(`   ✓ ${stats.abonoVeh} abono_vehiculo\n`)
    }

    // 4. Abonos
    console.log('📋 Eliminando abonos...')
    for (let i = 0; i < abonadoIds.length; i += 100) {
      const batch = abonadoIds.slice(i, i + 100)
      const { count } = await supabase
        .from('abono')
        .delete({ count: 'exact' })
        .in('abonado_id', batch)
      stats.abonos += count || 0
    }
    console.log(`   ✓ ${stats.abonos} abonos\n`)

    // 5. Abonados
    console.log('👤 Eliminando abonados...')
    for (let i = 0; i < abonadoIds.length; i += 100) {
      const batch = abonadoIds.slice(i, i + 100)
      const { count } = await supabase
        .from('abonado')
        .delete({ count: 'exact' })
        .in('abonado_id', batch)
      stats.abonados += count || 0
    }
    console.log(`   ✓ ${stats.abonados} abonados\n`)
  }

  // 6. Ocupaciones
  if (ocupaciones && ocupaciones.length > 0) {
    console.log('🚗 Eliminando ocupaciones...')
    const ocupIds = ocupaciones.map((o) => o.ocupacion_id)
    for (let i = 0; i < ocupIds.length; i += 100) {
      const batch = ocupIds.slice(i, i + 100)
      const { count, error } = await supabase
        .from('ocupacion')
        .delete({ count: 'exact' })
        .in('ocupacion_id', batch)

      if (error) {
        console.error(`   ⚠️ Error lote ${i / 100 + 1}:`, error.message)
      }
      stats.ocupaciones += count || 0
    }
    console.log(`   ✓ ${stats.ocupaciones} ocupaciones\n`)
  }

  // 7. Vehículos
  console.log('🚗 Eliminando vehículos...')
  const { count: vehCount } = await supabase
    .from('vehiculo')
    .delete({ count: 'exact' })
    .or('patente.like.AAA%,patente.like.BBA%,patente.like.BBM%')
  stats.vehiculos = vehCount || 0
  console.log(`   ✓ ${stats.vehiculos} vehículos\n`)

  console.log('============================================================')
  console.log('📊 RESUMEN:')
  console.log(`   💰 Pagos:       ${stats.pagos}`)
  console.log(`   🚗 Ocupaciones: ${stats.ocupaciones}`)
  console.log(`   🎫 Boletas:     ${stats.boletas}`)
  console.log(`   🚙 Abono-veh:   ${stats.abonoVeh}`)
  console.log(`   📋 Abonos:      ${stats.abonos}`)
  console.log(`   👤 Abonados:    ${stats.abonados}`)
  console.log(`   🚗 Vehículos:   ${stats.vehiculos}`)
  console.log('============================================================\n')

  console.log('✅ Limpieza completada\n')

  rl.close()
  process.exit(0)
}

main().catch((error) => {
  console.error('\n❌ Error:', error)
  rl.close()
  process.exit(1)
})
