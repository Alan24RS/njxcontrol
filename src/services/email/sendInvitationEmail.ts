'use server'

import { resend } from '@/lib/resend/client'

interface SendInvitationEmailParams {
  email: string
  nombre: string
  invitacionId: string
  duenoNombre: string
  duenoEmail: string
  playasNombres: string[]
  isExistingUser?: boolean
}

export async function sendInvitationEmail({
  email,
  nombre,
  invitacionId,
  duenoNombre,
  duenoEmail,
  playasNombres,
  isExistingUser = false
}: SendInvitationEmailParams): Promise<void> {
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup-playero/${invitacionId}`

  const emailHtml = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invitación a Valet - Sistema de Gestión de Playas</title>
        <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 10px;
        background-color: #f8fafc;
      }
      .container {
        background-color: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      @media only screen and (min-width: 600px) {
        body {
          padding: 20px;
        }
        .container {
          padding: 40px;
        }
      }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 24px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
          }
          .title {
            color: #1e293b;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 10px 0;
          }
          .subtitle {
            color: #64748b;
            font-size: 16px;
            margin: 0;
          }
          .content {
            margin: 30px 0;
          }
          .invitation-details {
            background-color: #f1f5f9;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .detail-item {
            margin: 10px 0;
          }
          .detail-label {
            font-weight: 600;
            color: #475569;
          }
          .detail-value {
            color: #1e293b;
            margin-left: 10px;
          }
          .playas-list {
            list-style-type: none;
            padding: 0;
            margin: 10px 0;
          }
          .playas-list li {
            padding: 5px 0;
            padding-left: 20px;
            position: relative;
          }
          .playas-list li:before {
            content: "🅿️";
            position: absolute;
            left: 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🅿️ Valet</div>
            <h1 class="title">¡Has sido invitado!</h1>
            <p class="subtitle">Te han invitado a unirte como playero en el sistema Valet</p>
          </div>

          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>

            <p><strong>${duenoNombre}</strong> te ha invitado a trabajar como playero en el sistema de gestión de playas <strong>Valet</strong>.</p>


            <div class="invitation-details">
              <h3 style="margin-top: 0; color: #475569">Detalles de tu invitación:</h3>
              <div class="detail-item">
                <span class="detail-label">📧 Email:</span>
                <span class="detail-value">${email}</span>
              </div>
              ${
                isExistingUser
                  ? ''
                  : `
              <div class="detail-item">
                <span class="detail-label">👤 Nombre provisional:</span>
                <span class="detail-value">${nombre}</span>
              </div>
              `
              }
              <div class="detail-item">
                <span class="detail-label">🏢 Invitado por:</span>
                <span class="detail-value">${duenoNombre}</span>
              </div>
              ${
                playasNombres.length > 0
                  ? `
              <div class="detail-item">
                <span class="detail-label">🅿️ Playas asignadas:</span>
                <ul class="playas-list">
                  ${playasNombres.map((playa) => `<li>${playa}</li>`).join('')}
                </ul>
              </div>
              `
                  : ''
              }
            </div>

            ${
              isExistingUser
                ? `
            <p>Como ya tienes una cuenta en Valet, solo necesitas aceptar esta invitación para acceder a las nuevas playas asignadas.</p>

            <div style="text-align: center">
              <a href="${invitationUrl}" class="cta-button">✅ Aceptar Invitación</a>
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul style="margin: 10px 0; padding-left: 20px">
                <li>Este enlace expira en 7 días</li>
                <li>Solo puedes usar este enlace una vez</li>
                <li>Puedes aceptar o rechazar sin necesidad de iniciar sesión</li>
              </ul>
            </div>

            <p>Una vez que aceptes la invitación, tendrás acceso inmediato a:</p>
            `
                : `
            <p>Para completar tu registro y acceder al sistema, haz clic en el siguiente botón:</p>

            <div style="text-align: center">
              <a href="${invitationUrl}" class="cta-button">✅ Completar Registro</a>
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul style="margin: 10px 0; padding-left: 20px">
                <li>Este enlace expira en 7 días</li>
                <li>Solo puedes usar este enlace una vez</li>
                <li>Podrás establecer tu nombre y contraseña al registrarte</li>
              </ul>
            </div>

            <p>Una vez que completes tu registro, tendrás acceso a:</p>
            `
            }
            <ul>
              <li>📊 Panel de control personalizado</li>
              <li>🅿️ Gestión de las playas asignadas</li>
              <li>📱 Herramientas para el trabajo diario</li>
              <li>📈 Reportes y estadísticas</li>
            </ul>

            <p>Si tienes alguna pregunta o problema con el registro, contacta a <strong>${duenoNombre}</strong> al correo: <a href="mailto:${duenoEmail}" style="color: #667eea;">${duenoEmail}</a></p>
          </div>

          <div class="footer">
            <p>Este email fue enviado desde <strong>Valet</strong> - Sistema de Gestión de Playas</p>
            <p>Si no esperabas este email, puedes ignorarlo de forma segura.</p>
          </div>
        </div>
      </body>
    </html>
  `

  if (!process.env.RESEND_API_KEY) {
    console.error(
      '❌ Cannot send email: RESEND_API_KEY not configured. See docs/RESEND_SETUP.md'
    )
    throw new Error(
      'Email service not configured. Please set RESEND_API_KEY in your environment variables.'
    )
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Valet <onboarding@resend.dev>',
      to: email,
      subject: isExistingUser
        ? `🅿️ Nueva asignación en Valet - ${duenoNombre} te ha asignado nuevas playas`
        : `🅿️ Invitación a Valet - ${duenoNombre} te ha invitado`,
      html: emailHtml
    })

    if (error) {
      console.error('❌ Error sending email with Resend:', error)
      throw new Error(`Failed to send invitation email: ${error.message}`)
    }
  } catch (error) {
    console.error('❌ Error in sendInvitationEmail:', error)
    throw error
  }
}
