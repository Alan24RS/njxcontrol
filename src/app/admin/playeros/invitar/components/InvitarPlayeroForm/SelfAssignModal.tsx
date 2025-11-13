'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui'
import ComboboxWithSearch from '@/components/ui/ComboboxSearch'
import { getPlayasBasicasClient } from '@/services/playas/getPlayasBasicasClient'

import { selfAssignAsPlayeroAction } from '../../../actions'

const selfAssignSchema = z.object({
  playas: z
    .array(
      z.object({
        id: z.string(),
        nombre: z.string()
      })
    )
    .min(1, 'Debe seleccionar al menos una playa')
})

type SelfAssignFormData = z.infer<typeof selfAssignSchema>

export default function SelfAssignModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()

  // Obtener playas del usuario
  const { data: playasResponse } = useQuery({
    queryKey: ['playas-basicas'],
    queryFn: () => getPlayasBasicasClient({})
  })

  const playas = playasResponse?.data || []

  const form = useForm<SelfAssignFormData>({
    resolver: zodResolver(selfAssignSchema),
    defaultValues: {
      playas: []
    }
  })

  const handleConfirm = async (data: SelfAssignFormData) => {
    setIsLoading(true)

    try {
      const playasIds = data.playas.map((playa) => playa.id)
      const result = await selfAssignAsPlayeroAction(playasIds)

      if (result.success && result.data) {
        toast.success('¡Auto-asignación exitosa!', {
          description: result.data.message,
          duration: 4000
        })

        // Invalidar queries para actualizar los datos
        queryClient.invalidateQueries({ queryKey: ['playeros'] })
        queryClient.invalidateQueries({ queryKey: ['check-owner-is-playero'] })

        setIsOpen(false)
        form.reset()

        // Redireccionar a la vista de playeros
        if (result.data.rolAsignado) {
          toast.info('Redirigiendo a playeros...', { duration: 1000 })
          setTimeout(() => {
            router.push('/admin/playeros')
          }, 1200)
        } else {
          router.push('/admin/playeros')
        }
      } else {
        toast.error(result.error || 'Error al auto-asignarse como playero')
      }
    } catch {
      toast.error('Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCheck className="mr-2 h-4 w-4" />
          Asignarme como playero
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignarme como playero</DialogTitle>
          <DialogDescription>
            Selecciona las playas en las que quieres participar como playero.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleConfirm)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="playas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playas disponibles</FormLabel>
                  <FormControl>
                    <ComboboxWithSearch
                      name="playas"
                      placeholder="Buscar y seleccionar playas..."
                      multiple
                      value={field.value}
                      onChange={field.onChange}
                      queryFn={getPlayasBasicasClient}
                      initialData={playas}
                      fields={{
                        label: 'nombre',
                        value: 'id'
                      }}
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
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} loading={isLoading}>
                Asignarme como playero
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
