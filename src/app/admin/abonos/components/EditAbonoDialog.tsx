'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Info } from 'lucide-react'

import { getAbonoByIdAction } from '@/app/admin/abonos/queries'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import { useUpdateAbono } from '@/hooks/mutations/abonos'
import { useGetPlazas } from '@/hooks/queries/plazas/getPlazas'
import { type UpdateAbonoFormData, updateAbonoSchema } from '@/schemas/abono'

interface EditAbonoDialogProps {
  playaId: string
  plazaId: string
  fechaHoraInicio: string
  isOpen: boolean
  onClose: () => void
}

export default function EditAbonoDialog({
  playaId,
  plazaId,
  fechaHoraInicio,
  isOpen,
  onClose
}: EditAbonoDialogProps) {
  const updateAbonoMutation = useUpdateAbono()

  const { data: abonoResponse, isLoading: isLoadingAbono } = useQuery({
    queryKey: ['abono', playaId, plazaId, fechaHoraInicio],
    queryFn: async () => {
      const result = await getAbonoByIdAction(playaId, plazaId, fechaHoraInicio)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: isOpen
  })

  const { data: plazasResponse } = useGetPlazas(
    {
      playaId,
      estado: 'ACTIVO',
      onlyAvailable: false,
      limit: 100
    },
    {
      enabled: isOpen
    }
  )

  const { data: plazasDisponiblesResponse } = useGetPlazas(
    {
      playaId,
      estado: 'ACTIVO',
      onlyAvailable: true,
      limit: 100
    },
    {
      enabled: isOpen
    }
  )

  const plazasDisponibles = useMemo(() => {
    if (!plazasResponse?.data) return []

    const plazasDisponibles = plazasDisponiblesResponse?.data || []
    const plazaActual = plazasResponse.data.find((p) => p.id === plazaId)

    if (plazaActual && !plazasDisponibles.some((p) => p.id === plazaId)) {
      return [plazaActual, ...plazasDisponibles]
    }

    return plazasDisponibles
  }, [plazasResponse?.data, plazasDisponiblesResponse?.data, plazaId])

  const form = useForm<UpdateAbonoFormData>({
    resolver: zodResolver(updateAbonoSchema),
    defaultValues: {
      playaId,
      plazaId,
      fechaHoraInicio,
      nuevaPatente: null,
      nuevoTipoVehiculo: null,
      nuevaPlazaId: null,
      observaciones: null
    }
  })

  const watchPatente = form.watch('nuevaPatente')
  const watchTipoVehiculo = form.watch('nuevoTipoVehiculo')
  const patenteOriginal = abonoResponse?.vehiculos[0]?.patente
  const tipoVehiculoOriginal = abonoResponse?.vehiculos[0]?.tipoVehiculo

  useEffect(() => {
    if (abonoResponse) {
      const vehiculoActual = abonoResponse.vehiculos[0]
      form.reset({
        playaId,
        plazaId,
        fechaHoraInicio,
        nuevaPatente: vehiculoActual?.patente || null,
        nuevoTipoVehiculo:
          (vehiculoActual?.tipoVehiculo as
            | 'AUTOMOVIL'
            | 'MOTOCICLETA'
            | 'CAMIONETA') || null,
        nuevaPlazaId: null,
        observaciones: abonoResponse.observaciones || null
      })
    }
  }, [abonoResponse, playaId, plazaId, fechaHoraInicio, form])

  const hayCambioVehiculo = useMemo(() => {
    if (!patenteOriginal || !tipoVehiculoOriginal) return false

    const patenteCambio =
      watchPatente && watchPatente !== '' && watchPatente !== patenteOriginal
    const tipoCambio =
      watchTipoVehiculo && watchTipoVehiculo !== tipoVehiculoOriginal

    return patenteCambio || tipoCambio
  }, [watchPatente, watchTipoVehiculo, patenteOriginal, tipoVehiculoOriginal])

  const onSubmit = async (data: UpdateAbonoFormData) => {
    try {
      await updateAbonoMutation.mutateAsync({
        playaId: data.playaId,
        plazaId: data.plazaId,
        fechaHoraInicio: data.fechaHoraInicio,
        nuevaPatente:
          data.nuevaPatente && data.nuevaPatente !== ''
            ? data.nuevaPatente
            : undefined,
        nuevoTipoVehiculo: data.nuevoTipoVehiculo || undefined,
        nuevaPlazaId:
          data.nuevaPlazaId && data.nuevaPlazaId !== ''
            ? data.nuevaPlazaId
            : undefined,
        observaciones:
          data.observaciones && data.observaciones !== ''
            ? data.observaciones
            : undefined
      })

      onClose()
    } catch (error) {
      console.error('Error al actualizar abono:', error)
    }
  }

  if (isLoadingAbono) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar abono</DialogTitle>
            <DialogDescription>
              Cargando información del abono...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!abonoResponse) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar abono</DialogTitle>
            <DialogDescription>
              No se pudo cargar la información del abono
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No se pudo cargar la información del abono
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar abono</DialogTitle>
          <DialogDescription>
            Modifica los detalles del abono activo. Los cambios se aplicarán
            inmediatamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-muted/50 space-y-3 rounded-lg border p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Cliente
                  </label>
                  <p className="text-sm font-medium">
                    {abonoResponse.abonadoNombre}{' '}
                    {abonoResponse.abonadoApellido}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    DNI: {abonoResponse.abonadoDni}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Fecha de inicio
                  </label>
                  <p className="text-sm font-medium">
                    {abonoResponse.fechaHoraInicio.toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Fecha de fin
                  </label>
                  <p className="text-sm font-medium">
                    {abonoResponse.fechaFin
                      ? abonoResponse.fechaFin.toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Sin fecha límite'}
                  </p>
                </div>
              </div>
            </div>

            {hayCambioVehiculo && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Nota: Al cambiar el vehículo, el precio mensual se actualizará
                  a la tarifa vigente.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nuevaPatente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva patente (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ABC123"
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(
                            e.target.value ? e.target.value.toUpperCase() : null
                          )
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nuevoTipoVehiculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de vehículo</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(
                          value as 'AUTOMOVIL' | 'MOTOCICLETA' | 'CAMIONETA'
                        )
                      }
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AUTOMOVIL">
                          {TIPO_VEHICULO_LABEL.AUTOMOVIL}
                        </SelectItem>
                        <SelectItem value="MOTOCICLETA">
                          {TIPO_VEHICULO_LABEL.MOTOCICLETA}
                        </SelectItem>
                        <SelectItem value="CAMIONETA">
                          {TIPO_VEHICULO_LABEL.CAMIONETA}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nuevaPlazaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva plaza (opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin cambiar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plazasDisponibles.map((plaza) => (
                        <SelectItem key={plaza.id} value={plaza.id}>
                          {plaza.identificador} - {plaza.tipoPlaza?.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Notas sobre los cambios realizados..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateAbonoMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateAbonoMutation.isPending}>
                {updateAbonoMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
