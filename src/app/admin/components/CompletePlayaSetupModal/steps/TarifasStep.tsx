'use client'

import { useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import { AlertCircle, Trash2 } from 'lucide-react'

import {
  Alert,
  AlertDescription,
  Button,
  CurrencyInput,
  FormControl,
  FormItem,
  FormLabel,
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
import {
  MODALIDAD_OCUPACION_ESPORADICA,
  MODALIDAD_OCUPACION_LABEL
} from '@/constants/modalidadOcupacion'
import { TIPO_VEHICULO, TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import type { WelcomeSetupFormData } from '@/schemas/welcome-setup'

export default function TarifasStep() {
  const { control, watch } = useFormContext<WelcomeSetupFormData>()
  const [formData, setFormData] = useState({
    tipoPlazaIndex: -1,
    modalidadOcupacion: '',
    tipoVehiculo: '',
    precioBase: undefined as number | undefined
  })

  const {
    fields: tarifasFields,
    append: appendTarifa,
    remove: removeTarifa
  } = useFieldArray({
    control,
    name: 'tarifas'
  })

  const tiposPlaza = watch('tiposPlaza') || []
  const tarifas = watch('tarifas') || []

  const addTarifa = () => {
    if (
      formData.tipoPlazaIndex === -1 ||
      !formData.modalidadOcupacion ||
      !formData.tipoVehiculo ||
      !formData.precioBase ||
      formData.precioBase <= 0
    ) {
      return
    }

    appendTarifa({
      tipoPlazaIndex: formData.tipoPlazaIndex,
      modalidadOcupacion: formData.modalidadOcupacion as any,
      tipoVehiculo: formData.tipoVehiculo as any,
      precioBase: formData.precioBase
    })

    setFormData({
      tipoPlazaIndex: -1,
      modalidadOcupacion: '',
      tipoVehiculo: '',
      precioBase: undefined
    })
  }

  const getUsedCombinations = () => {
    return tarifas.map(
      (tarifa) =>
        `${tarifa.tipoPlazaIndex}-${tarifa.modalidadOcupacion}-${tarifa.tipoVehiculo}`
    )
  }

  const isOptionDisabled = (
    tipoPlazaIndex: number,
    modalidad: string,
    vehiculo: string
  ) => {
    const combination = `${tipoPlazaIndex}-${modalidad}-${vehiculo}`
    return getUsedCombinations().includes(combination)
  }

  const getAvailableModalidades = () => {
    if (formData.tipoPlazaIndex === -1) return []

    return Object.values(MODALIDAD_OCUPACION_ESPORADICA).filter((modalidad) => {
      return Object.values(TIPO_VEHICULO).some(
        (vehiculo) =>
          !isOptionDisabled(formData.tipoPlazaIndex, modalidad, vehiculo)
      )
    })
  }

  const getAvailableVehiculos = () => {
    if (formData.tipoPlazaIndex === -1 || !formData.modalidadOcupacion)
      return []

    return Object.values(TIPO_VEHICULO).filter(
      (vehiculo) =>
        !isOptionDisabled(
          formData.tipoPlazaIndex,
          formData.modalidadOcupacion,
          vehiculo
        )
    )
  }

  const canAdd =
    formData.tipoPlazaIndex !== -1 &&
    formData.modalidadOcupacion !== '' &&
    formData.tipoVehiculo !== '' &&
    formData.precioBase !== undefined &&
    formData.precioBase > 0

  const canAddTarifas = tiposPlaza.length > 0

  return (
    <div className="space-y-6">
      {!canAddTarifas && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Para crear tarifas, primero debes definir al menos un tipo de plaza
            en el paso anterior. Vuelve atrás para completar esa información.
          </AlertDescription>
        </Alert>
      )}

      {canAddTarifas && (
        <>
          <div className="bg-muted/20 space-y-4 rounded-lg border p-4">
            <div className="grid grid-cols-3 gap-4">
              <FormItem className="w-full">
                <FormLabel>Tipo de Plaza</FormLabel>
                <Select
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      tipoPlazaIndex: parseInt(value),
                      modalidadOcupacion: '',
                      tipoVehiculo: ''
                    }))
                  }
                  value={
                    formData.tipoPlazaIndex === -1
                      ? ''
                      : formData.tipoPlazaIndex.toString()
                  }
                >
                  <FormControl>
                    <SelectTrigger className="w-full" name="tipoPlaza">
                      <SelectValue placeholder="Selecciona un tipo" />
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
              </FormItem>

              <FormItem className="w-full">
                <FormLabel>Modalidad de Ocupación</FormLabel>
                <Select
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      modalidadOcupacion: value,
                      tipoVehiculo: ''
                    }))
                  }
                  value={formData.modalidadOcupacion}
                  disabled={formData.tipoPlazaIndex === -1}
                >
                  <FormControl>
                    <SelectTrigger className="w-full" name="modalidadOcupacion">
                      <SelectValue placeholder="Selecciona modalidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getAvailableModalidades().map((modalidad) => (
                      <SelectItem key={modalidad} value={modalidad}>
                        {MODALIDAD_OCUPACION_LABEL[modalidad]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
              <FormItem className="w-full">
                <FormLabel>Tipo de Vehículo</FormLabel>
                <Select
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, tipoVehiculo: value }))
                  }
                  value={formData.tipoVehiculo}
                  disabled={!formData.modalidadOcupacion}
                >
                  <FormControl>
                    <SelectTrigger className="w-full" name="tipoVehiculo">
                      <SelectValue placeholder="Selecciona vehículo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getAvailableVehiculos().map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {TIPO_VEHICULO_LABEL[tipo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            </div>

            <div className="flex items-end gap-4">
              <FormItem className="w-full">
                <FormLabel>Precio Base</FormLabel>
                <FormControl>
                  <CurrencyInput
                    name="precioBase"
                    value={formData.precioBase}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        precioBase: value
                      }))
                    }
                    placeholder="$ 0,00"
                  />
                </FormControl>
              </FormItem>
              <Button
                type="button"
                onClick={addTarifa}
                disabled={!canAdd}
                className="w-fit"
              >
                Agregar
              </Button>
            </div>
          </div>

          {tarifasFields.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Tarifas Creadas</h4>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Plaza</TableHead>
                      <TableHead>Modalidad</TableHead>
                      <TableHead>Vehículo</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tarifasFields.map((field, index) => {
                      const tarifa = field as any
                      const tipoPlaza = tiposPlaza[tarifa.tipoPlazaIndex]
                      return (
                        <TableRow key={field.id} className="[&>td]:p-2">
                          <TableCell className="font-medium">
                            {tipoPlaza?.nombre || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {MODALIDAD_OCUPACION_LABEL[
                              tarifa.modalidadOcupacion as keyof typeof MODALIDAD_OCUPACION_LABEL
                            ] || tarifa.modalidadOcupacion}
                          </TableCell>
                          <TableCell>
                            {TIPO_VEHICULO_LABEL[tarifa.tipoVehiculo] ||
                              tarifa.tipoVehiculo}
                          </TableCell>
                          <TableCell>${tarifa.precioBase}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTarifa(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {tarifasFields.length === 0 && (
            <div className="border-muted-foreground/25 rounded-lg border-2 border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                No hay tarifas definidas. Completa el formulario arriba y agrega
                al menos una para continuar.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
