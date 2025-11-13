'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { Building2 } from 'lucide-react'
import { toast } from 'sonner'
import * as z from 'zod'

import AssignPlayasDialog from '@/app/admin/playeros/[playeroId]/components/AssignPlayasDialog'
import ChangePlayaEstadoDialog from '@/app/admin/playeros/[playeroId]/components/ChangePlayaEstadoDialog'
import { updatePlayeroAction } from '@/app/admin/playeros/actions'
import { Button, Input } from '@/components/ui'
import { formatDate } from '@/utils/formatUtils'

import UnlinkPlayasDialog from '../UnlinkPlayasDialog'

import 'react-phone-number-input/style.css'

type PlayeroDetailData = {
  playero_id: string
  nombre: string
  email: string
  telefono: string | null
  estado_global: string
  fecha_alta: string
  fecha_modificacion?: string | null
  playas_total?: number
  playas: Array<{
    playa_id: string
    playa_nombre: string
    playa_direccion: string
    horario?: string | null
    estado: string
    fecha_creacion: string
  }>
}

interface Props {
  playeroData: PlayeroDetailData
}

const playeroSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(255)
    .transform((s) => s.trim()),
  telefono: z.string().nullable().optional()
})

type PlayeroFormValues = z.infer<typeof playeroSchema>

