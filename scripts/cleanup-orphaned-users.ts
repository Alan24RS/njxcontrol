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

async function cleanupOrphanedUsers() {
  console.log('🧹 Cleaning up orphaned users...\n')

  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const authUserIds = new Set(authUsers?.users.map((u) => u.id) || [])

  const { data: publicUsers, error: fetchError } = await supabase
    .from('usuario')
    .select('usuario_id, email')

  if (fetchError) {
    console.error(
      '❌ Error fetching users from public.usuario:',
      fetchError.message
    )
    return
  }

  const orphanedUsers =
    publicUsers?.filter((u) => !authUserIds.has(u.usuario_id)) || []

  if (orphanedUsers.length === 0) {
    console.log('✅ No orphaned users found.')
    return
  }

  console.log(`Found ${orphanedUsers.length} orphaned user(s):\n`)
  orphanedUsers.forEach((u) => {
    console.log(`   - ${u.email} (${u.usuario_id})`)
  })

  console.log('\n🗑️  Deleting orphaned users...\n')

  for (const user of orphanedUsers) {
    console.log(`   Deleting ${user.email}...`)

    const { error: playeroPlayaError } = await supabase
      .from('playero_playa')
      .delete()
      .eq('playero_id', user.usuario_id)

    if (playeroPlayaError) {
      console.error(
        `   ⚠️  Error deleting playero_playa: ${playeroPlayaError.message}`
      )
    }

    const { error: playaError } = await supabase
      .from('playa')
      .delete()
      .eq('playa_dueno_id', user.usuario_id)

    if (playaError) {
      console.error(`   ⚠️  Error deleting playas: ${playaError.message}`)
    }

    const { error: rolError } = await supabase
      .from('rol_usuario')
      .delete()
      .eq('usuario_id', user.usuario_id)

    if (rolError) {
      console.error(`   ⚠️  Error deleting rol_usuario: ${rolError.message}`)
    }

    const { error: usuarioError } = await supabase
      .from('usuario')
      .delete()
      .eq('usuario_id', user.usuario_id)

    if (usuarioError) {
      console.error(`   ❌ Error deleting usuario: ${usuarioError.message}`)
    } else {
      console.log(`   ✅ Deleted ${user.email}`)
    }
  }

  console.log('\n✅ Orphaned users cleanup complete!')
}

cleanupOrphanedUsers().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
