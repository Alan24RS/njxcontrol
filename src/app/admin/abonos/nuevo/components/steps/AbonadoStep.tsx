'use client'

import { useCallback, useEffect, useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import { Plus, Trash2 } from 'lucide-react'

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
import { Spinner } from '@/components/ui/spinner'
import { TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import type { CreateAbonoFormData } from '@/schemas/abono'
import { getAbonado } from '@/services/abonados'
import { getVehiculo } from '@/services/vehiculos'

export default function AbonadoStep() {
  const { control, watch, setValue } = useFormContext<CreateAbonoFormData>()
  const [searchingDNI, setSearchingDNI] = useState(false)
  const [dniSearched, setDniSearched] = useState(false)
  const [searchingPatentes, setSearchingPatentes] = useState<Set<number>>(
    new Set()
  )

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'vehiculos'
  })

  const dni = watch('dni')
  const tiposVehiculoSeleccionados = watch('tiposVehiculo') || []

  const handleDNISearch = useCallback(
    async (dniToSearch: string) => {
      if (!dniToSearch || dniToSearch.length < 7) return

      setSearchingDNI(true)
      const { data } = await getAbonado(dniToSearch)
      setSearchingDNI(false)
      setDniSearched(true)

      if (data) {
        setValue('nombre', data.nombre)
        setValue('apellido', data.apellido)
        setValue('email', data.email || '')
        setValue('telefono', data.telefono || '')
      }
    },
    [setValue]
  )

  useEffect(() => {
    if (!dni || dni.length < 7) {
      setDniSearched(false)
      return
    }

    const timeoutId = setTimeout(() => {
      handleDNISearch(dni)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [dni, handleDNISearch])

  const handlePatenteSearch = async (index: number, patente: string) => {
    if (!patente || patente.length < 6) return

    setSearchingPatentes((prev) => new Set(prev).add(index))
    const { data } = await getVehiculo(patente)
    setSearchingPatentes((prev) => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })

    if (data) {
      setValue(`vehiculos.${index}.tipoVehiculo`, data.tipoVehiculo as any)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <FormField
          control={control}
          name="dni"
          render={({ field }) => (
            <FormItem>
              <FormLabel>DNI del abonado</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="12345678"
                    maxLength={8}
                    autoComplete="off"
                    onChange={(e) => {
                      field.onChange(e.target.value.replace(/\D/g, ''))
                      setDniSearched(false)
                    }}
                  />
                </FormControl>
                {searchingDNI && <Spinner className="h-5 w-5" />}
              </div>
              <FormMessage />
              {dniSearched && (
                <p className="text-muted-foreground text-sm">
                  Búsqueda completada. Completa o modifica los datos del
                  abonado.
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Juan"
                  autoComplete="given-name"
                  disabled={!dniSearched}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="apellido"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Pérez"
                  autoComplete="family-name"
                  disabled={!dniSearched}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="juan@example.com"
                  autoComplete="email"
                  disabled={!dniSearched}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="1234567890"
                  autoComplete="tel"
                  disabled={!dniSearched}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Vehículos</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                patente: '',
                tipoVehiculo:
                  tiposVehiculoSeleccionados[0] || ('AUTOMOVIL' as any)
              })
            }
            disabled={!dniSearched || tiposVehiculoSeleccionados.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar vehículo
          </Button>
        </div>

        {fields.length === 0 && (
          <div className="border-muted-foreground/25 rounded-lg border-2 border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              {tiposVehiculoSeleccionados.length === 0
                ? 'Debes seleccionar tipos de vehículos en el paso 1 antes de agregar vehículos'
                : 'Agrega al menos un vehículo al abono'}
            </p>
          </div>
        )}

        {fields.length > 0 && (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patente</TableHead>
                  <TableHead>Tipo de vehículo</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id} className="[&>td]:p-2">
                    <TableCell>
                      <FormField
                        control={control}
                        name={`vehiculos.${index}.patente`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="ABC123 o AB123CD"
                                  maxLength={7}
                                  autoComplete="off"
                                  onChange={(e) => {
                                    const value = e.target.value.toUpperCase()
                                    field.onChange(value)
                                  }}
                                  onBlur={() =>
                                    handlePatenteSearch(index, field.value)
                                  }
                                  className="min-w-[200px]"
                                />
                              </FormControl>
                              {searchingPatentes.has(index) && (
                                <Spinner className="h-5 w-5" />
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={control}
                        name={`vehiculos.${index}.tipoVehiculo`}
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={tiposVehiculoSeleccionados.length === 0}
                              name={field.name}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className="min-w-[200px]"
                                  id={field.name}
                                >
                                  <SelectValue
                                    placeholder={
                                      tiposVehiculoSeleccionados.length === 0
                                        ? 'Selecciona tipos en el paso 1'
                                        : 'Selecciona el tipo'
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {tiposVehiculoSeleccionados.map(
                                  (tipoVehiculo) => (
                                    <SelectItem
                                      key={tipoVehiculo}
                                      value={tipoVehiculo}
                                    >
                                      {TIPO_VEHICULO_LABEL[tipoVehiculo]}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
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
        )}
      </div>
    </div>
  )
}
