'use server'

import { ROL } from '@/constants/rol'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { acceptInvitationSchema, signupPlayeroSchema } from '@/schemas/auth'

type FormState = {
  success: boolean
  message?: string
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function signupPlayero(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  if (!(payload instanceof FormData)) {
    return {
      success: false,
      errors: { error: ['Datos de formulario inválidos'] }
    }
  }

  const formData = Object.fromEntries(payload)
  const parsed = signupPlayeroSchema.safeParse(formData)

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
    // Validar token de invitación antes de crear usuario
    const { data: tokenValidation, error: tokenError } = await supabase.rpc(
      'validar_token_invitacion',
      { p_token: parsed.data.token }
    )

    if (tokenError) {
      console.error('Error validando token:', tokenError)
      return {
        success: false,
        errors: { general: ['Error al validar invitación'] }
      }
    }

    if (!tokenValidation?.success) {
      return {
        success: false,
        errors: {
          general: [tokenValidation?.error || 'Token de invitación inválido']
        }
      }
    }

    const invitacionData = tokenValidation.data

    // Crear usuario usando admin client con email pre-confirmado
    // Los playeros invitados no necesitan confirmar email ya que vienen de invitación válida
    const adminClient = createAdminClient()
    const { data: signupData, error: signupError } =
      await adminClient.auth.admin.createUser({
        email: invitacionData.email,
        password: parsed.data.password,
        email_confirm: true, // Pre-confirmar email para playeros invitados
        user_metadata: {
          name: parsed.data.name,
          role: ROL.PLAYERO,
          invitation_token: parsed.data.token,
          invited_by: invitacionData.dueno_invitador_id,
          playas_asignadas: invitacionData.playas_ids?.join(',')
        }
      })

    if (signupError) {
      console.error('❌ Error en signup:', {
        message: signupError.message,
        status: signupError.status,
        details: signupError
      })
      return {
        success: false,
        errors: { general: [signupError.message] }
      }
    }

    // Crear usuario en tablas públicas y procesar invitación
    if (signupData.user?.id) {
      try {
        // Usar la función RPC para aceptar la invitación
        const { data: acceptResult, error: acceptError } = await supabase.rpc(
          'aceptar_invitacion_playero_por_token',
          {
            p_token: parsed.data.token,
            p_auth_user_id: signupData.user.id,
            p_nombre_final: parsed.data.name
          }
        )

        if (acceptError) {
          console.error('❌ Error aceptando invitación:', acceptError)
          // Limpiar usuario de auth si falla la invitación
          await adminClient.auth.admin.deleteUser(signupData.user.id)
          return {
            success: false,
            errors: { general: ['Error procesando invitación'] }
          }
        }

        if (!acceptResult?.success) {
          console.error('❌ Invitación no aceptada:', acceptResult?.error)
          // Limpiar usuario de auth si falla la invitación
          await adminClient.auth.admin.deleteUser(signupData.user.id)
          return {
            success: false,
            errors: {
              general: [acceptResult?.error || 'Error procesando invitación']
            }
          }
        }
      } catch (invitationError) {
        console.error(
          '❌ Error inesperado procesando invitación:',
          invitationError
        )
        // Limpiar usuario de auth si falla
        try {
          await adminClient.auth.admin.deleteUser(signupData.user.id)
        } catch (cleanupError) {
          console.error('❌ Error limpiando usuario:', cleanupError)
        }
        return {
          success: false,
          errors: { general: ['Error inesperado procesando invitación'] }
        }
      }
    }

    // Cerrar cualquier sesión existente para que el nuevo playero pueda iniciar sesión
    try {
      await supabase.auth.signOut()
    } catch (signOutError) {
      console.warn('⚠️ Error cerrando sesión anterior:', signOutError)
      // No fallar el proceso por esto
    }

    return {
      success: true,
      message:
        'Cuenta creada exitosamente. Inicia sesión con tus nuevas credenciales.'
    }
  } catch (error) {
    console.error('Error inesperado en signup playero:', error)
    return {
      success: false,
      errors: { general: ['Error inesperado al crear cuenta'] }
    }
  }
}

export async function acceptInvitationExistingUser(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  if (!(payload instanceof FormData)) {
    return {
      success: false,
      errors: { error: ['Datos de formulario inválidos'] }
    }
  }

  const formData = Object.fromEntries(payload)
  const parsed = acceptInvitationSchema.safeParse(formData)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    return {
      success: false,
      errors
    }
  }

  const supabase = await createClient()

  try {
    const { data: validationResult } = await supabase.rpc(
      'validar_token_invitacion',
      { p_token: parsed.data.token }
    )

    if (!validationResult?.success) {
      return {
        success: false,
        errors: {
          general: [validationResult?.error || 'Token de invitación inválido']
        }
      }
    }

    const email = validationResult.data.email

    const { data: acceptResult, error: acceptError } = await supabase.rpc(
      'aceptar_invitacion_sin_auth',
      {
        p_token: parsed.data.token,
        p_email: email
      }
    )

    if (acceptError) {
      console.error('❌ Error aceptando invitación:', acceptError)
      return {
        success: false,
        errors: { general: ['Error al aceptar invitación'] }
      }
    }

    if (!acceptResult?.success) {
      console.error('❌ Invitación no aceptada:', acceptResult?.error)
      return {
        success: false,
        errors: {
          general: [acceptResult?.error || 'Error al aceptar invitación']
        }
      }
    }

    return {
      success: true,
      message: acceptResult.message || '¡Invitación aceptada exitosamente!'
    }
  } catch (error) {
    console.error('Error inesperado aceptando invitación:', error)
    return {
      success: false,
      errors: { general: ['Error inesperado al aceptar invitación'] }
    }
  }
}
