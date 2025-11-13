'use client'

import { useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Badge,
  Button,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui'
import ComboboxWithSearch from '@/components/ui/ComboboxSearch'
import type { WelcomeSetupFormData } from '@/schemas/welcome-setup'
import { getCaracteristicas } from '@/services/caracteristicas'

interface TiposPlazaStepProps {
  caracteristicas: Array<{ id: number; nombre: string }>
}

export default function TiposPlazaStep({
  caracteristicas
}: TiposPlazaStepProps) {
  const { control } = useFormContext<WelcomeSetupFormData>()
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    caracteristicas: [] as number[]
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tiposPlaza'
  })

  const addTipoPlaza = () => {
    if (!formData.nombre) {
      return
    }

    const descripcionTrimmed = formData.descripcion?.trim()

    if (
      (descripcionTrimmed && descripcionTrimmed.length < 4) ||
      descripcionTrimmed?.length > 200
    ) {
      toast.error('La descripción debe tener entre 4 y 200 caracteres', {
        description: 'Por favor, revisa la descripción.'
      })
      return
    }

    const nombreTrimmed = formData.nombre.trim()

    const existingNames = fields.map((field: any) => field.nombre.toLowerCase())
    if (existingNames.includes(nombreTrimmed.toLowerCase())) {
      toast.error('Ya existe un tipo de plaza con ese nombre', {
        description: 'Por favor, elige un nombre diferente.'
      })
      return
    }

    const sortedNewCaracteristicas = [...formData.caracteristicas].sort()
    const existingCombinations = fields.map((field: any) =>
      [...field.caracteristicas].sort().join(',')
    )
    const newCombination = sortedNewCaracteristicas.join(',')

    if (existingCombinations.includes(newCombination)) {
      toast.error(
        'Ya existe un tipo de plaza con esa combinación de características',
        {
          description: 'Por favor, selecciona una combinación diferente.'
        }
      )
      return
    }

    append({
      nombre: nombreTrimmed,
      descripcion: formData.descripcion,
      caracteristicas: formData.caracteristicas
    })

    setFormData({
      nombre: '',
      descripcion: '',
      caracteristicas: []
    })
  }

  const canAdd =
    formData.nombre.trim() !== '' &&
    formData.nombre.length >= 4 &&
    formData.nombre.length <= 20

  return (
    <div className="space-y-6">
      <div className="bg-muted/20 space-y-4 rounded-lg border p-4">
        <div className="grid grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormControl>
              <Input
                name="nombre"
                placeholder="Ej: Plaza estándar, Plaza premium..."
                type="text"
                autoComplete="off"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem>
            <FormLabel>Características</FormLabel>
            <FormControl>
              <ComboboxWithSearch
                name="caracteristicas"
                onChange={(selectedOptions) => {
                  const ids = Array.isArray(selectedOptions)
                    ? selectedOptions.map((option) => option.id)
                    : selectedOptions?.id || []
                  setFormData((prev) => ({ ...prev, caracteristicas: ids }))
                }}
                value={
                  Array.isArray(formData.caracteristicas)
                    ? caracteristicas.filter((char) =>
                        formData.caracteristicas.includes(char.id)
                      )
                    : []
                }
                queryFn={getCaracteristicas}
                initialData={caracteristicas}
                placeholder="Selecciona las características (opcional)"
                multiple
                fields={{
                  label: 'nombre',
                  value: 'id'
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <div className="flex items-end gap-4">
          <FormItem className="w-full">
            <FormLabel>Descripción (opcional)</FormLabel>
            <FormControl>
              <Input
                name="descripcion"
                placeholder="Breve descripción del tipo de plaza..."
                type="text"
                autoComplete="off"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descripcion: e.target.value
                  }))
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <Button
            type="button"
            onClick={addTipoPlaza}
            disabled={!canAdd}
            className="w-fit"
            icon={<Plus className="mr-2 h-4 w-4" />}
          >
            Agregar
          </Button>
        </div>
      </div>

      {fields.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Tipos de Plaza Creados</h4>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Características</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id} className="[&>td]:p-2">
                    <TableCell className="font-medium">
                      {field.nombre}
                    </TableCell>
                    <TableCell>{field.descripcion ?? '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {field.caracteristicas.map((caracId: number) => {
                          const carac = caracteristicas.find(
                            (c) => c.id === caracId
                          )
                          return carac ? (
                            <Badge key={caracId} variant="secondary">
                              {carac.nombre}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="flex items-center justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {fields.length === 0 && (
        <div className="border-muted-foreground/25 rounded-lg border-2 border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No hay tipos de plaza definidos. Completa el formulario arriba y
            agrega al menos uno para continuar.
          </p>
        </div>
      )}
    </div>
  )
}
