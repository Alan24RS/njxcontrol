import { updatePlayeroAction } from '@/app/admin/playeros/actions'

export type UpdatePlayeroPayload = {
  nuevasPlayas: string[]
  playas: Array<{ playa_id: string; estado: string }>
  nuevoNombre: string
  nuevoTelefono: string | null
}

export async function updatePlayero(
  playeroId: string,
  payload: UpdatePlayeroPayload
) {
  const result = await updatePlayeroAction({
    playeroId,
    ...payload
  })

  if (!result.success) {
    throw new Error(result.error || 'Error updating playero')
  }

  return result
}
