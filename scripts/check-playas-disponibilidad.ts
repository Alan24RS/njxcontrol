import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPlayasDisponibilidad() {
  console.log('🔍 Verificando vista v_playas_disponibilidad...\n')

  const { data, error } = await supabase
    .from('v_playas_disponibilidad')
    .select('*')
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`✅ Encontradas ${data?.length || 0} filas\n`)

  if (data && data.length > 0) {
    console.log('Datos de la vista:')
    data.forEach((row: any) => {
      console.log(`
- Playa: ${row.playa_nombre}
  Tipo: ${row.tipo_plaza_nombre}
  Total: ${row.total_plazas}
  Disponibles: ${row.plazas_disponibles}
  Coords: (${row.playa_latitud}, ${row.playa_longitud})
      `)
    })
  } else {
    console.log('⚠️  No hay datos en la vista')

    // Verificar si hay playas
    const { data: playas } = await supabase
      .from('playa')
      .select('playa_id, nombre, latitud, longitud, estado')
      .limit(5)

    console.log('\n🏖️  Playas en la tabla playa:')
    console.log(playas)
  }
}

checkPlayasDisponibilidad()
