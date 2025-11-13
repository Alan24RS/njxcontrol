'use server'

import { ROL } from '@/constants/rol'
import { createClient } from '@/lib/supabase/server'
import {
  forgotPasswordSchema,
  loginSchema,
  signupSchema,
  updatePasswordSchema
} from '@/schemas/auth'
import { translateDBError } from '@/utils/errorMessages'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function login(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  if (!(payload instanceof FormData)) {
    return {
      success: false,
      errors: { error: ['Invalid Form Data'] }
    }
  }

  const supabase = await createClient()

  const formData = Object.fromEntries(payload)

  const parsed = loginSchema.safeParse(formData)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const fields: Record<string, string> = {}

    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString()
    }

    return {
      success: false,
      fields,
      errors
    }
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password
    })

    if (error) {
      return {
        success: false,
        errors: { general: [translateDBError(error.message)] }
      }
    }
  } catch (err) {
    return {
      success: false,
      errors: { general: [translateDBError(err)] }
    }
  }

  return {
    success: true
  }
}

export async function signup(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  if (!(payload instanceof FormData)) {
    return {
      success: false,
      errors: { error: ['Invalid Form Data'] }
    }
  }

  const formData = Object.fromEntries(payload)

  const parsed = signupSchema.safeParse(formData)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const fields: Record<string, string> = {}

    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString()
    }

    return {
      success: false,
      fields,
      errors
    }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')}/api/auth/callback`,
        data: {
          name: parsed.data.name,
          role: ROL.DUENO
        }
      }
    })

    if (error) {
      return {
        success: false,
        errors: { general: [translateDBError(error.message)] }
      }
    }
  } catch (err) {
    return {
      success: false,
      errors: { general: [translateDBError(err)] }
    }
  }

  return {
    success: true
  }
}

export async function logout() {
  const supabase = await createClient()

  await supabase.auth.signOut()
}

export async function forgotPassword(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  if (!(payload instanceof FormData)) {
    return {
      success: false,
      errors: { error: ['Invalid Form Data'] }
    }
  }

  const supabase = await createClient()

  const formData = Object.fromEntries(payload)

  const parsed = forgotPasswordSchema.safeParse(formData)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const fields: Record<string, string> = {}

    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString()
    }

    return {
      success: false,
      fields,
      errors
    }
  }

  // Detectar entorno y construir URL de callback correcta
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'

  let callbackUrl: string

  if (isDevelopment) {
    // En desarrollo local, usar localhost
    callbackUrl =
      'http://localhost:3000/api/auth/callback?next=/auth/update-password'
  } else if (isProduction) {
    // En producción, usar la URL de producción
    const productionUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://valet-iota.vercel.app'
    callbackUrl = `${productionUrl.replace(/\/$/, '')}/api/auth/callback?next=/auth/update-password`
  } else {
    // Fallback (preview/staging)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    callbackUrl = `${baseUrl ? `https://${baseUrl}` : 'http://localhost:3000'}/api/auth/callback?next=/auth/update-password`
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: callbackUrl
      }
    )

    if (error) {
      return {
        success: false,
        errors: { general: [translateDBError(error.message)] }
      }
    }
  } catch (err) {
    return {
      success: false,
      errors: { general: [translateDBError(err)] }
    }
  }

  return {
    success: true
  }
}

export async function updatePassword(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  if (!(payload instanceof FormData)) {
    return {
      success: false,
      errors: { error: ['Invalid Form Data'] }
    }
  }

  const supabase = await createClient()

  const formData = Object.fromEntries(payload)

  const parsed = updatePasswordSchema.safeParse(formData)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const fields: Record<string, string> = {}

    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString()
    }

    return {
      success: false,
      fields,
      errors
    }
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password
    })

    if (error) {
      return {
        success: false,
        errors: { general: [translateDBError(error.message)] }
      }
    }
  } catch (err) {
    return {
      success: false,
      errors: { general: [translateDBError(err)] }
    }
  }

  return {
    success: true
  }
}
