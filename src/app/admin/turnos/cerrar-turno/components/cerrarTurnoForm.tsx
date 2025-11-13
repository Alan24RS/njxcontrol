'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateTurnoAction } from '@/app/admin/turnos/actions'
import {
  Button,
  CurrencyInput,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input
} from '@/components/ui'
import { Spinner } from '@/components/ui/spinner'
import {
  type CerrarTurnoFormData,
  crearCerrarTurnoSchema
} from '@/schemas/turnos'
import { getPlayas } from '@/services/playas/getPlayas'
import { getTurno } from '@/services/turnos'
import { useSelectedPlaya } from '@/stores'

function getCurrentDateTimeLocal() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export default function CerrarTurnoForm() {
  const [loading, setLoading] = useState(false)
  const [horaInicioTurno, setHoraInicioTurno] = useState<string | null>(null)
  const [efectivoInicial, setEfectivoInicial] = useState<number>(0)
  const [buscandoTurno, setBuscandoTurno] = useState(true)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedPlaya, setSelectedPlaya, isLoading } = useSelectedPlaya()
  const formRef = useRef<HTMLFormElement>(null)

  const schema = useMemo(
    () => crearCerrarTurnoSchema(efectivoInicial),
    [efectivoInicial]
  )

  const form = useForm<CerrarTurnoFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha_hora_salida: getCurrentDateTimeLocal(),
      efectivo_final: efectivoInicial > 0 ? undefined : 0
    }
  })

  const { control, handleSubmit, watch, trigger, clearErrors } = form
  const efectivoFinal = watch('efectivo_final') ?? 0
  const diferencia = efectivoFinal - efectivoInicial

  useEffect(() => {
    clearErrors('efectivo_final')
    trigger('efectivo_final')
  }, [efectivoInicial, clearErrors, trigger])

  useEffect(() => {
    const fetchTurnoActivo = async () => {
      if (!selectedPlaya) return
      setBuscandoTurno(true)

      try {
        const response = await getTurno({ activo: true })

        if (response.error) {
          toast.error('Error al verificar turno activo', {
            description: response.error
          })
          setHoraInicioTurno(null)
          return
        }

        const turnoData = response.data

        if (!turnoData) {
          toast.warning('No tienes ningún turno activo para cerrar.')
          setHoraInicioTurno(null)
          return
        }

        if (turnoData.playaId !== selectedPlaya.id) {
          const { data: userPlayas } = await getPlayas({
            select: 'playa_id, nombre, direccion, descripcion',
            limit: 9999
          })
          const playaConTurno = userPlayas?.find(
            (p) => p.id === turnoData.playaId
          )

          if (playaConTurno) {
            toast.info(
              `No hay turno activo en ${selectedPlaya.nombre}. El turno activo pertenece a ${playaConTurno.nombre}.`
            )
            setSelectedPlaya(playaConTurno)
          }
        }

        setHoraInicioTurno(turnoData.fechaHoraIngreso.toISOString())
        setEfectivoInicial(turnoData.efectivoInicial ?? 0)
      } catch (err) {
        console.error(err)
        toast.error('Error al verificar el turno activo.')
        setHoraInicioTurno(null)
        setEfectivoInicial(0)
      } finally {
        setBuscandoTurno(false)
      }
    }

    fetchTurnoActivo()
  }, [selectedPlaya, setSelectedPlaya])

  const onSubmit = async (data: CerrarTurnoFormData) => {
    if (!selectedPlaya) return
    if (!horaInicioTurno) {
      toast.error('No se pudo validar el turno activo.')
      return
    }

    if (
      efectivoInicial > 0 &&
      (data.efectivo_final === undefined || data.efectivo_final === null)
    ) {
      toast.error(
        'El efectivo final es obligatorio cuando se registró efectivo inicial'
      )
      form.setError('efectivo_final', {
        type: 'manual',
        message:
          'El efectivo final es obligatorio cuando se registró efectivo inicial'
      })
      return
    }

    const fechaInicio = new Date(horaInicioTurno)
    const fechaSalidaDate = new Date(data.fecha_hora_salida)

    if (fechaSalidaDate <= fechaInicio) {
      toast.error('La hora de salida debe ser posterior a la hora de ingreso.')
      return
    }

    setLoading(true)
    try {
      const result = await updateTurnoAction({
        playaId: selectedPlaya.id,
        fechaHoraSalida: new Date(data.fecha_hora_salida).toISOString(),
        efectivoFinal: data.efectivo_final
      })

      if (result.error) {
        toast.error('¡No hay turnos activos!', { description: result.error })
      } else {
        toast.success('¡Turno cerrado correctamente!')
        queryClient.invalidateQueries({ queryKey: ['turno-activo'] })
        queryClient.invalidateQueries({ queryKey: ['turnos'] })
        router.push('/admin/turnos')
      }
    } catch (err) {
      console.error(err)
      toast.error('Hubo un problema al cerrar el turno.')
    } finally {
      setLoading(false)
    }
  }
  if (!selectedPlaya || isLoading) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center space-y-4 p-8">
        <Spinner />
        <p className="text-muted-foreground text-sm">
          Cargando playa seleccionada...
        </p>
      </div>
    )
  }
  // Si está cargando o buscando el turno activo
  if (isLoading || buscandoTurno) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center space-y-4 p-8">
        <Spinner />
        <p className="text-muted-foreground text-sm">
          Verificando turno activo...
        </p>
      </div>
    )
  }

  // Si no hay turno activo
  if (!horaInicioTurno) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
        <p className="text-muted-foreground">
          No se encontró ningún turno activo en esta playa.
        </p>
        <Button onClick={() => router.push('/admin/turnos')}>
          Volver a Turnos
        </Button>
      </div>
    )
  }

  // Si hay turno activo: mostrar formulario normalmente
  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
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
        </FormItem>

        <FormItem>
          <FormLabel>Hora de ingreso</FormLabel>
          <div className="caret-neutral-700">
            {new Date(horaInicioTurno).toLocaleString('es-AR', {
              dateStyle: 'short',
              timeStyle: 'short'
            })}
          </div>
        </FormItem>

        <FormField
          control={control}
          name="fecha_hora_salida"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hora de salida</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                  value={
                    typeof field.value === 'string'
                      ? field.value
                      : new Date(field.value).toISOString().slice(0, 16)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {efectivoInicial > 0 && (
          <FormItem>
            <FormLabel>Efectivo inicial</FormLabel>
            <FormControl>
              <Input
                name="efectivo-inicial-display"
                value={new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  minimumFractionDigits: 2
                }).format(efectivoInicial)}
                disabled
                className="bg-muted font-medium"
              />
            </FormControl>
          </FormItem>
        )}

        <FormField
          control={control}
          name="efectivo_final"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Efectivo final
                {efectivoInicial > 0 && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="$ 0,00"
                />
              </FormControl>
              {efectivoInicial > 0 && (
                <p className="text-muted-foreground mt-1 text-xs">
                  Campo obligatorio cuando se registró efectivo inicial
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {efectivoInicial > 0 && efectivoFinal > 0 && (
          <FormItem>
            <FormLabel>Diferencia</FormLabel>
            <FormControl>
              <Input
                name="diferencia-display"
                value={new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  minimumFractionDigits: 2,
                  signDisplay: 'always'
                }).format(diferencia)}
                disabled
                className={`bg-muted font-semibold ${
                  diferencia >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              />
            </FormControl>
            <p className="text-muted-foreground mt-1 text-xs">
              {diferencia >= 0
                ? 'Sobrante de efectivo'
                : 'Faltante de efectivo'}
            </p>
          </FormItem>
        )}

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/turnos')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} loading={loading}>
            Cerrar turno
          </Button>
        </div>
      </form>
    </Form>
  )
}
