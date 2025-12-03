'use client'

import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Gateway, Step } from '@/components/ui'
import { type CreateAbonoFormData, createAbonoSchema } from '@/schemas/abono'
import { calculateProratedAmount } from '@/services/abonos/calculateProratedAmount'
import { getTurno } from '@/services/turnos'
import { useSelectedPlaya } from '@/stores'

import { createAbonoAction } from '../../actions'

import { AbonadoStep, PagoStep, PlazaStep } from './steps'

export default function CreateAbonoWizard() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedPlaya } = useSelectedPlaya()

  const form = useForm<CreateAbonoFormData>({
    resolver: zodResolver(createAbonoSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      playaId: selectedPlaya?.id,
      tiposVehiculo: [],
      tipoPlazaId: undefined,
      plazaId: '',
      vehiculos: [],
      montoPago: 0,
      tarifaMensual: 0,
      dni: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      metodoPago: undefined
    }
  })

  useEffect(() => {
    if (selectedPlaya?.id) {
      form.setValue('playaId', selectedPlaya.id)
    }
  }, [selectedPlaya?.id, form])

  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 0:
        const step1Valid = await form.trigger([
          'playaId',
          'tiposVehiculo',
          'tipoPlazaId',
          'plazaId'
        ])

        return step1Valid
      case 1:
        const step2Valid = await form.trigger([
          'dni',
          'nombre',
          'apellido',
          'vehiculos'
        ])
        return step2Valid
      case 2:
        const step3Valid = await form.trigger([
          'metodoPago',
          'montoPago',
          'tarifaMensual'
        ])
        return step3Valid
      default:
        return false
    }
  }

  const handleSubmit = async (data: CreateAbonoFormData) => {
    try {
      setIsSubmitting(true)

      if (!selectedPlaya?.id) {
        toast.error('No hay playa seleccionada')
        return
      }

      const { data: turnoData, error: turnoError } = await getTurno({
        activo: true
      })

      if (turnoError || !turnoData) {
        toast.error('Error al obtener turno activo', {
          description: turnoError || 'No hay un turno activo'
        })
        return
      }

      if (turnoData.playaId !== selectedPlaya.id) {
        toast.error('El turno activo pertenece a otra playa')
        return
      }

      const fechaHoraInicio = new Date()

      const montoProrrateo = calculateProratedAmount(
        data.tarifaMensual,
        fechaHoraInicio
      )

      const result = await createAbonoAction({
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email || undefined,
        telefono: data.telefono || undefined,
        dni: data.dni,
        playaId: data.playaId,
        plazaId: data.plazaId,
        fechaHoraInicio,
        vehiculos: data.vehiculos,
        turnoPlayaId: selectedPlaya.id,
        turnoPlayeroId: turnoData.playeroId,
        turnoFechaHoraIngreso: turnoData.fechaHoraIngreso,
        metodoPago: data.metodoPago,
        montoPago: montoProrrateo
      })

      if (!result.success) {
        toast.error('Error al crear abono', {
          description: result.error
        })
        return
      }

      toast.success('¡Abono creado exitosamente!', {
        description: 'La boleta prorrateada ha sido pagada y registrada'
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['abonos-vigentes'] }),
        queryClient.invalidateQueries({ queryKey: ['plazas'] }),
        queryClient.invalidateQueries({ queryKey: ['tipos-plaza'] })
      ])

      router.push('/admin/abonos')
    } catch (error) {
      console.error('Error creating abono:', error)
      toast.error('Error inesperado', {
        description: 'Ocurrió un error al crear el abono. Intenta nuevamente.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex grow flex-col px-6 sm:px-0">
      <FormProvider {...form}>
        <Gateway
          form={form}
          onSubmit={handleSubmit}
          validateStep={validateStep}
          isSubmitting={isSubmitting}
        >
          <Step
            title="Plaza"
            description="Selecciona los tipos de vehículo, tipo de plaza y plaza específica"
            label="Plaza"
          >
            <PlazaStep />
          </Step>
          <Step
            title="Abonado"
            description="Completa los datos del abonado y sus vehículos"
            label="Abonado"
          >
            <AbonadoStep />
          </Step>
          <Step
            title="Pago"
            description="Confirma los datos y registra el primer pago"
            label="Pago"
          >
            <PagoStep />
          </Step>
        </Gateway>
      </FormProvider>
    </div>
  )
}
