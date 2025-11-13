'use client'

import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { PartyPopper } from 'lucide-react'
import { toast } from 'sonner'

import { DEFAULT_VALUES as PLAYA_DEFAULT_VALUES } from '@/app/admin/playas/nueva/components/CreatePlayaForm'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  Gateway,
  Step
} from '@/components/ui'
import { useGetCaracteristicas } from '@/hooks/queries/caracteristicas/getCaracteristicas'
import { useIsMobile } from '@/hooks/useMobile'
import { useRevalidateCache } from '@/hooks/useRevalidateCache'
import {
  type WelcomeSetupFormData,
  welcomeSetupSchema
} from '@/schemas/welcome-setup'
import { createCompleteSetup } from '@/services/welcome-setup'
import { useSelectedPlaya } from '@/stores'

import InitialMessage from './components/InitialMessage'
import SuccessMessage from './components/SuccessMessage'
import {
  MetodosPagoStep,
  PlayaStep,
  PlazasStep,
  SummaryStep,
  TarifasStep,
  TiposPlazaStep
} from './steps'

interface CompletePlayaSetupModalProps {
  userName: string
  isOpen: boolean
  onClose?: () => void
  mode?: 'welcome' | 'create'
  title?: string
  description?: string
}

export default function CompletePlayaSetupModal({
  userName,
  isOpen,
  onClose,
  mode = 'welcome',
  title,
  description
}: CompletePlayaSetupModalProps) {
  const [isStarted, setIsStarted] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [_, setCreatedPlayaId] = useState<string | null>(null)
  const [internalOpen, setInternalOpen] = useState(false)
  const isMobile = useIsMobile()
  const router = useRouter()
  const { revalidate } = useRevalidateCache()
  const { clearSelectedPlaya, setSelectedPlaya } = useSelectedPlaya()

  // Solo obtener características cuando el modal esté abierto
  const { data: caracteristicasResult, isLoading: isLoadingCaracteristicas } =
    useGetCaracteristicas({
      enabled: isOpen || internalOpen
    })

  const form = useForm<WelcomeSetupFormData>({
    resolver: zodResolver(welcomeSetupSchema) as any,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      playa: PLAYA_DEFAULT_VALUES,
      tiposPlaza: [],
      tarifas: [],
      plazas: [],
      metodosPago: []
    }
  })

  const { reset } = form

  // Extraer características del resultado
  const caracteristicas = caracteristicasResult?.data || []

  // Sincronizar estado interno con prop isOpen
  useEffect(() => {
    if (mode === 'welcome') {
      // En modo welcome, una vez abierto, mantener abierto hasta terminar
      if (isOpen && !internalOpen) {
        setInternalOpen(true)
      }
      // NO cerrar automáticamente cuando isOpen se vuelve false
      // Solo cerrar cuando el usuario termine explícitamente
    } else {
      // En modo create, seguir el prop isOpen
      setInternalOpen(isOpen)
    }
  }, [isOpen, mode, internalOpen])

  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 0: // Paso 1: Datos básicos de la playa (OBLIGATORIO)
        const playaValid = await form.trigger('playa')
        return playaValid
      case 1: // Paso 2: Tipos de plaza (OPCIONAL)
        return true // Siempre válido porque es opcional
      case 2: // Paso 3: Tarifas (OPCIONAL, requiere tipos de plaza si se completa)
        const tarifas = form.watch('tarifas') || []
        if (tarifas.length > 0) {
          const tarifasValid = await form.trigger('tarifas')
          return tarifasValid
        }
        return true // Válido si está vacío (opcional)
      case 3: // Paso 4: Plazas (OPCIONAL, requiere tipos de plaza si se completa)
        const plazas = form.watch('plazas') || []
        if (plazas.length > 0) {
          const plazasValid = await form.trigger('plazas')
          return plazasValid
        }
        return true // Válido si está vacío (opcional)
      case 4: // Paso 5: Métodos de pago (OPCIONAL)
        return true // Siempre válido porque es opcional
      case 5: // Paso 6: Resumen
        return true
      default:
        return false
    }
  }

  const handleSubmit = async (data: WelcomeSetupFormData) => {
    try {
      setIsSubmitting(true)
      const result = await createCompleteSetup(data)

      if (result.error) {
        toast.error('Error al crear la configuración', {
          description: result.error
        })
        return
      }

      if (result.success && result.playaId) {
        toast.success('¡Playa creada exitosamente!')
        setCreatedPlayaId(result.playaId)
        setIsSuccess(true)

        // Si es modo welcome (usuario sin playas), seleccionar automáticamente la nueva playa
        if (mode === 'welcome') {
          // Limpiar la playa seleccionada anterior (si había alguna)
          clearSelectedPlaya()

          // Crear objeto temporal de la nueva playa para seleccionarla
          const newPlaya = {
            id: result.playaId,
            nombre: data.playa.nombre || null,
            direccion: data.playa.direccion,
            descripcion: data.playa.descripcion || ''
          }

          setSelectedPlaya(newPlaya)
        }
      } else {
        setIsSuccess(true)
      }
    } catch (error) {
      console.error('Error creating complete setup:', error)
      toast.error('Error inesperado', {
        description:
          'Ocurrió un error al crear la configuración. Intenta nuevamente.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinish = async () => {
    setInternalOpen(false) // Cerrar el modal

    // Revalidar datos de playas en lugar de recargar la página
    try {
      await revalidate('playas')
      await revalidate('playa-stats')
    } catch (error) {
      console.error('Error revalidating cache:', error)
      // Fallback a reload si la revalidation falla
      window.location.reload()
      return
    }

    if (mode === 'welcome') {
      // En modo welcome, refrescar la página para mostrar la nueva playa seleccionada
      router.refresh()
    } else {
      onClose?.()
      // En modo create, solo cerrar el modal ya que los datos se revalidaron
    }
  }

  const modalTitle =
    title ||
    (mode === 'welcome'
      ? `¡Bienvenido a Valet, ${userName}!`
      : 'Crear playa completa')
  const modalDescription =
    description ||
    (mode === 'welcome'
      ? 'Completa los datos básicos de tu playa para comenzar a gestionarla.'
      : 'Crea una nueva playa con todos sus datos en una sola transacción.')

  const handleExit = () => {
    reset()
    setIsStarted(false)
    if (mode === 'create') {
      onClose?.()
    }
  }

  // Usar estado interno para controlar la apertura del modal
  const shouldBeOpen = internalOpen

  return (
    <AlertDialog
      open={shouldBeOpen}
      onOpenChange={mode === 'create' && !isSuccess ? onClose : undefined}
    >
      <AlertDialogContent
        className="flex h-[90vh] flex-col items-center overflow-y-auto sm:max-w-3xl"
        overlayClassName="bg-black/50 backdrop-blur-xs"
      >
        <AlertDialogHeader
          className={`flex items-center gap-2 text-center transition-all duration-300 ${
            isStarted ? 'mt-2 flex-row gap-4' : 'my-6 flex-col justify-center'
          }`}
        >
          {(!isStarted || (!isMobile && isStarted)) && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <PartyPopper className="h-8 w-8 text-blue-600" />
            </div>
          )}
          <div className={`${isStarted ? 'text-left' : 'text-center'}`}>
            <AlertDialogTitle className="text-2xl">
              {modalTitle} {isMobile && isStarted ? '🎉' : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>{modalDescription}</AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        {!isStarted ? (
          <InitialMessage
            setIsStarted={setIsStarted}
            mode={mode}
            onCancel={handleExit}
          />
        ) : isSuccess ? (
          <SuccessMessage onFinish={handleFinish} />
        ) : (
          <FormProvider {...form}>
            <Gateway
              form={form}
              onSubmit={handleSubmit}
              validateStep={validateStep}
              className="mt-6"
              exitAction={handleExit}
              isSubmitting={isSubmitting}
            >
              <Step
                title="Datos de la playa"
                description="Completa la información básica de tu playa."
                label="Datos básicos"
              >
                <PlayaStep />
              </Step>
              <Step
                title="Tipos de Plaza"
                description="Define los diferentes tipos de plazas que tendrás (opcional)."
                label="Tipos de plaza"
              >
                {isLoadingCaracteristicas ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">
                      Cargando características...
                    </div>
                  </div>
                ) : (
                  <TiposPlazaStep caracteristicas={caracteristicas} />
                )}
              </Step>
              <Step
                title="Tarifas"
                description="Establece los precios para cada combinación (opcional)."
                label="Tarifas"
              >
                <TarifasStep />
              </Step>
              <Step
                title="Plazas"
                description="Define las plazas individuales de tu estacionamiento (opcional)."
                label="Plazas"
              >
                <PlazasStep />
              </Step>
              <Step
                title="Métodos de Pago"
                description="Selecciona los métodos de pago que aceptarás (opcional)."
                label="Métodos de pago"
              >
                <MetodosPagoStep />
              </Step>
              <Step
                title="Resumen"
                description="Revisa toda la configuración antes de crear."
                label="Resumen"
              >
                <SummaryStep />
              </Step>
            </Gateway>
          </FormProvider>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
