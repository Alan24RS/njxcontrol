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
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui'
import { ROL, Role } from '@/constants/rol'
import { useGetTiposPlaza } from '@/hooks/queries/tipos-plaza/getTiposPlaza'
import { updatePlazaFormSchema, type UpdatePlazaRequest } from '@/schemas/plaza'
import { type Plaza } from '@/services/plazas'
import { useSelectedPlaya } from '@/stores'

import { updatePlazaAction } from '../actions'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

type PlazaDetailFormProps = {
  plaza: Plaza
  roles: Role[]
}

export default function PlazaDetailForm({
  plaza,
  roles
}: PlazaDetailFormProps) {
  const isDueno = roles.includes(ROL.DUENO)
  const [formState, formAction, pending] = useActionState(updatePlazaAction, {
    success: false
  } as FormState)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [hasChanges, setHasChanges] = useState(false)
  const { selectedPlaya } = useSelectedPlaya()
  const formRef = useRef<HTMLFormElement>(null)
  const processedSuccessRef = useRef(false)

  const { data: tiposPlazaData } = useGetTiposPlaza(
    { playaId: selectedPlaya?.id },
    { enabled: !!selectedPlaya?.id }
  )

  const defaultValues: UpdatePlazaRequest & { id: string } = useMemo(
    () => ({
      id: plaza.id,
      identificador: plaza.identificador || '',
      tipoPlazaId: plaza.tipoPlazaId.toString(),
      estado: plaza.estado
    }),
    [plaza]
  )

  const form = useForm<UpdatePlazaRequest>({
    resolver: zodResolver(updatePlazaFormSchema),
    defaultValues,
    mode: 'onChange'
  })

  const { control, handleSubmit, reset, watch } = form
  const watchedValues = watch()

  // Observar los valores de los selects para sincronizar con campos ocultos
  const tipoPlazaIdValue = watch('tipoPlazaId')
  const estadoValue = watch('estado')

  useEffect(() => {
    const hasFormChanges = Object.keys(defaultValues).some((key) => {
      if (key === 'id') return false // Ignorar el campo id para cambios
      const currentValue = watchedValues[key as keyof UpdatePlazaRequest]
      const defaultValue =
        defaultValues[key as keyof (UpdatePlazaRequest & { id: string })]
      return currentValue !== defaultValue
    })
    setHasChanges(hasFormChanges)
  }, [watchedValues, defaultValues])

  useEffect(() => {
    if (formState.success && !processedSuccessRef.current) {
      processedSuccessRef.current = true
      toast.success('Plaza actualizada correctamente')
      queryClient.invalidateQueries({ queryKey: ['plazas'] })
      router.push('/admin/plazas')
    } else if (formState.errors) {
      Object.entries(formState.errors).forEach(([field, errors]) => {
        if (field === 'general') {
          toast.error('Error al actualizar la plaza', {
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
  }, [formState.success, formState.errors, router, queryClient])

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
        className="space-y-4"
      >
        {/* Campos ocultos para FormData */}
        <FormControl>
          <Input name="id" type="hidden" value={plaza.id} />
        </FormControl>
        <FormControl>
          <Input
            name="tipoPlazaId"
            type="hidden"
            value={tipoPlazaIdValue || ''}
          />
        </FormControl>
        <FormControl>
          <Input name="estado" type="hidden" value={estadoValue || ''} />
        </FormControl>
        <FormField
          control={control}
          name="identificador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identificador</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: A-01, B-15, etc."
                  {...field}
                  value={field.value || ''}
                  disabled={!isDueno}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="tipoPlazaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Plaza</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!isDueno}
              >
                <FormControl>
                  <SelectTrigger name={field.name}>
                    <SelectValue placeholder="Seleccionar tipo de plaza" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiposPlazaData?.data?.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="estado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!isDueno}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex w-fit gap-2 pt-4">
          {isDueno && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={pending || !hasChanges}
              className="flex-1"
            >
              Deshacer cambios
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/plazas')}
          >
            {isDueno ? 'Cancelar' : 'Volver'}
          </Button>
          {isDueno && (
            <Button
              type="submit"
              disabled={!hasChanges || pending}
              className="flex-1"
              loading={pending}
            >
              Guardar
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
