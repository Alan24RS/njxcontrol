import { notFound, redirect } from 'next/navigation'

import { PageContainer } from '@/components/layout'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getPlayeroWithDatePlayas } from '@/services/playeros/getPlayeroWithDatePlayas'
import { generateSyncMetadata } from '@/utils/metadata'

import PlayeroDetailContent from './components/PlayeroDetailContent'

type Props = {
  params: Promise<{ playeroId: string }>
}

export const metadata = generateSyncMetadata({
  title: 'Detalle de Playero',
  description: 'Ver detalles y gestionar accesos del playero',
  pageRoute: '/admin/playeros/[playeroId]'
})

export default async function PlayeroDetailPage({ params }: Props) {
  const user = await getAuthenticatedUser()
  const { playeroId } = await params

  if (!user) {
    redirect('/auth/login')
  }

  // Usamos un servicio JS local en lugar del RPC para evitar dependencias en funciones
  // de la base de datos que podrían no coincidir con el esquema actual.
  const fallback = await getPlayeroWithDatePlayas(playeroId)
  if (fallback.error || !fallback.data) {
    console.error('No se pudo obtener el playero:', fallback.error)
    notFound()
  }

  const playeroData = fallback.data

  // Convertir fechas a strings para pasar a componentes cliente
  if (playeroData.playas && Array.isArray(playeroData.playas)) {
    playeroData.playas = playeroData.playas.map((p: any) => ({
      ...p,
      fecha_asignacion: p.fecha_asignacion
        ? new Date(p.fecha_asignacion).toISOString()
        : null
    }))
  }

  // Asegurar que las fechas principales también sean strings serializables
  playeroData.fecha_alta = playeroData.fecha_alta
    ? new Date(playeroData.fecha_alta).toISOString()
    : null
  playeroData.fecha_modificacion = playeroData.fecha_modificacion
    ? new Date(playeroData.fecha_modificacion).toISOString()
    : null

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PlayeroDetailContent playeroData={playeroData} />
    </PageContainer>
  )
}
