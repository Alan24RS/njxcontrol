import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase para operaciones cacheadas con unstable_cache.
 * No usa cookies ni React cache para evitar conflictos con Next.js unstable_cache.
 * Solo debe usarse para operaciones de lectura que no requieren autenticación.
 */
export const createCachedClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
