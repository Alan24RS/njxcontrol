'use client'

import { useActionState } from 'react'

import { useRouter } from 'next/navigation'

export default function PlayeroDetailWithPlayasForm({
  playero
}: {
  playero: any
}) {
  const router = useRouter()
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const nuevasPlayas = formData.getAll('playas') as string[]
      const nuevoEstado = formData.get('estado')?.toString() ?? undefined

      // POST to the unified server route which will call updatePlayeroWithPlayas server-side
      const res = await fetch(`/api/playeros/${playero.playero_id}/update`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevasPlayas, nuevoEstado })
      })

      const json = await res.json()
      if (!res.ok)
        return { success: false, error: json.error ?? 'Error inesperado' }
      router.refresh()
      return { success: true }
    },
    { success: false, error: null }
  )

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="block font-medium">Estado general</label>
        <select
          name="estado"
          defaultValue={playero.estado}
          className="rounded border p-2"
        >
          <option value="ACTIVO">Activo</option>
          <option value="SUSPENDIDO">Suspendido</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">Playas asignadas</label>
        {playero.playas.map((pl: any) => (
          <div key={pl.playa_id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="playas"
              value={pl.playa_id}
              defaultChecked={pl.estado === 'ACTIVO'}
            />
            <span>
              {pl.nombre} ({pl.estado})
            </span>
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="bg-primary rounded px-4 py-2 text-white hover:opacity-90"
      >
        Guardar cambios
      </button>

      {state.error && <p className="text-destructive">{state.error}</p>}
      {state.success && (
        <p className="text-green-600">Cambios guardados correctamente.</p>
      )}
    </form>
  )
}
