import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { generateSyncMetadata } from '@/utils/metadata'

import SignupPlayeroForm from './components/SignupPlayeroForm'

type Props = {
  params: Promise<{ token: string }>
}

export const metadata = generateSyncMetadata({
  title: 'Completar Registro - Playero',
  description: 'Completa tu registro como playero',
  pageRoute: '/auth/signup-playero'
})

export default async function SignupPlayeroPage({ params }: Props) {
  const supabase = await createClient()
  const { token } = await params

  // Validar token de invitación
  const { data: invitacion, error } = await supabase.rpc(
    'validar_token_invitacion',
    { p_token: token }
  )

  if (error) {
    console.error('Error validando token:', error)
    redirect('/auth/login?error=invalid-invitation')
  }

  if (!invitacion?.success) {
    redirect('/auth/login?error=invalid-invitation')
  }

  return (
    <div className="container mx-auto max-w-md py-8">
      <SignupPlayeroForm token={token} invitacionData={invitacion.data} />
    </div>
  )
}
