'use server'

import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const completeRegistrationSchema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  })

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function completeRegistration(
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

  const parsed = completeRegistrationSchema.safeParse(formData)

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
    // Obtener el usuario actual (debe estar autenticado por la invitación)
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Auth error getting user:', userError)
      return {
        success: false,
        errors: {
          general: [
            `Error de autenticación: ${userError.message}. Por favor, usa el enlace de invitación más reciente.`
          ]
        }
      }
    }

    if (!user) {
      console.error('No user found in session')
      return {
        success: false,
        errors: {
          general: [
            'No se encontró una sesión válida. Por favor, usa el enlace de invitación más reciente o contacta al administrador.'
          ]
        }
      }
    }

    // Actualizar la contraseña del usuario
    const { error: passwordError } = await supabase.auth.updateUser({
      password: parsed.data.password
    })

    if (passwordError) {
      console.error('Password update error:', passwordError)
      return {
        success: false,
        errors: {
          general: [
            `Error al actualizar contraseña: ${passwordError.message}. Verifica que la contraseña cumpla los requisitos.`
          ]
        }
      }
    }

    // Actualizar los metadatos del usuario con el nombre
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        name: parsed.data.name
      }
    })

    if (metadataError) {
      console.error('Metadata update error:', metadataError)
      return {
        success: false,
        errors: {
          general: [`Error al actualizar perfil: ${metadataError.message}`]
        }
      }
    }

    // Aceptar invitación si existe (usando la función RPC)
    if (user.email) {
      await supabase.rpc('aceptar_invitacion_playero', {
        p_email: user.email,
        p_nombre_final: parsed.data.name,
        p_auth_user_id: user.id
      })
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Error completing registration:', error)
    return {
      success: false,
      errors: { general: ['Error inesperado al completar el registro'] }
    }
  }
}
