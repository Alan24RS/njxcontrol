'use client'

import { useQuery } from '@tanstack/react-query'

import { DataTableToolbar } from '@/components/ui/DataTable'
import { useUserRole } from '@/hooks/useUserRole'
import { getAbonados } from '@/services/abonados/getAbonados'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'

import { PageParams } from '../../page'

export default function ToolbarContainer({
  params
}: {
  params: Partial<PageParams>
}) {
  const { selectedPlaya, isLoading: playaLoading } = useSelectedPlaya()
  const { isDueno } = useUserRole()

  const isOwner = isDueno()
  const playaIdToFilter = isOwner ? undefined : selectedPlaya?.id

  const { data: res, isLoading: isLoadingAbonados } = useQuery({
    queryKey: ['abonados-toolbar', playaIdToFilter],
    queryFn: () => getAbonados({ playaId: playaIdToFilter })
  })

  const data = res?.data ?? []
  const isLoading = playaLoading || isLoadingAbonados

  // Get suggestions based on current query
  const query = String(params.query ?? '').trim()
  const queryTerms = query
    .toLowerCase()
    .split(/\s*-\s*|\s+/) // Separar por guiones o espacios
    .filter(Boolean)

  const suggestions = query
    ? Array.from(
        new Set(
          data
            .filter((a) => {
              const searchableText = [a.dni, a.nombre, a.apellido]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()

              return queryTerms.every((term) => {
                if (/^\d+$/.test(term)) {
                  // Si el término es numérico, buscar solo en DNI
                  return a.dni?.includes(term)
                }
                // Si no es numérico, buscar en todo el texto
                return searchableText.includes(term)
              })
            })
            .map((a) => {
              // Siempre mostrar el DNI en las sugerencias
              return `${a.dni} - ${a.nombre} ${a.apellido}`
            })
            .slice(0, 5)
        )
      )
    : []

  let min: string | undefined = undefined
  let max: string | undefined = undefined

  if (data && data.length) {
    const fechas = data
      .map((a) => a.fechaAlta)
      .filter(Boolean)
      .map((f) => (f as Date).toISOString().slice(0, 10))
    if (fechas.length) {
      min = fechas.reduce((a, b) => (a < b ? a : b))
      max = fechas.reduce((a, b) => (a > b ? a : b))
    }
  }

  const filters = {
    estado: {
      options: [
        { label: 'Activo', value: 'true' },
        { label: 'Inactivo', value: 'false' }
      ],
      pagination: false,
      title: 'Estado'
    },
    date: {
      options: [
        ...(min ? [{ label: 'Mínima', value: min }] : []),
        ...(max ? [{ label: 'Máxima', value: max }] : [])
      ],
      pagination: false,
      title: 'Rango de fecha'
    }
  }

  const availableColumns = [
    { id: 'nombre', label: 'Nombre' },
    { id: 'apellido', label: 'Apellido' },
    { id: 'email', label: 'Email' },
    { id: 'dni', label: 'DNI' },
    { id: 'fechaAlta', label: 'Fecha de alta' },
    { id: 'estado', label: 'Estado' }
  ]

  return (
    <DataTableToolbar
      filters={{ loading: isLoading, data: filters }}
      availableColumns={availableColumns}
      search={{
        loading: isLoading,
        placeholder: 'Buscar por nombre, apellido o DNI',
        minLength: 1,
        suggestions
      }}
    />
  )
}
