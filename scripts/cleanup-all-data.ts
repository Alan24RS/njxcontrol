#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

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

async function cleanupAllData() {
  console.log('🧹 Cleaning up ALL data from database...\n')

  const tablesToClean = [
    'pago',
    'boleta',
    'abono_vehiculo',
    'abono',
    'abonado',
    'vehiculo',
    'ocupacion',
    'turno',
    'tarifa',
    'playero_invitacion',
    'playero_playa',
    'plaza',
    'tipo_plaza_caracteristica',
    'tipo_plaza',
    'tipo_vehiculo_playa',
    'metodo_pago_playa',
    'modalidad_ocupacion_playa',
    'playa',
    'rol_usuario',
    'usuario',
    'ciudad',
    'caracteristica',
    'pago_event_log'
  ]

  console.log(`⚠️  About to delete data from ${tablesToClean.length} tables\n`)

  let successCount = 0
  let errorCount = 0

  for (const table of tablesToClean) {
    try {
      const { error: selectError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (selectError) {
        console.error(`   ❌ Error checking ${table}:`, selectError.message)
        errorCount++
        continue
      }

      const { data: sampleRow } = await supabase
        .from(table)
        .select()
        .limit(1)
        .maybeSingle()

      if (!sampleRow) {
        console.log(`   ℹ️  ${table} is already empty`)
        successCount++
        continue
      }

      const firstColumn = Object.keys(sampleRow)[0]

      const { error } = await supabase
        .from(table)
        .delete()
        .not(firstColumn, 'is', null)

      if (error) {
        console.error(`   ❌ Error cleaning ${table}:`, error.message)
        errorCount++
      } else {
        console.log(`   ✅ Cleaned ${table}`)
        successCount++
      }
    } catch (error) {
      console.error(`   ❌ Unexpected error cleaning ${table}:`, error)
      errorCount++
    }
  }

  console.log(
    `\n📊 Cleanup summary: ${successCount} tables cleaned, ${errorCount} errors\n`
  )

  if (errorCount > 0) {
    console.warn('⚠️  Some tables could not be cleaned. Check errors above.')
    process.exit(1)
  }

  console.log('✅ All data cleaned successfully!')
}

cleanupAllData().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