export default function PlayeroDetailContent({ playeroData }: Props) {
  const router = useRouter()
  // local editable copy of the playero; changes are staged here until Save
  // keep as lightweight staging for playas/estados; nombre/telefono serán
  // gestionados por react-hook-form como fuente de verdad para evitar duplicación
  const [localPlayero, setLocalPlayero] = useState<PlayeroDetailData>(
    structuredClone(playeroData)
  )
  // form para nombre/telefono: valida localmente con zod, sigue patrón de PlayaDetail
  const form = useForm<PlayeroFormValues>({
    resolver: zodResolver(playeroSchema),
    defaultValues: {
      nombre: playeroData.nombre || '',
      telefono: playeroData.telefono ?? null
    },
    mode: 'onChange'
  })
  const { handleSubmit, reset, formState } = form
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false)
  const [selectedPlayas, setSelectedPlayas] = useState<string[]>([])
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedPlayasToAdd, setSelectedPlayasToAdd] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showChangeEstadoDialog, setShowChangeEstadoDialog] = useState(false)
  const [selectedPlayaForEstado, setSelectedPlayaForEstado] = useState<{
    playaId: string
    nombre: string
    estado: string
  } | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // focus name field when component mounts if desired
    nameInputRef.current?.focus()
  }, [])

  // If the server-provided playeroData changes (for example after router.refresh()),
  // sync the local editable copy so the UI reflects server state (estado, playas, etc).
  useEffect(() => {
    setLocalPlayero(structuredClone(playeroData))
    // reset form values when server data changes
    reset({
      nombre: playeroData.nombre || '',
      telefono: playeroData.telefono ?? null
    })
  }, [playeroData, reset])

  const SIN_NOMBRE = 'Sin nombre'

  // Memoize comparison of playas ids and estados to avoid recomputing on every render
  const hasPlayasOrEstadoChanges = useMemo(() => {
    try {
      const orig = playeroData.playas || []
      const local = localPlayero.playas || []

      if (orig.length !== local.length) return true

      // Create maps for O(n) comparisons
      const origEstadoMap = new Map(
        orig.map((p) => [String(p.playa_id), p.estado])
      )
      for (const p of local) {
        const id = String(p.playa_id)
        const origEstado = origEstadoMap.get(id)
        if (typeof origEstado === 'undefined') return true
        if (p.estado !== origEstado) return true
      }
      return false
    } catch {
      return true
    }
  }, [playeroData.playas, localPlayero.playas])

  const hasChanges = Boolean(formState.isDirty) || hasPlayasOrEstadoChanges

  const handleUnlink = async () => {
    if (selectedPlayas.length === 0) {
      toast.error('Selecciona al menos una playa')
      return
    }
    // Stage unlink locally: remove selected playas from the editable local state.
    // Persistence will happen when the user clicks "Guardar cambios".
    setIsUnlinking(true)
    try {
      setLocalPlayero((prev) => ({
        ...prev,
        playas: prev.playas.filter((p) => !selectedPlayas.includes(p.playa_id))
      }))

      setShowUnlinkDialog(false)
      setSelectedPlayas([])
      toast.success(
        'Desvinculación aplicada. Guardá los cambios para confirmar.'
      )
    } catch (error) {
      console.error('Error staging unlink playas:', error)
      toast.error('Error inesperado al aplicar desvinculación localmente')
    } finally {
      setIsUnlinking(false)
    }
  }

  const estadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'text-green-700'
      case 'SUSPENDIDO':
        return 'text-yellow-700'
      default:
        return 'text-gray-700'
    }
  }

  return (
    <div>
      {/* Encabezado con nombre y email */}
      <header className="flex flex-col items-start justify-between gap-4 border-b pb-6 md:flex-row">
        <div className="w-full md:max-w-3xl">
          <div className="space-y-2">
            <Controller
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <div className="relative inline-block max-w-full min-w-[150px]">
                  <span
                    className="invisible absolute px-3 py-2 text-3xl font-bold whitespace-pre md:text-4xl"
                    aria-hidden="true"
                  >
                    {field.value || 'Nombre del playero'}
                  </span>
                  <Input
                    {...field}
                    className="border-input bg-background hover:border-primary focus:border-primary w-full rounded-md border px-3 py-2 text-3xl font-bold transition-colors md:text-4xl"
                    placeholder="Nombre del playero"
                  />
                </div>
              )}
            />

            <p className="text-muted-foreground mt-1 text-base italic">
              {localPlayero.email}
            </p>
          </div>
        </div>

        <div className="mt-2 md:mt-0">
          <span
            className={`font-bold ${estadoColor(playeroData.estado_global)}`}
          >
            {playeroData.estado_global}
          </span>
        </div>
      </header>

      {/* Información personal: los campos editables aparecen dentro de este box (como un form) */}
      <section className="dark:bg-muted/30 border-muted/40 mb-6 rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="text-foreground mb-4 text-2xl font-semibold">
          Información personal
        </h2>

        <div className="flex items-start justify-between">
          {/* Teléfono - fijo a la izquierda */}
          <div>
            <label className="text-muted-foreground mb-1 block text-sm font-medium">
              Teléfono
            </label>
            <div className="mt-1 w-52">
              <Controller
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <PhoneInput
                    international={false}
                    defaultCountry="AR"
                    value={field.value ?? localPlayero.telefono ?? undefined}
                    onChange={(value) => {
                      const v = value ?? null
                      field.onChange(v)
                      setLocalPlayero((prev) => ({ ...prev, telefono: v }))
                    }}
                    className="border-input hover:border-primary focus-within:border-primary rounded-md border transition-colors"
                  />
                )}
              />
            </div>
          </div>

          {/* Fechas - distribuidas equitativamente */}
          <div className="flex flex-1 flex-row justify-evenly">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Fecha de alta
              </p>
              <p className="text-foreground mt-1 font-medium">
                {formatDate(playeroData.fecha_alta)}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Última modificación
              </p>
              <p className="text-foreground mt-1 font-medium">
                {playeroData.fecha_modificacion
                  ? formatDate(playeroData.fecha_modificacion)
                  : 'Sin registros'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de playas: tabla con columnas Nombre, Dirección, Horario, Estado */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-primary h-5 w-5" />
            <h2 className="text-foreground text-2xl font-semibold">
              Playas asignadas
            </h2>
            <span className="bg-muted/10 text-muted-foreground ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 align-middle text-base leading-none font-medium">
              {typeof playeroData.playas_total === 'number'
                ? playeroData.playas_total
                : localPlayero.playas.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setShowAddDialog(true)} disabled={isSaving}>
              Asignar nueva playa
            </Button>
            <Button
              onClick={() => setShowUnlinkDialog(true)}
              disabled={isUnlinking}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Desvincular playa
            </Button>
          </div>
        </div>

        {localPlayero.playas.length > 0 ? (
          <div className="overflow-auto rounded-2xl border bg-white/70 p-4 shadow-sm">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-muted-foreground text-left text-sm">
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Dirección</th>
                  <th className="px-3 py-2">Horario</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {localPlayero.playas.map((playa) => (
                  <tr
                    key={playa.playa_id}
                    className="hover:bg-muted/5 cursor-pointer border-t last:border-b"
                    onClick={() => {
                      setSelectedPlayaForEstado({
                        playaId: playa.playa_id,
                        nombre: playa.playa_nombre,
                        estado: playa.estado
                      })
                      setShowChangeEstadoDialog(true)
                    }}
                  >
                    <td className="px-3 py-3 align-top">
                      <div className="text-foreground font-medium">
                        {playa.playa_nombre ?? SIN_NOMBRE}
                      </div>
                    </td>
                    <td className="text-muted-foreground px-3 py-3 align-top text-sm">
                      {playa.playa_direccion ?? ''}
                    </td>
                    <td className="text-muted-foreground px-3 py-3 align-top text-sm">
                      {playa.horario ? (
                        <span className="text-muted-foreground">
                          {playa.horario}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {SIN_NOMBRE}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top text-sm">
                      <span
                        className={`font-semibold ${estadoColor(playa.estado)}`}
                      >
                        {playa.estado?.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground bg-muted/20 rounded-xl py-6 text-center italic">
            No hay playas asignadas actualmente.
          </p>
        )}
      </section>

      {/* Gestión de accesos movida arriba junto al título de la sección */}

      {/* Dialog para asignar playas (nuevo - misma estética que desvincular) */}
      <AssignPlayasDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        selectedPlayas={selectedPlayasToAdd}
        onSelectedPlayasChange={(items: any[]) => setSelectedPlayasToAdd(items)}
        onConfirm={() => {
          // Build placeholders using any available metadata from the selected items
          const normalizeItem = (p: any) => {
            if (!p) return null
            if (typeof p === 'string') {
              return { id: String(p), nombre: String(p) }
            }

            const id = String(p?.playa_id ?? p?.value ?? p?.id ?? '')
            // Prefer explicit name fields; if none present leave null and
            // later default to '(sin nombre)' to be consistent with the app
            const nombre =
              p?.playa_nombre ?? p?.nombre ?? p?.label ?? p?.name ?? null
            const direccion = p?.playa_direccion || p?.direccion || ''
            const horario = p?.horario ?? p?.playa?.horario ?? null

            return { id, nombre, direccion, horario }
          }

          const items = (selectedPlayasToAdd || [])
            .map(normalizeItem)
            .filter(Boolean)

          if (items.length === 0) {
            toast.error('Seleccioná al menos una playa')
            return
          }

          const nuevas = items.map((it: any) => ({
            playa_id: it.id,
            playa_nombre: it.nombre ?? '(sin nombre)',
            playa_direccion: it.direccion || '',
            horario: it.horario ?? null,
            estado: 'ACTIVO',
            fecha_creacion: new Date().toISOString()
          }))

          setLocalPlayero((prev) => ({
            ...prev,
            playas: [...prev.playas, ...nuevas]
          }))
          setSelectedPlayasToAdd([])
          setShowAddDialog(false)
        }}
        isLoading={isSaving}
        playeroNombre={playeroData.nombre}
        assignedPlayas={localPlayero.playas.map((p) => p.playa_id)}
      />

      {/* Acción global: Deshacer / Cancelar / Guardar */}
      <div className="flex w-fit gap-2 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            // Deshacer cambios locales: resetear el estado local y el formulario
            setLocalPlayero(structuredClone(playeroData))
            setSelectedPlayasToAdd([])
            setSelectedPlayas([])
            setShowAddDialog(false)
            setShowUnlinkDialog(false)
            // reset react-hook-form to server values
            reset({
              nombre: playeroData.nombre || '',
              telefono: playeroData.telefono ?? null
            })
          }}
          disabled={!hasChanges}
        >
          Deshacer cambios
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/playeros')}
        >
          Cancelar
        </Button>

        <Button
          type="button"
          disabled={!hasChanges || isSaving}
          loading={isSaving}
          onClick={handleSubmit(async (values) => {
            // Guardar cambios: enviar una sola petición con nombre/telefono y la lista final de playas
            const finalPlayas = (localPlayero.playas || [])
              .map((p) =>
                typeof p === 'string' ? p : String(p?.playa_id ?? '')
              )
              .map((x) => x.trim())
              .filter((x) => Boolean(x) && x !== 'undefined' && x !== 'null')

            const playasWithEstado = (localPlayero.playas || [])
              .map((p) => ({
                playa_id: String(p.playa_id),
                estado: p.estado ?? 'ACTIVO'
              }))
              .filter((x) => Boolean(x.playa_id))

            // Validate phone number again if present
            if (values.telefono && !isValidPhoneNumber(values.telefono)) {
              toast.error(
                'El número de teléfono no es válido para el país seleccionado'
              )
              return
            }

            try {
              setIsSaving(true)
              const result = await updatePlayeroAction({
                playeroId: playeroData.playero_id,
                nuevasPlayas: finalPlayas,
                playas: playasWithEstado,
                nuevoNombre: values.nombre,
                nuevoTelefono: values.telefono ?? null
              })

              if (result.success) {
                toast.success('Playa actualizada exitosamente')
                router.refresh()
                router.push('/admin/playeros')
              } else {
                toast.error(result.error || 'Error al guardar cambios')
              }
            } catch (err: any) {
              console.error(err)
              toast.error('Error inesperado al guardar cambios')
            } finally {
              setIsSaving(false)
            }
          })}
        >
          Guardar
        </Button>
      </div>

      <UnlinkPlayasDialog
        open={showUnlinkDialog}
        onOpenChange={setShowUnlinkDialog}
        playas={localPlayero.playas.map((p) => ({
          ...p,
          fecha_asignacion: p.fecha_creacion
        }))}
        selectedPlayas={selectedPlayas}
        onSelectedPlayasChange={setSelectedPlayas}
        onConfirm={handleUnlink}
        isLoading={isUnlinking}
        playeroNombre={playeroData.nombre}
      />

      <ChangePlayaEstadoDialog
        open={showChangeEstadoDialog}
        onOpenChange={setShowChangeEstadoDialog}
        playeroId={playeroData.playero_id}
        playaId={selectedPlayaForEstado?.playaId ?? ''}
        playaNombre={selectedPlayaForEstado?.nombre ?? ''}
        currentEstado={selectedPlayaForEstado?.estado ?? 'ACTIVO'}
        playeroNombre={playeroData.nombre}
        onSuccess={(nuevoEstado: string) => {
          // Stage the estado change locally for the selected playa
          setLocalPlayero((prev) => ({
            ...prev,
            playas: prev.playas.map((p) =>
              p.playa_id === (selectedPlayaForEstado?.playaId ?? '')
                ? { ...p, estado: nuevoEstado }
                : p
            )
          }))
        }}
      />
    </div>
  )
}
