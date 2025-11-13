'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { Link } from 'next-view-transitions'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { createPlazaAction } from '@/app/admin/plazas/actions'
import {
  Alert,
  AlertDescription,
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
import { Spinner } from '@/components/ui/spinner'
import { PLAZA_ESTADO } from '@/constants/plazaEstado'
import { useGetTiposPlaza } from '@/hooks/queries/tipos-plaza/getTiposPlaza'
import { CreatePlazaRequest, createPlazaSchema } from '@/schemas/plaza'
import { useSelectedPlaya } from '@/stores'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export default function CreatePlazaForm() {
  const [formState, formAction, pending] = useActionState(createPlazaAction, {
    success: false
  } as FormState)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedPlaya, isLoading: isPlayaLoading } = useSelectedPlaya()

  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<CreatePlazaRequest>({
    resolver: zodResolver(createPlazaSchema),
    defaultValues: {
      playaId: selectedPlaya?.id || '',
      tipoPlazaId: 0,
      estado: PLAZA_ESTADO.ACTIVO,
      identificador: ''
    }
  })

  // Obtener tipos de plaza para la playa seleccionada
  const { data: tiposPlazaResponse, isLoading: isLoadingTipos } =
    useGetTiposPlaza({
      playaId: selectedPlaya?.id || '',
      limit: 100
    })

  const tiposPlaza = tiposPlazaResponse?.data || []

  // Actualizar playaId cuando cambie la playa seleccionada
  useEffect(() => {
    if (selectedPlaya?.id) {
      form.setValue('playaId', selectedPlaya.id)
    }
  }, [selectedPlaya?.id, form])

  useEffect(() => {
    if (formState.success) {
      // Invalidar las queries de plazas para refrescar la tabla
      queryClient.invalidateQueries({
        queryKey: ['plazas']
      })
      toast.success('Plaza creada correctamente')
      router.push('/admin/plazas')
    } else if (formState.errors) {
      // Mostrar errores de validación
      Object.entries(formState.errors).forEach(([field, errors]) => {
        if (field === 'general') {
          toast.error('Error', {
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
  }, [formState, router, queryClient])

  const { control, handleSubmit } = form

  // Loading state mientras se carga la playa seleccionada
  if (isPlayaLoading || isLoadingTipos) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Spinner />
          <span className="text-muted-foreground text-sm">
            Cargando información de la playa...
          </span>
        </div>
      </div>
    )
  }

  // No hay playa seleccionada
  if (!selectedPlaya) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Debes seleccionar una playa desde el sidebar para poder crear plazas.
        </AlertDescription>
      </Alert>
    )
  }

  // No hay tipos de plaza disponibles
  if (!isLoadingTipos && tiposPlaza.length === 0) {
    return (
      <Alert variant="destructive" className="bg-destructive/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="space-y-4">
          <p>
            No hay tipos de plaza disponibles para{' '}
            <strong>{selectedPlaya.nombre || selectedPlaya.direccion}</strong>.
            Es necesario crear al menos un tipo de plaza antes de poder crear
            plazas individuales.
          </p>
          <Link
            href="/admin/tipos-plaza/nuevo"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Crear tipo de plaza
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Form {...form}>
      <form
        ref={formRef}
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
        {/* Hidden fields controlados por react-hook-form */}
        <FormField
          control={control}
          name="playaId"
          render={({ field }) => <input type="hidden" {...field} />}
        />

        <FormField
          control={control}
          name="tipoPlazaId"
          render={({ field }) => (
            <input type="hidden" name="tipoPlazaId" value={field.value} />
          )}
        />

        <FormField
          control={control}
          name="estado"
          render={({ field }) => (
            <input type="hidden" name="estado" value={field.value} />
          )}
        />

        {/* Campo de playa deshabilitado para mostrar cual está seleccionada */}
        <FormItem>
          <FormLabel>Playa</FormLabel>
          <FormControl>
            <Input
              name="playa-display"
              value={selectedPlaya.nombre || selectedPlaya.direccion}
              disabled
              className="bg-muted"
            />
          </FormControl>
          <p className="text-muted-foreground text-sm">
            La playa se selecciona desde el panel lateral
          </p>
        </FormItem>

        <FormField
          control={control}
          name="tipoPlazaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de plaza</FormLabel>
              <Select
                name={field.name}
                value={field.value === 0 ? '' : field.value.toString()}
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={isLoadingTipos}
              >
                <FormControl>
                  <SelectTrigger className="w-full" name={field.name}>
                    <SelectValue
                      placeholder={
                        isLoadingTipos
                          ? 'Cargando tipos de plaza...'
                          : 'Selecciona un tipo de plaza'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingTipos ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Spinner />
                        Cargando tipos de plaza...
                      </div>
                    </SelectItem>
                  ) : tiposPlaza.length > 0 ? (
                    tiposPlaza.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {tipo.nombre}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-types" disabled>
                      No hay tipos de plaza disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="identificador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identificador (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: A1, B2, Plaza 001"
                  type="text"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-muted-foreground text-sm">
                Puedes usar este campo para identificar fácilmente la plaza
                (número, zona, etc.)
              </p>
            </FormItem>
          )}
        />

        <div className="mt-8 flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/plazas')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Creando...' : 'Crear plaza'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
