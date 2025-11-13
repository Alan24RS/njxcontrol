'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import Fieldset from '@/app/admin/playas/nueva/components/CreatePlayaForm/Fieldset'
import { Button, Form, FormControl, FormField, Input } from '@/components/ui'
import { type UpdatePlayaFormRequest, updatePlayaSchema } from '@/schemas/playa'
import type { Playa } from '@/services/playas/types'
import { useSelectedPlaya } from '@/stores'

import { updatePlayaAction } from '../actions'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

interface PlayaDetailFormProps {
  playa: Playa
}

export default function PlayaDetailForm({ playa }: PlayaDetailFormProps) {
  const [formState, formAction, pending] = useActionState(updatePlayaAction, {
    success: false
  } as FormState)
  const [hasChanges, setHasChanges] = useState(false)
  const router = useRouter()
  const { selectedPlaya, updateSelectedPlaya } = useSelectedPlaya()
  const formRef = useRef<HTMLFormElement>(null)
  const processedSuccessRef = useRef(false)

  const defaultValues: UpdatePlayaFormRequest = useMemo(
    () => ({
      id: playa.id,
      nombre: playa.nombre || '',
      descripcion: playa.descripcion || '',
      displayAddress: `${playa.direccion}, ${playa.ciudadNombre}, ${playa.ciudadProvincia}`,
      direccion: playa.direccion,
      ciudad: playa.ciudadNombre || '',
      provincia: playa.ciudadProvincia || '',
      latitud: playa.latitud || 0,
      longitud: playa.longitud || 0,
      horario: playa.horario
    }),
    [playa]
  )

  const form = useForm<UpdatePlayaFormRequest>({
    resolver: zodResolver(updatePlayaSchema),
    defaultValues,
    mode: 'onChange'
  })

  const { control, handleSubmit, reset, watch } = form
  const watchedValues = watch()

  useEffect(() => {
    const hasFormChanges = Object.keys(defaultValues).some((key) => {
      const currentValue = watchedValues[key as keyof UpdatePlayaFormRequest]
      const defaultValue = defaultValues[key as keyof UpdatePlayaFormRequest]
      return currentValue !== defaultValue
    })
    setHasChanges(hasFormChanges)
  }, [watchedValues, defaultValues])

  useEffect(() => {
    if (formState.success && !processedSuccessRef.current) {
      processedSuccessRef.current = true
      toast.success('Playa actualizada exitosamente')

      // Si la playa editada es la playa seleccionada actualmente, actualizarla en el store
      if (selectedPlaya && selectedPlaya.id === playa.id) {
        const formData = new FormData(formRef.current!)
        updateSelectedPlaya({
          nombre: (formData.get('nombre') as string) || null,
          descripcion: formData.get('descripcion') as string,
          direccion: formData.get('direccion') as string
        })
      }

      router.refresh()
      router.push('/admin/playas')
    } else if (formState.errors) {
      Object.entries(formState.errors).forEach(([field, errors]) => {
        if (field === 'general') {
          toast.error('Error al actualizar la playa', {
            description: errors.join(', '),
            duration: 6000
          })
        } else {
          errors.forEach((error) => {
            toast.error(`Error en ${field}`, {
              description: error,
              duration: 5000
            })
          })
        }
      })
    }
  }, [
    formState.success,
    formState.errors,
    router,
    selectedPlaya,
    playa.id,
    updateSelectedPlaya
  ])

  const handleReset = () => {
    reset(defaultValues)
    setHasChanges(false)
  }

  return (
    <Form {...form}>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={(evt) => {
          evt.preventDefault()
          handleSubmit(() => {
            startTransition(() => {
              formAction(new FormData(formRef.current!))
            })
          })(evt)
        }}
        className="space-y-6"
      >
        {/* Campo ID oculto */}
        <FormField
          control={control}
          name="id"
          render={({ field }) => (
            <FormControl>
              <Input {...field} type="hidden" />
            </FormControl>
          )}
        />

        {/* Reutilizar el Fieldset existente */}
        <Fieldset />

        {/* Botones de acción */}
        <div className="flex w-fit gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={pending || !hasChanges}
            className="flex-1"
          >
            Deshacer cambios
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/playas')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!hasChanges || pending}
            className="flex items-center gap-2"
            loading={pending}
          >
            Guardar
          </Button>
        </div>
      </form>
    </Form>
  )
}
