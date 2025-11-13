'use client'

import { useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import { Trash2 } from 'lucide-react'

import {
  Button,
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
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui'
import type { WelcomeSetupFormData } from '@/schemas/welcome-setup'

export default function PlazasStep() {
  const { control, watch, getValues } = useFormContext<WelcomeSetupFormData>()
  const [tipoPlazaSeleccionado, setTipoPlazaSeleccionado] = useState<
    number | null
  >(null)
  const [cantidad, setCantidad] = useState<number>(1)

  const { fields, remove, replace } = useFieldArray({
    control,
    name: 'plazas'
  })

  const tiposPlaza = watch('tiposPlaza') || []

  const generatePlazas = () => {
    if (tipoPlazaSeleccionado === null || cantidad < 1) return

    const currentPlazas = getValues('plazas') || []

    const newPlazas = Array.from({ length: cantidad }, () => ({
      tipoPlazaIndex: tipoPlazaSeleccionado,
      identificador: '',
      generatedFrom: {
        tipoPlazaIndex: tipoPlazaSeleccionado,
        cantidad
      }
    }))

    replace([...currentPlazas, ...newPlazas])

    setTipoPlazaSeleccionado(null)
    setCantidad(1)
  }

  const removePlaza = (index: number) => {
    remove(index)
  }

  return (
    <div className="space-y-6">
      {tiposPlaza.length === 0 && (
        <div className="border-muted-foreground/25 rounded-lg border-2 border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            Primero debes definir tipos de plaza en el paso anterior.
          </p>
        </div>
      )}

      {tiposPlaza.length > 0 && (
        <>
          <div className="bg-muted/20 space-y-4 rounded-lg border p-4">
            <div className="flex flex-nowrap items-end gap-4">
              <FormItem className="w-full">
                <FormLabel>Tipo de Plaza</FormLabel>
                <Select
                  value={tipoPlazaSeleccionado?.toString() || ''}
                  onValueChange={(value) =>
                    setTipoPlazaSeleccionado(parseInt(value))
                  }
                >
                  <FormControl>
                    <SelectTrigger className="w-full" name="tipoPlaza">
                      <SelectValue placeholder="Selecciona un tipo de plaza" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tiposPlaza.map((tipo, tipoIndex) => (
                      <SelectItem key={tipoIndex} value={tipoIndex.toString()}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>

              <FormItem className="w-full">
                <FormLabel>Cantidad</FormLabel>
                <FormControl>
                  <Input
                    name="cantidad"
                    type="number"
                    min="1"
                    max="100"
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                    placeholder="Cantidad de plazas"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <Button
                type="button"
                onClick={generatePlazas}
                disabled={tipoPlazaSeleccionado === null || cantidad < 1}
                className="w-fit"
              >
                Generar
              </Button>
            </div>
          </div>

          {fields.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  Plazas generadas ({fields.length})
                </h4>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Plaza</TableHead>
                      <TableHead>Identificador</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id} className="[&>td]:p-2">
                        <TableCell>
                          {tiposPlaza[
                            getValues(`plazas.${index}.tipoPlazaIndex`)
                          ]?.nombre || 'Tipo no encontrado'}
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={control}
                            name={`plazas.${index}.identificador`}
                            render={({ field: inputField }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...inputField}
                                    placeholder="Identificador de la plaza"
                                    className="min-w-[200px]"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePlaza(index)}
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
                No hay plazas generadas. Usa el formulario de arriba para
                generar plazas.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
