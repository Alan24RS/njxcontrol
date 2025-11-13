'use client'

import { Children, ReactElement, useEffect, useState } from 'react'
import { FormProvider, UseFormReturn } from 'react-hook-form'

import { toast } from 'sonner'

import { Button, Form } from '@/components/ui'
import PreventNavigation from '@/components/ui/PreventNavigation'
import { usePageScroll } from '@/contexts/PageScroll'
import { cn } from '@/lib/utils'

import ExitModal from './ExitModal'
import ProgressBar from './ProgressBar'
import type { StepProps } from './Step'

interface GatewayProps {
  className?: string
  children: ReactElement<StepProps>[]
  onSubmit: (values: any) => void
  validateStep: (step: number) => Promise<boolean>
  form: UseFormReturn<any>
  preventNavigation?: boolean
  exitAction?: () => void
  isSubmitting?: boolean
}
export default function Gateway({
  className,
  children,
  onSubmit,
  validateStep,
  form,
  preventNavigation = false,
  exitAction,
  isSubmitting = false
}: GatewayProps) {
  const [activeStep, setActiveStep] = useState(0)
  const { scrollToTop } = usePageScroll()

  const steps = Children.map(
    children,
    (child: ReactElement<StepProps>) => child.props.label || child.props.title
  )

  const handleNext = async () => {
    const isValid = await validateStep(activeStep)

    if (isValid) {
      if (activeStep < steps.length - 1) {
        setActiveStep(activeStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const { handleSubmit } = form

  useEffect(() => {
    scrollToTop()
  }, [scrollToTop, activeStep])

  const goToStep = async (step: number) => {
    if (step > activeStep) {
      for (let i = activeStep; i < step; i++) {
        const isValid = await validateStep(i)
        if (!isValid) {
          toast.error('Error al avanzar', {
            description: `Debes completar el paso ${i + 1} antes de continuar.`,
            action: {
              label: 'Ir',
              onClick: () => goToStep(i)
            }
          })
          return
        }
      }
      setActiveStep(step)
    } else {
      setActiveStep(step)
    }
  }

  return (
    <FormProvider {...form}>
      <PreventNavigation isDirty={preventNavigation && activeStep > 0} />
      <div className={cn('flex w-full grow flex-col gap-2', className)}>
        <ProgressBar
          steps={steps}
          activeStep={activeStep}
          goToStep={goToStep}
        />
        <Form {...form}>
          <form className="flex grow flex-col space-y-4">
            {Children.map(children, (child, index) =>
              index === activeStep ? child : null
            )}
          </form>
        </Form>
        <div
          className={`mt-4 flex items-end ${activeStep > 0 || exitAction ? 'justify-between' : 'justify-end'}`}
        >
          {activeStep > 0 && (
            <Button variant="secondary" onClick={handlePrevious}>
              Anterior
            </Button>
          )}
          {exitAction && activeStep === 0 && (
            <ExitModal handleClose={exitAction} />
          )}
          {activeStep === steps.length - 1 ? (
            <Button
              onClick={async () => {
                const isValid = await validateStep(activeStep)
                if (isValid) {
                  await handleSubmit(
                    (data) => {
                      onSubmit(data)
                    },
                    (errors) => {
                      console.error('Form validation errors:', errors)
                      toast.error('Error de validación', {
                        description: 'Hay errores en el formulario'
                      })
                    }
                  )()
                } else {
                  toast.error('Error al validar', {
                    description:
                      'Por favor completa todos los campos requeridos antes de continuar.'
                  })
                }
              }}
              loading={isSubmitting}
            >
              Finalizar
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={activeStep === steps.length - 1}
            >
              Siguiente
            </Button>
          )}
        </div>
      </div>
    </FormProvider>
  )
}
