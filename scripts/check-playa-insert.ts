import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function checkPlayaInsert() {
  console.log('🔍 Intentando insertar playa de prueba...\n')

  const testPlaya = {
    playa_id: 'test-playa-123',
    playa_dueno_id: '00000000-0000-0000-0000-000000000000', // UUID ficticio
    nombre: 'Test Parking',
    direccion: 'Calle Test 123',
    ciudad_id: 1,
    latitud: -27.4479133,
    longitud: -58.9756058,
    horario: '00:00 - 23:59',
    descripcion: 'Playa de prueba',
    estado: 'ACTIVO'
  }

  // Intentar insert con service role
  const { data, error } = await supabaseAdmin
    .from('playa')
    .insert(testPlaya)
    .select()

  if (error) {
    console.error('❌ Error al insertar:', error)
    return
  }

  console.log('✅ Playa insertada:', data)

  // Verificar que se puede leer
  const { data: readData, error: readError } = await supabaseAdmin
    .from('playa')
    .select('*')
    .eq('playa_id', testPlaya.playa_id)
    .single()

  if (readError) {
    console.error('❌ Error al leer playa insertada:', readError)
    return
  }

  console.log('✅ Playa leída:', readData)

  // Verificar con cliente anónimo (público)
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: publicData, error: publicError } = await supabaseAnon
    .from('playa')
    .select('*')
    .eq('playa_id', testPlaya.playa_id)
    .single()

  if (publicError) {
    console.error('❌ Error al leer con cliente público:', publicError)
  } else {
    console.log('✅ Playa visible para cliente público:', publicData)
  }

  // Limpiar
  await supabaseAdmin.from('playa').delete().eq('playa_id', testPlaya.playa_id)
  console.log('\n🧹 Playa de prueba eliminada')
}

checkPlayaInsert()
