'use client'

import { useCallback, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  // AddressAutocomplete, // TODO: TEMP FIX - REVERTIR CUANDO MAPS FUNCIONE
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input
} from '@/components/ui'

// import type { GooglePlaceDetails } from '@/services/google' // TODO: TEMP FIX - REVERTIR CUANDO MAPS FUNCIONE
import ScheduleBuilder from './ScheduleBuilder'

const DAY_LABEL: Record<string, string> = {
  LUN: 'Lun',
  MAR: 'Mar',
  MIE: 'Mié',
  JUE: 'Jue',
  VIE: 'Vie',
  SAB: 'Sáb',
  DOM: 'Dom'
}

interface FieldsetProps {
  namePrefix?: string
}

export default function Fieldset({ namePrefix = '' }: FieldsetProps) {
  const {
    control,
    setValue,
    trigger,
    register,
    watch,
    getValues
  } = useFormContext()

  const getFieldName = useCallback(
    (fieldName: string) => {
      return namePrefix ? `${namePrefix}.${fieldName}` : fieldName
    },
    [namePrefix]
  )

  useEffect(() => {
    const subscription = watch((_, { name: changedName }) => {
      // Evitar ejecutar cuando changedName es undefined para no entrar en un
      // bucle: setValue puede disparar watch con name indefinido en ciertos
      // casos; solo reaccionamos a cambios en campos que empiecen por 'horarios'.
      if (changedName && changedName.startsWith(getFieldName('horarios'))) {
        const horarios = getValues(getFieldName('horarios') as any) as
          | Array<{
              dias?: string[]
              apertura?: string
              cierre?: string
            }>
          | undefined

        if (!horarios || horarios.length === 0) {
          setValue(getFieldName('horario') as any, '', {
            shouldTouch: true,
            shouldValidate: true
          })
          return
        }

        const map = new Map<
          string,
          { dias: string[]; apertura: string; cierre: string; order: number }
        >()
        let order = 0
        for (const it of horarios) {
          const apertura = it?.apertura ?? ''
          const cierre = it?.cierre ?? ''
          const key = `${apertura}-${cierre}`
          if (!map.has(key)) {
            map.set(key, { dias: [], apertura, cierre, order: order++ })
          }
          const entry = map.get(key)!
          for (const d of it?.dias || []) {
            if (!entry.dias.includes(d)) entry.dias.push(d)
          }
        }

        const groups = Array.from(map.values()).sort(
          (a, b) => a.order - b.order
        )
        const parts = groups.map((g) => {
          const dias = g.dias.map((d) => DAY_LABEL[d] || d).join(',')
          return `${dias} ${g.apertura} - ${g.cierre}`
        })

        const serialized = parts.join(', ')
        setValue(getFieldName('horario') as any, serialized, {
          shouldTouch: true,
          shouldValidate: true
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [watch, setValue, getFieldName, getValues])

  useEffect(() => {
    try {
      // Usar getValues en vez de watch aquí para evitar la suscripción y
      // permitir que este efecto se ejecute solo en montaje/cuando cambie
      // namePrefix (a través de getFieldName) o funciones de form.
      const currentHorarios = getValues(getFieldName('horarios')) as
        | any[]
        | undefined
      const horarioStr = getValues(getFieldName('horario')) as
        | string
        | undefined
      if (
        (currentHorarios === undefined || currentHorarios.length === 0) &&
        horarioStr
      ) {
        const labelToKey: Record<string, string> = Object.fromEntries(
          Object.entries(DAY_LABEL).map(([k, v]) => [v, k])
        )

        const parsed: any[] = []

        const re =
          /((?:Lun|Mar|Mié|Mie|Jue|Vie|Sáb|Sab|Dom)(?:,(?:Lun|Mar|Mié|Mie|Jue|Vie|Sáb|Sab|Dom))*)\s+([0-9]{2}:[0-9]{2})\s*-\s*([0-9]{2}:[0-9]{2})/g
        let m: RegExpExecArray | null
        while ((m = re.exec(horarioStr)) !== null) {
          const daysPart = m[1]
          const apertura = m[2]
          const cierre = m[3]
          const labels = daysPart
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          const diasKeys = labels.map((l) => labelToKey[l] ?? l)
          if (diasKeys.length > 0)
            parsed.push({ dias: diasKeys, apertura, cierre })
        }

        if (parsed.length > 0) {
          setValue(getFieldName('horarios') as any, parsed, {
            shouldTouch: false,
            shouldValidate: false
          })
        }
      }
    } catch (e) {
      console.warn('No se pudo parsear el campo horario:', e)
    }
    // Dependencias: funciones del form y getFieldName (depende de namePrefix)
  }, [getFieldName, getValues, setValue])

  return (
    <>
      {/* TODO: TEMP FIX - REVERTIR CUANDO MAPS FUNCIONE */}
      {/* <AddressAutocomplete
        onAddressSelect={(details: GooglePlaceDetails) => {
          const direccionSimple = details.direccion

          setValue(
            getFieldName('displayAddress') as any,
            details.formattedAddress,
            {
              shouldTouch: true
            }
          )
          setValue(getFieldName('direccion') as any, direccionSimple, {
            shouldTouch: true
          })
          setValue(getFieldName('ciudad') as any, details.ciudad, {
            shouldTouch: true
          })
          setValue(getFieldName('provincia') as any, details.provincia, {
            shouldTouch: true
          })
          setValue(getFieldName('latitud') as any, details.latitud, {
            shouldTouch: true
          })
          setValue(getFieldName('longitud') as any, details.longitud, {
            shouldTouch: true
          })
          // Validar solo los campos de dirección para que se ejecute el superRefine
          trigger([
            getFieldName('direccion'),
            getFieldName('ciudad'),
            getFieldName('provincia'),
            getFieldName('latitud'),
            getFieldName('longitud')
          ])
        }}
        onAddressClear={() => {
          setValue(getFieldName('displayAddress') as any, '', {
            shouldTouch: true
          })
          setValue(getFieldName('direccion') as any, '', { shouldTouch: true })
          setValue(getFieldName('ciudad') as any, '', { shouldTouch: true })
          setValue(getFieldName('provincia') as any, '', { shouldTouch: true })
          setValue(getFieldName('latitud') as any, 0, { shouldTouch: true })
          setValue(getFieldName('longitud') as any, 0, { shouldTouch: true })
          // Validar solo los campos de dirección para mostrar el error de dirección requerida
          trigger([
            getFieldName('direccion'),
            getFieldName('ciudad'),
            getFieldName('provincia'),
            getFieldName('latitud'),
            getFieldName('longitud')
          ])
        }}
        label="Ubicación de la playa"
        placeholder="Buscar dirección de la playa..."
        error={
          (_formState.errors as any)?.[getFieldName('addressSelected')]
            ?.message as string
        }
        displayAddress={watch(getFieldName('displayAddress'))}
        latitude={watch(getFieldName('latitud'))}
        longitude={watch(getFieldName('longitud'))}
      /> */}

      <FormField
        control={control}
        name={getFieldName('direccion')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dirección de la playa</FormLabel>
            <FormControl>
              <Input
                placeholder="Ingrese la dirección manualmente..."
                {...field}
                onChange={(e) => {
                  field.onChange(e)
                  // TODO: TEMP FIX - REVERTIR CUANDO MAPS FUNCIONE
                  // Establecer valores por defecto cuando el usuario escribe la dirección
                  const direccionValue = e.target.value
                  if (direccionValue.trim() !== '') {
                    const currentLatitud = getValues(getFieldName('latitud'))
                    const currentLongitud = getValues(getFieldName('longitud'))
                    const currentCiudad = getValues(getFieldName('ciudad'))
                    const currentProvincia = getValues(
                      getFieldName('provincia')
                    )

                    if (
                      !currentLatitud ||
                      currentLatitud === 0 ||
                      !currentLongitud ||
                      currentLongitud === 0
                    ) {
                      setValue(getFieldName('latitud') as any, -34.603722, {
                        shouldValidate: false,
                        shouldDirty: false
                      })
                      setValue(getFieldName('longitud') as any, -58.381592, {
                        shouldValidate: false,
                        shouldDirty: false
                      })
                    }
                    if (!currentCiudad || currentCiudad.trim() === '') {
                      setValue(getFieldName('ciudad') as any, 'Buenos Aires', {
                        shouldValidate: false,
                        shouldDirty: false
                      })
                    }
                    if (!currentProvincia || currentProvincia.trim() === '') {
                      setValue(
                        getFieldName('provincia') as any,
                        'Ciudad Autónoma de Buenos Aires',
                        {
                          shouldValidate: false,
                          shouldDirty: false
                        }
                      )
                    }
                  }
                  trigger(getFieldName('direccion'))
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Campos ocultos para incluir en FormData */}
      <input type="hidden" {...register(getFieldName('displayAddress'))} />
      <input type="hidden" {...register(getFieldName('direccion'))} />
      <input type="hidden" {...register(getFieldName('ciudad'))} />
      <input type="hidden" {...register(getFieldName('provincia'))} />
      <input
        type="hidden"
        {...register(getFieldName('latitud'), { valueAsNumber: true })}
      />
      <input
        type="hidden"
        {...register(getFieldName('longitud'), { valueAsNumber: true })}
      />

      {/* Hidden field para compatibilidad: se rellenará a partir de 'horarios' en el useEffect */}
      <input type="hidden" {...register(getFieldName('horario'))} />

      {/* Sincronizar 'horarios' (array) a 'horario' (string) para mantener compatibilidad con la DB actual */}

      <FormField
        control={control}
        name={getFieldName('nombre')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre de la playa (opcional)</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: Playa Central, Estacionamiento Norte..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={getFieldName('descripcion')}
        render={({ field: _field }) => (
          <FormItem>
            <FormLabel>Descripción (opcional)</FormLabel>
            <FormControl>
              <Input
                placeholder="Breve descripción de la playa..."
                type="text"
                autoComplete="off"
                {..._field}
                onChange={(e) => {
                  _field.onChange(e)
                  // Validar este campo específico cuando cambie
                  trigger(getFieldName('descripcion'))
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Reemplazamos el input libre por un ScheduleBuilder prototipo */}
      <FormField
        control={control}
        name={getFieldName('horario')}
        render={({ field: _field }) => (
          <FormItem>
            <FormLabel>Horario de funcionamiento</FormLabel>
            <FormControl>
              {/* El ScheduleBuilder usará el campo 'horarios' en el form; mantenemos 'horario' por compatibilidad */}
              <ScheduleBuilder name={getFieldName('horarios')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
