import { createClient } from './server'

export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const supabase = await createClient()
    await supabase.auth.getSession()
    return true
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Supabase no está disponible')
      console.info('💡 Solución: Ejecutá "supabase start" en la terminal')
    }
    return false
  }
}
