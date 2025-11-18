import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAbonos() {
  console.log('🔍 Verificando abonos en la base de datos...\n')

  // Ver todos los abonos
  const { data: abonos, error: abonosError } = await supabase
    .from('abono')
    .select('*')

  if (abonosError) {
    console.error('❌ Error al obtener abonos:', abonosError)
    return
  }

  console.log(`📊 Total de abonos: ${abonos?.length || 0}`)
  if (abonos && abonos.length > 0) {
    console.log('\n📋 Abonos encontrados:')
    abonos.forEach((abono, index) => {
      console.log(
        `  ${index + 1}. Plaza: ${abono.plaza_id}, Abonado: ${abono.abonado_id}`
      )
      console.log(`     Inicio: ${abono.fecha_hora_inicio}`)
      console.log(`     Fin: ${abono.fecha_fin}`)
    })
  }

  // Ver la vista
  console.log('\n🔍 Consultando vista abonos_vigentes_por_playa...\n')
  const { data: reportes, error: reportesError } = await supabase
    .from('abonos_vigentes_por_playa')
    .select('*')

  if (reportesError) {
    console.error('❌ Error al obtener reportes:', reportesError)
    return
  }

  console.log(`📊 Total de playas: ${reportes?.length || 0}`)
  if (reportes && reportes.length > 0) {
    reportes.forEach((reporte) => {
      console.log(`\n🏖️  ${reporte.playa_nombre}`)
      console.log(`   Abonos vigentes: ${reporte.total_abonos_vigentes}`)
      console.log(`   Plazas ocupadas: ${reporte.plazas_ocupadas_por_abono}`)
      console.log(`   Detalles:`, reporte.detalle_abonos)
    })
  }
}

checkAbonos()
