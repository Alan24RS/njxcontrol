'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/lib/supabase/server'
import { invitarPlayeroSchema } from '@/schemas/playero'
import { addPlayeroToPlayas } from '@/services/playeros/addPlayeroToPlayas'
import { deletePlayero } from '@/services/playeros/deletePlayero'
import { invitePlayero } from '@/services/playeros/invitePlayero'
import { resendInvitation } from '@/services/playeros/resendInvitation'
import { selfAssignAsPlayero } from '@/services/playeros/selfAssignAsPlayero'
import { togglePlayeroPlayaEstado } from '@/services/playeros/togglePlayeroPlayaEstado'
import { unlinkPlayeroFromPlayas } from '@/services/playeros/unlinkPlayeroFromPlayas'
import { updatePlayeroWithPlayas } from '@/services/playeros/updatePlayeroWithPlayas'
import { revalidateAdminPath, revalidatePlayas } from '@/utils/revalidation'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function updatePlayeroAction({
  playeroId,
  nuevasPlayas,
  playas,
  nuevoNombre,
  nuevoTelefono,
  nuevoEstado
}: {
  playeroId: string
  nuevasPlayas?: string[]
  playas?: { playa_id: string; estado?: string | null }[]
  nuevoNombre?: string | null
  nuevoTelefono?: string | null
  nuevoEstado?: string | null
}) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const result = await updatePlayeroWithPlayas({
    playeroId,
    duenoId: user.id,
    nuevasPlayas,
    playas,
    nuevoNombre,
    nuevoTelefono,
    nuevoEstado: nuevoEstado ?? undefined
  })

  if (result?.error) {
    return { success: false, error: result.error }
  }

  revalidatePath('/admin/playeros')
  revalidatePath(`/admin/playeros/${playeroId}`)
  await revalidateAdminPath()
  await revalidatePlayas()

  return { success: true }
}

export async function unlinkPlayeroAction({
  playeroId,
  playasIds,
  motivo
}: {
  playeroId: string
  playasIds: string[]
  motivo?: string
}) {
  if (!Array.isArray(playasIds) || playasIds.length === 0) {
    return {
      success: false,
      error: 'playasIds debe ser un array no vacío'
    }
  }

  const result = await unlinkPlayeroFromPlayas(playeroId, playasIds, motivo)

  if (result.error) {
    return { success: false, error: result.error }
  }

  revalidatePath('/admin/playeros')
  revalidatePath(`/admin/playeros/${playeroId}`)
  await revalidateAdminPath()
  await revalidatePlayas()

  return { success: true, data: result.data }
}

export async function togglePlayeroPlayaEstadoAction({
  playeroId,
  playaId
}: {
  playeroId: string
  playaId: string
}) {
  if (!playeroId || !playaId) {
    return {
      success: false,
      error: 'Faltan parámetros playeroId o playaId'
    }
  }

  const result = await togglePlayeroPlayaEstado(playeroId, playaId)

  if (result.error) {
    return { success: false, error: result.error }
  }

  revalidatePath('/admin/playeros')
  revalidatePath(`/admin/playeros/${playeroId}`)
  await revalidateAdminPath()
  await revalidatePlayas()

  return { success: true, data: result.data }
}

export async function addPlayeroToPlayasAction({
  playeroId,
  playasIds
}: {
  playeroId: string
  playasIds: string[]
}) {
  if (!Array.isArray(playasIds) || playasIds.length === 0) {
    return {
      success: false,
      error: 'Debe enviar al menos una playa'
    }
  }

  const result = await addPlayeroToPlayas(playeroId, playasIds)

  if (result.error) {
    return { success: false, error: result.error }
  }

  revalidatePath('/admin/playeros')
  revalidatePath(`/admin/playeros/${playeroId}`)
  await revalidateAdminPath()
  await revalidatePlayas()

  return { success: true, data: result.data }
}

export async function invitarPlayeroAction(
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
  const playasIdsString = formData.playasIds as string
  const playasIds = playasIdsString ? playasIdsString.split(',') : []

  const parsed = invitarPlayeroSchema.safeParse({
    ...formData,
    playasIds
  })

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

  const result = await invitePlayero(parsed.data)

  if (result.error) {
    return {
      success: false,
      errors: { general: [result.error] }
    }
  }

  revalidatePath('/admin/playeros')
  await revalidateAdminPath()
  await revalidatePlayas()

  return { success: true }
}

export async function deletePlayeroAction({
  playeroId,
  playaId,
  motivo
}: {
  playeroId: string
  playaId: string
  motivo?: string
}) {
  const result = await deletePlayero(playeroId, playaId, motivo)

  if (result.error) {
    return { success: false, error: result.error }
  }

  revalidatePath('/admin/playeros')
  revalidatePath(`/admin/playeros/${playeroId}`)
  await revalidateAdminPath()
  await revalidatePlayas()

  return { success: true, data: result.data }
}

export async function resendInvitationAction(email: string) {
  const result = await resendInvitation(email)

  if (result.error) {
    return { success: false, error: result.error }
  }

  revalidatePath('/admin/playeros')
  await revalidateAdminPath()

  return { success: true, data: result.data }
}

export async function selfAssignAsPlayeroAction(playasIds: string[]) {
  const result = await selfAssignAsPlayero(playasIds)

  if (result.error) {
    return { success: false, error: result.error }
  }

  revalidatePath('/admin/playeros')
  await revalidateAdminPath()
  await revalidatePlayas()

  return { success: true, data: result.data }
}
