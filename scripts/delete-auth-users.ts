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

async function deleteAllAuthUsers() {
  console.log('🗑️  Deleting all users from auth.users...')

  try {
    const { data: users, error: listError } =
      await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      return false
    }

    if (!users || !users.users || users.users.length === 0) {
      console.log('   ℹ️  No users found in auth.users')
      return true
    }

    console.log(`   Found ${users.users.length} user(s) to delete`)

    let deletedCount = 0
    let errorCount = 0

    for (const user of users.users) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        user.id
      )

      if (deleteError) {
        console.error(
          `   ⚠️  Error deleting user ${user.email}:`,
          deleteError.message
        )
        errorCount++
      } else {
        deletedCount++
        console.log(`   ✅ Deleted user: ${user.email}`)
      }
    }

    console.log(`   ✅ Deleted ${deletedCount} user(s), ${errorCount} error(s)`)
    return errorCount === 0
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function main() {
  const isLocal =
    supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')

  if (isLocal) {
    console.log(
      'ℹ️  Local database detected. Using supabase db reset (should clear auth.users automatically)'
    )
    process.exit(0)
  }

  const success = await deleteAllAuthUsers()
  process.exit(success ? 0 : 1)
}

main()
