import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)

  // Extraer todos los parámetros de la URL
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const error_code = requestUrl.searchParams.get('error_code')
  const error_description = requestUrl.searchParams.get('error_description')
  const access_token = requestUrl.searchParams.get('access_token')
  const refresh_token = requestUrl.searchParams.get('refresh_token')
  const type = requestUrl.searchParams.get('type') // recovery, signup, etc.

  // Manejar errores directos de Supabase
  if (error_code) {
    return handleAuthError(error_code, error_description, requestUrl.origin)
  }

  // Manejar tokens directos (método legacy)
  if (access_token && refresh_token) {
    const supabase = await createClient()

    try {
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token
      })

      if (error) {
        return handleAuthError(
          'session_error',
          error.message,
          requestUrl.origin
        )
      }

      // Redirigir según el tipo
      return redirectBasedOnType(type, next, requestUrl.origin)
    } catch (error) {
      console.error('Error setting session:', error)
      return handleAuthError(
        'session_failed',
        'Error al procesar la sesión',
        requestUrl.origin
      )
    }
  }

  // Manejar código PKCE (método moderno)
  if (code) {
    const supabase = await createClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        return handleAuthError(
          'exchange_failed',
          error.message,
          requestUrl.origin
        )
      }

      // Redirigir según el tipo o parámetro next
      return redirectBasedOnType(type, next, requestUrl.origin)
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return handleAuthError(
        'exchange_failed',
        'Error al procesar el código',
        requestUrl.origin
      )
    }
  }

  // Redirección por defecto
  return NextResponse.redirect(requestUrl.origin)
}

function handleAuthError(
  error_code: string,
  error_description: string | null,
  origin: string
) {
  const isPasswordReset =
    error_code?.includes('recovery') ||
    error_code?.includes('password') ||
    error_code?.includes('otp')

  if (isPasswordReset) {
    const errorUrl = new URL('/auth/forgot-password', origin)
    errorUrl.searchParams.set('error', error_code)
    errorUrl.searchParams.set(
      'message',
      getErrorMessage(error_code, error_description)
    )
    return NextResponse.redirect(errorUrl)
  } else {
    // Error de confirmación de email o similar
    const errorUrl = new URL('/auth/login', origin)
    errorUrl.searchParams.set('error', error_code)
    errorUrl.searchParams.set(
      'message',
      getErrorMessage(error_code, error_description)
    )
    return NextResponse.redirect(errorUrl)
  }
}

function redirectBasedOnType(
  type: string | null,
  next: string | null,
  origin: string
) {
  // Si hay un parámetro next específico, usarlo
  if (next) {
    // Si el next contiene complete-registration, es una invitación
    if (next.includes('/auth/complete-registration')) {
      return NextResponse.redirect(
        new URL('/auth/complete-registration', origin)
      )
    }
    return NextResponse.redirect(new URL(next, origin))
  }

  // Redirigir según el tipo de auth
  switch (type) {
    case 'recovery':
      // Password reset
      return NextResponse.redirect(new URL('/auth/update-password', origin))

    case 'signup':
      // Email confirmation para nuevo usuario
      return NextResponse.redirect(new URL('/admin/playas', origin))

    case 'invite':
      // Invitación de equipo - redirigir a completar registro
      return NextResponse.redirect(
        new URL('/auth/complete-registration', origin)
      )

    case 'magiclink':
      // Magic link login
      return NextResponse.redirect(new URL('/admin/playas', origin))

    default:
      // Por defecto, ir a admin si está autenticado
      return NextResponse.redirect(new URL('/admin/playas', origin))
  }
}

function getErrorMessage(
  error_code: string,
  error_description: string | null
): string {
  const errorMessages: Record<string, string> = {
    otp_expired: 'El enlace ha expirado. Solicita uno nuevo.',
    otp_disabled: 'El enlace ya fue usado. Solicita uno nuevo.',
    access_denied: 'Acceso denegado. El enlace es inválido.',
    email_not_confirmed: 'Email no confirmado. Revisa tu bandeja de entrada.',
    signup_disabled: 'El registro está deshabilitado.',
    exchange_failed: 'Error al procesar el enlace. Inténtalo de nuevo.',
    session_failed: 'Error al establecer la sesión. Inténtalo de nuevo.'
  }

  return (
    errorMessages[error_code] ||
    error_description ||
    'Ha ocurrido un error. Inténtalo de nuevo.'
  )
}
