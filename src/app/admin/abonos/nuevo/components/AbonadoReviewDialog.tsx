'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { updateAbonadoAction } from '@/app/admin/abonados/actions'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input
} from '@/components/ui'
import { Spinner } from '@/components/ui/spinner'
import { dniRegex, nameRegex } from '@/constants/validations'
import type { CreateAbonoResponse } from '@/services/abonos/types'

const reviewAbonadoSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .regex(nameRegex, 'El nombre solo puede contener letras'),
  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .regex(nameRegex, 'El apellido solo puede contener letras'),
  dni: z
    .string()
    .regex(dniRegex, 'El DNI debe tener 7 u 8 números')
    .transform((val) => val.replace(/\D/g, '')),
  email: z
    .string()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      'El formato del email no es válido'
    )
    .optional()
    .or(z.literal('')),
  telefono: z
    .string()
    .refine((val) => {
      if (!val) return true
      const digitsOnly = val.replace(/\D/g, '')
      return digitsOnly.length === 10
    }, 'El teléfono debe tener exactamente 10 dígitos')
    .optional()
    .or(z.literal(''))
})

type AbonadoReviewData = z.infer<typeof reviewAbonadoSchema>

type AbonadoReviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  abonadoData: CreateAbonoResponse
  onConfirm: () => void
  onUpdate: (updatedData: AbonadoReviewData) => void
}

export default function AbonadoReviewDialog({
  open,
  onOpenChange,
  abonadoData,
  onConfirm,
  onUpdate
}: AbonadoReviewDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const form = useForm<AbonadoReviewData>({
    resolver: zodResolver(reviewAbonadoSchema),
    defaultValues: {
      nombre: abonadoData.abonadoNombre,
      apellido: abonadoData.abonadoApellido,
      dni: abonadoData.abonadoDni,
      email: abonadoData.abonadoEmail || '',
      telefono: abonadoData.abonadoTelefono || ''
    }
  })

  const handleEdit = () => {
    setIsEditing(true)
    form.reset({
      nombre: abonadoData.abonadoNombre,
      apellido: abonadoData.abonadoApellido,
      dni: abonadoData.abonadoDni,
      email: abonadoData.abonadoEmail || '',
      telefono: abonadoData.abonadoTelefono || ''
    })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    form.reset()
  }

  const handleSaveChanges = async (data: AbonadoReviewData) => {
    setIsUpdating(true)
    try {
      const result = await updateAbonadoAction({
        abonadoId: abonadoData.abonadoId,
        nombre: data.nombre,
        apellido: data.apellido,
        dni: data.dni,
        email: data.email || null,
        telefono: data.telefono || null
      })

      if (result.error) {
        toast.error('Error al actualizar datos', {
          description: result.error
        })
        return
      }

      toast.success('Datos actualizados correctamente')
      setIsEditing(false)
      onUpdate(data)
    } catch (error) {
      console.error('Error updating abonado:', error)
      toast.error('Error inesperado', {
        description: 'Ocurrió un error al actualizar los datos'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const currentValues = form.watch()

  const hasChanges =
    isEditing &&
    (currentValues.nombre !== abonadoData.abonadoNombre ||
      currentValues.apellido !== abonadoData.abonadoApellido ||
      currentValues.dni !== abonadoData.abonadoDni ||
      currentValues.email !== (abonadoData.abonadoEmail || '') ||
      currentValues.telefono !== (abonadoData.abonadoTelefono || ''))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Revisar datos del abonado</DialogTitle>
          <DialogDescription>
            Revisa los datos del abonado creado. Si encuentras algún error,
            puedes corregirlo antes de finalizar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSaveChanges)}
            className="space-y-4"
          >
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing || isUpdating}
                        placeholder="Juan"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apellido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing || isUpdating}
                        placeholder="Pérez"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing || isUpdating}
                        placeholder="12345678"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        disabled={!isEditing || isUpdating}
                        placeholder="juan@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing || isUpdating}
                        placeholder="+54 9 11 1234-5678"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              {!isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleEdit}
                    className="w-full sm:w-auto"
                  >
                    Modificar Datos
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirm}
                    className="w-full sm:w-auto"
                  >
                    Confirmar y Finalizar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={!hasChanges || isUpdating}
                    className="w-full sm:w-auto"
                  >
                    {isUpdating && <Spinner className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
