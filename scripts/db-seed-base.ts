import { createClient } from '@supabase/supabase-js'

import { caracteristicas } from './seeds/base/caracteristicas'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables:')
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
  },
  global: {
    headers: {
      apikey: supabaseServiceRoleKey
    }
  }
})

async function seedBase() {
  console.log('🌱 Seeding base data (master data)...')
  console.log('   These are essential system-wide data needed for operation')
  console.log('')

  console.log('⭐ Seeding plaza characteristics...')
  const { error: caracteristicasError } = await supabase
    .from('caracteristica')
    .upsert(caracteristicas, { onConflict: 'nombre' })

  if (caracteristicasError) {
    console.error(
      'Error seeding characteristics:',
      caracteristicasError.message
    )
  } else {
    console.log(`✅ Seeded ${caracteristicas.length} characteristics`)
  }

  console.log('')
  console.log('✅ Base data seeding complete!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   ⭐ Plaza characteristics: ${caracteristicas.length}`)
  console.log('')
  console.log('💡 Safe for production - all operations use upsert')
  console.log('💡 For test data (cities, users, playas), use: pnpm db:seed:dev')

  process.exit(0)
}

seedBase().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
