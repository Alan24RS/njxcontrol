# 🚀 Guía de Desarrollo - Patrones y Mejores Prácticas

## 📋 Índice
1. [Arquitectura General](#arquitectura-general)
2. [Patrón de Módulos CRUD](#patrón-de-módulos-crud)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Servicios y Capa de Datos](#servicios-y-capa-de-datos)
5. [Componentes y UI](#componentes-y-ui)
6. [Formularios y Validaciones](#formularios-y-validaciones)
7. [Server Actions](#server-actions)
8. [Hooks y React Query](#hooks-y-react-query)
9. [Optimizaciones Identificadas](#optimizaciones-identificadas)
10. [Checklist de Desarrollo](#checklist-de-desarrollo)

---

## 🏗️ Arquitectura General

### Principios Fundamentales

El proyecto sigue una arquitectura en capas bien definida:

```
┌─────────────────────────────────────────┐
│         Presentación (UI)               │
│  - Pages (Server Components)            │
│  - Client Components                     │
│  - Layout Components                     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│         Lógica de Negocio               │
│  - Server Actions                        │
│  - Hooks personalizados                  │
│  - Mutations (React Query)               │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│         Servicios                        │
│  - CRUD operations                       │
│  - Transformers                          │
│  - Validaciones                          │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│         Datos                            │
│  - Supabase Client                       │
│  - Database (PostgreSQL)                 │
│  - Cache (React Query)                   │
└─────────────────────────────────────────┘
```

### Flujo de Datos

**Lectura (Query):**
```
UI Component → Hook (useQuery) → Service → Supabase → Database
                                    ↓
                              Transformer
                                    ↓
                              Cached Data
```

**Escritura (Mutation):**
```
UI Component → Server Action → Schema Validation → Service → Supabase → Database
                    ↓                                          ↓
              Error Handling                            Revalidation
                    ↓
              UI Feedback
```

---

## 🎯 Patrón de Módulos CRUD

### Ejemplo de Referencia: Módulo de Playas

El módulo de **Playas** es el ejemplo más completo y debe ser usado como referencia para desarrollar nuevos módulos.

### Estructura Completa de un Módulo

```
app/admin/[modulo]/
├── page.tsx                          # Lista principal (Server Component)
├── actions.ts                        # Server Actions
├── nueva/                            # Página de creación
│   ├── page.tsx
│   └── components/
│       └── Create[Modulo]Form/
│           ├── index.tsx             # Formulario principal
│           └── Fieldset.tsx          # Campos del formulario
├── [id]/                             # Página de detalle/edición
│   ├── page.tsx
│   ├── not-found.tsx
│   ├── actions.ts                    # Actions específicas de esta página
│   └── components/
│       └── [Modulo]DetailForm.tsx
└── components/
    ├── index.ts                      # Barrel export
    ├── ActionContainer/              # Botones de acción (crear, etc)
    │   └── index.tsx
    ├── ToolbarContainer/             # Barra de herramientas (filtros, búsqueda)
    │   └── index.tsx
    └── TableContainer/               # Tabla de datos
        ├── index.tsx                 # Server Component que obtiene datos
        ├── ColumnsProvider.tsx       # Client Component con tabla
        └── Columns/
            ├── index.tsx             # Definición de columnas
            └── DeleteButton/         # Botón de eliminación
                └── index.tsx
```

---

## 📁 Estructura de Archivos

### 1. Página Principal (`page.tsx`)

**Propósito:** Server Component que orquesta la página.

```typescript
// ✅ PATRÓN RECOMENDADO
import {
  ActionContainer,
  TableContainer,
  ToolbarContainer
} from '@/app/admin/playas/components'
import { PageContainer, PageHeader } from '@/components/layout'
import type { PaginationParams } from '@/types/api'
import { formatParams } from '@/utils/queryParams'

export type PageParams = PaginationParams & {
  estado?: string[]
  ciudad?: string | string[]
}

export default async function PlayasPage({
  searchParams
}: {
  searchParams: SearchParamsType
}) {
  // 1. Formatear parámetros
  const params = formatParams<PageParams>(await searchParams)

  // 2. Estructura de página consistente
  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader title="Playas" description="Gestiona todas las playas">
        <ActionContainer />
      </PageHeader>
      <ToolbarContainer params={params} />
      <TableContainer params={params} />
    </PageContainer>
  )
}
```

**Características clave:**
- ✅ Es un Server Component (sin `'use client'`)
- ✅ Usa `formatParams` para parsear query params
- ✅ Sigue la estructura: PageContainer → PageHeader + ActionContainer → ToolbarContainer → TableContainer
- ✅ Define tipos para los parámetros de la página

### 2. ActionContainer

**Propósito:** Botones de acción (crear, importar, exportar, etc.)

```typescript
// ✅ PATRÓN RECOMENDADO
import { Link } from 'next-view-transitions'
import { PlusIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui'
import { cn } from '@/lib/utils'

export default async function ActionContainer() {
  return (
    <div className="flex items-center gap-2">
      {/* Desktop: Botón con texto */}
      <Link
        href="/admin/playas/nueva"
        className={cn(
          buttonVariants({ variant: 'default' }),
          'hidden w-fit sm:flex'
        )}
      >
        Crear
      </Link>
      
      {/* Mobile: Botón flotante con icono */}
      <Link
        href="/admin/playas/nueva"
        className={cn(
          buttonVariants({ variant: 'default' }),
          'fixed right-6 bottom-6 z-20 h-12 w-12 rounded-full p-2 sm:hidden'
        )}
      >
        <PlusIcon className="size-6" />
      </Link>
    </div>
  )
}
```

**Características clave:**
- ✅ Server Component
- ✅ Responsive: botón normal en desktop, flotante en mobile
- ✅ Usa `Link` de next-view-transitions para transiciones suaves
- ✅ Puede incluir dropdowns para acciones adicionales

### 3. ToolbarContainer

**Propósito:** Barra de herramientas con filtros, búsqueda y columnas visibles.

```typescript
// ✅ PATRÓN RECOMENDADO
'use client'

import { DataTableToolbar } from '@/components/ui/DataTable'
import { useGetPlayas } from '@/hooks/queries/playas/getPlayas'

import { PageParams } from '../../page'
import getColumns from '../TableContainer/Columns'

export default function ToolbarContainer({
  params
}: {
  params: Partial<PageParams>
}) {
  // 1. Obtener datos con filtros para la UI
  const { data: response, isLoading } = useGetPlayas({
    ...params,
    includeFilters: true
  })

  // 2. Obtener columnas disponibles
  const columns = getColumns()
  const availableColumns = columns
    .filter((column) => column.enableHiding !== false)
    .map((column) => ({
      id: column.id || '',
      label: (column.meta || '').toString()
    }))

  // 3. Renderizar toolbar con configuración
  return (
    <DataTableToolbar
      filters={{
        loading: isLoading,
        data: response?.filters
      }}
      availableColumns={availableColumns}
      search={{
        loading: isLoading,
        placeholder: 'Buscar por nombre, dirección o descripción',
        minLength: 1
      }}
    />
  )
}
```

**Características clave:**
- ✅ Client Component (usa hooks)
- ✅ Usa React Query para obtener filtros disponibles
- ✅ Configura búsqueda y columnas visibles
- ✅ Pasa parámetros al hook para sincronizar con URL

### 4. TableContainer

**Propósito:** Server Component que obtiene datos y los pasa al Client Component.

```typescript
// ✅ PATRÓN RECOMENDADO
import { getPlayas } from '@/services/playas'
import type { Playa } from '@/services/playas/types'
import type { Pagination } from '@/types/api'

import { PageParams } from '../../page'
import ColumnsProvider from './ColumnsProvider'

export type TableData = {
  data: Playa[]
  pagination: Pagination
}

export default async function TableContainer({
  params
}: {
  params: Partial<PageParams>
}) {
  // 1. Obtener datos del servidor
  const { data, error, pagination } = await getPlayas(params)

  // 2. Manejar errores
  if (error || !data || !pagination) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Hubo un problema</h3>
          <p className="text-muted-foreground">
            {error ||
              'Intente nuevamente o comuníquese con el area de sistemas'}
          </p>
        </div>
      </div>
    )
  }

  // 3. Pasar datos al Client Component
  return <ColumnsProvider data={data} pagination={pagination} />
}
```

**Características clave:**
- ✅ Server Component que obtiene datos
- ✅ Maneja errores con UI descriptiva
- ✅ Separa obtención de datos (server) de renderizado (client)

### 5. ColumnsProvider (Client Component)

**Propósito:** Client Component que renderiza la tabla con interactividad.

```typescript
// ✅ PATRÓN RECOMENDADO
'use client'

import { DataTable } from '@/components/ui/DataTable'

import { TableData } from '..'
import getColumns from './Columns'

export default function ColumnsProvider({ data, pagination }: TableData) {
  const columns = getColumns()

  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={pagination}
    />
  )
}
```

**Características clave:**
- ✅ Client Component para interactividad
- ✅ Recibe datos del Server Component padre
- ✅ Usa DataTable genérico con columnas específicas

### 6. Definición de Columnas

**Propósito:** Configuración de columnas para la tabla.

```typescript
// ✅ PATRÓN RECOMENDADO
'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ActionColumnButton, StatusBadge } from '@/components/ui'
import { CellLink, SimpleHeader, SortHeader } from '@/components/ui/DataTable'

import type { TableData } from '..'
import { DeleteButton } from './DeleteButton'

type TableDataType = TableData['data'][number]

// 1. Definir labels centralizados
const labels = {
  name: 'Nombre',
  address: 'Dirección',
  estado: 'Estado',
  actions: 'Acciones'
}

// 2. Helper para links
const getHref = (row: TableDataType) => `/admin/playas/${row.id}`

export default function getColumns(): ColumnDef<TableDataType>[] {
  return [
    // Columna con ordenamiento
    {
      id: 'name',
      accessorKey: 'nombre',
      meta: labels.name,
      enableHiding: false,
      header: () =>
        SortHeader({
          children: labels.name,
          id: 'name',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => {
        return (
          <CellLink href={getHref(row.original)} className="justify-start">
            <p className="text-start">{row.original.nombre || '-'}</p>
          </CellLink>
        )
      }
    },
    
    // Columna con badge de estado
    {
      id: 'estado',
      accessorKey: 'estado',
      meta: labels.estado,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.estado,
          id: 'estado',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          <StatusBadge status={row.original.estado} />
        </CellLink>
      )
    },
    
    // Columna de acciones
    {
      id: 'actions',
      accessorKey: 'actions',
      meta: labels.actions,
      header: () => <SimpleHeader>{labels.actions}</SimpleHeader>,
      enableHiding: false,
      cell: ({ row }) => {
        const { id } = row.original
        return (
          <div className="flex items-center justify-center gap-1">
            <ActionColumnButton
              icon="edit"
              tooltip="Editar"
              href={`/admin/playas/${id}`}
            />
            <DeleteButton id={id} />
          </div>
        )
      }
    }
  ]
}
```

**Características clave:**
- ✅ Usa `SortHeader` para columnas ordenables
- ✅ Usa `CellLink` para hacer toda la celda clickeable
- ✅ Columna de acciones siempre al final
- ✅ `enableHiding` controla si se puede ocultar la columna

---

## 🔧 Servicios y Capa de Datos

### Estructura de un Servicio

```
services/[entidad]/
├── types.ts              # Tipos Raw y transformados
├── transformers.ts       # Funciones de transformación
├── get[Entidad]s.ts     # Obtener lista
├── get[Entidad].ts      # Obtener uno
├── create[Entidad].ts   # Crear
├── update[Entidad].ts   # Actualizar
├── delete[Entidad].ts   # Eliminar
└── index.ts             # Barrel export
```

### 1. Types (`types.ts`)

```typescript
// ✅ PATRÓN RECOMENDADO
import { PaginationParams } from '@/types/api'

// Tipo Raw - Representa la base de datos (snake_case)
export type RawPlaya = {
  playa_id: string
  playa_dueno_id: string
  nombre: string | null
  direccion: string
  ciudad_id: string
  ciudad_nombre?: string
  ciudad_provincia?: string
  estado: PLAYA_ESTADO
  fecha_creacion: string
  fecha_modificacion: string
}

// Tipo Transformado - Uso en la aplicación (camelCase)
export type Playa = {
  id: string
  duenoId: string
  nombre: string | null
  direccion: string
  ciudadId: string
  ciudadNombre?: string
  ciudadProvincia?: string
  estado: PLAYA_ESTADO
  fechaCreacion: Date
  fechaModificacion: Date
}

// Parámetros para queries
export type GetPlayasParams = PaginationParams & {
  select?: string
  estado?: PlayaEstado | PlayaEstado[]
  ciudad?: string | string[]
}

// Parámetros para mutaciones
export type CreatePlayaRequest = {
  nombre?: string
  descripcion?: string
  direccion: string
  ciudad: string
  provincia: string
  latitud: number
  longitud: number
  horario: string
}
```

### 2. Transformers (`transformers.ts`)

```typescript
// ✅ PATRÓN RECOMENDADO
import type { Playa, RawPlaya } from './types'

// Transformar uno
export function transformPlaya(
  raw: RawPlaya | null | undefined
): Playa | null {
  if (!raw) return null

  return {
    id: raw.playa_id,
    duenoId: raw.playa_dueno_id,
    nombre: raw.nombre,
    direccion: raw.direccion,
    ciudadId: raw.ciudad_id,
    ciudadNombre: raw.ciudad_nombre,
    ciudadProvincia: raw.ciudad_provincia,
    estado: raw.estado,
    fechaCreacion: new Date(raw.fecha_creacion),
    fechaModificacion: new Date(raw.fecha_modificacion)
  }
}

// Transformar lista
export function transformListPlaya(
  raw: RawPlaya[] | null | undefined
): Playa[] {
  if (!raw) return []
  return raw
    .map((item) => transformPlaya(item))
    .filter(Boolean) as Playa[]
}
```

### 3. Get Service (`getPlayas.ts`)

```typescript
// ✅ PATRÓN RECOMENDADO
'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { extractAppliedFilters } from '@/utils/extractAppliedFilters'
import { getPagination } from '@/utils/pagination'
import { applySorting, createColumnMapping } from '@/utils/sortingUtils'

import { getPlayaFilters } from './getPlayaFilters'
import { transformListPlaya } from './transformers'
import type { GetPlayasParams, Playa, RawPlaya } from './types'

// 1. Mapeo de columnas para ordenamiento
const PLAYA_COLUMN_MAPPING = createColumnMapping({
  name: 'nombre',
  address: 'direccion',
  ciudad: 'ciudad_nombre',
  estado: 'estado'
} as const)

const DEFAULT_SELECT = '*'

// 2. Usar cache() de React para optimizar
export const getPlayas = cache(
  async (
    args: GetPlayasParams = { page: 1, limit: 100 }
  ): Promise<ApiResponse<Playa[]>> => {
    const supabase = await createClient()
    const { page, limit, skip } = getPagination(args)
    const {
      sortBy,
      query,
      select = DEFAULT_SELECT,
      includeFilters,
      estado,
      ciudad
    } = args

    // 3. Construir query base
    let requestQuery = supabase
      .from('v_playas')
      .select(select, { count: 'exact' })
      .is('fecha_eliminacion', null)

    // 4. Aplicar búsqueda
    if (query) {
      requestQuery = requestQuery.or(
        `descripcion.ilike.*${query}*,direccion.ilike.*${query}*,nombre.ilike.*${query}*`
      )
    }

    // 5. Aplicar filtros
    if (estado) {
      if (Array.isArray(estado)) {
        requestQuery = requestQuery.in('estado', estado)
      } else {
        requestQuery = requestQuery.eq('estado', estado)
      }
    }

    if (ciudad) {
      if (Array.isArray(ciudad)) {
        requestQuery = requestQuery.in('ciudad_id', ciudad)
      } else {
        requestQuery = requestQuery.eq('ciudad_id', ciudad)
      }
    }

    // 6. Aplicar ordenamiento
    requestQuery = applySorting(requestQuery, {
      sortBy,
      columnMapping: PLAYA_COLUMN_MAPPING,
      defaultSort: { column: 'fecha_creacion', direction: 'desc' }
    })

    // 7. Obtener filtros disponibles (para UI)
    let filters = undefined
    if (includeFilters) {
      const appliedFilters = extractAppliedFilters(args)
      const filtersResponse = await getPlayaFilters({
        query,
        appliedFilters
      })
      filters = filtersResponse.data || undefined
    }

    // 8. Aplicar paginación
    requestQuery = requestQuery.range(skip, skip + limit - 1)

    // 9. Ejecutar query
    const { data, error, count } = await requestQuery.overrideTypes<
      RawPlaya[],
      { merge: false }
    >()

    // 10. Calcular paginación
    const total = typeof count === 'number' ? count : 0
    const currentPageSize = limit
    const lastPage = total > 0 ? Math.ceil(total / currentPageSize) : 1

    // 11. Retornar resultado transformado
    return {
      data: transformListPlaya(data),
      error: error ? translateDBError(error.message) : null,
      pagination: {
        total,
        lastPage,
        currentPage: page
      },
      filters
    }
  }
)
```

### 4. Create Service (`createPlaya.ts`)

```typescript
// ✅ PATRÓN RECOMENDADO
'use server'

import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import type { CreatePlayaRequest } from '@/schemas/playa'
import { findOrCreateCiudad } from '@/services/ciudades'
import type { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { revalidateAdminPath, revalidatePlayas } from '@/utils/revalidation'

import { transformPlaya } from './transformers'
import type { Playa } from './types'

export async function createPlaya(
  data: CreatePlayaRequest
): Promise<ApiResponse<Playa>> {
  const supabase = await createClient()

  // 1. Verificar autenticación
  const user = await getAuthenticatedUser()
  if (!user) {
    return {
      data: null,
      error: 'Debes estar autenticado para crear una playa'
    }
  }

  // 2. Validaciones de negocio (verificar duplicados, etc.)
  const { data: existingPlaya, error: checkError } = await supabase
    .from('playa')
    .select('playa_id')
    .eq('playa_dueno_id', user.id)
    .eq('latitud', data.latitud)
    .eq('longitud', data.longitud)
    .is('fecha_eliminacion', null)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    return {
      data: null,
      error: translateDBError(checkError.message)
    }
  }

  if (existingPlaya) {
    return {
      data: null,
      error: 'Ya tienes una playa registrada en esta ubicación'
    }
  }

  // 3. Preparar datos relacionados (ciudad)
  const ciudadResult = await findOrCreateCiudad({
    nombre: data.ciudad,
    provincia: data.provincia
  })

  if (ciudadResult.error || !ciudadResult.data) {
    return {
      data: null,
      error: ciudadResult.error || 'Error al procesar la ciudad'
    }
  }

  // 4. Insertar en base de datos
  const { data: rawPlaya, error } = await supabase
    .from('playa')
    .insert({
      playa_dueno_id: user.id,
      nombre: data.nombre || null,
      direccion: data.direccion,
      descripcion: data.descripcion || '',
      ciudad_id: ciudadResult.data.id,
      latitud: data.latitud,
      longitud: data.longitud,
      horario: data.horario
    })
    .select(
      `
      *,
      ciudad:ciudad_id (
        ciudad_id,
        nombre,
        provincia
      )
    `
    )
    .single()

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  // 5. Revalidar cache
  await revalidatePlayas()
  await revalidateAdminPath()

  // 6. Retornar resultado transformado
  return {
    data: transformPlaya(rawPlaya),
    error: null
  }
}
```

**Características clave de servicios:**
- ✅ Siempre usar `'use server'`
- ✅ Usar `cache()` para GET operations
- ✅ Validar autenticación cuando corresponda
- ✅ Validaciones de negocio antes de insertar
- ✅ Usar transformers para convertir datos
- ✅ Revalidar cache después de mutaciones
- ✅ Retornar siempre `ApiResponse<T>`

---

## 🎨 Componentes y UI

### Formularios de Creación

```typescript
// ✅ PATRÓN RECOMENDADO
'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { createPlayaAction } from '@/app/admin/playas/actions'
import { Button, Form } from '@/components/ui'
import { type CreatePlayaRequest, createPlayaSchema } from '@/schemas/playa'

import Fieldset from './Fieldset'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export const DEFAULT_VALUES: CreatePlayaRequest = {
  nombre: '',
  descripcion: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  latitud: 0,
  longitud: 0,
  horario: ''
}

export default function CreatePlayaForm() {
  // 1. useActionState para manejar server action
  const [formState, formAction, pending] = useActionState(createPlayaAction, {
    success: false
  } as FormState)
  
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  // 2. React Hook Form con Zod
  const form = useForm<CreatePlayaRequest>({
    resolver: zodResolver(createPlayaSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: DEFAULT_VALUES
  })

  // 3. Manejar resultado del server action
  useEffect(() => {
    if (formState.success) {
      toast.success('Playa creada correctamente')
      router.push('/admin/playas')
    } else if (formState.errors) {
      Object.entries(formState.errors).forEach(([field, errors]) => {
        if (field === 'general') {
          toast.error('Error', {
            description: errors.join(', '),
            duration: 6000
          })
        } else {
          errors.forEach((error) => {
            toast.error(`Error en ${field}`, {
              description: error,
              duration: 5000
            })
          })
        }
      })
    }
  }, [formState, router])

  const { handleSubmit } = form

  // 4. Submit con startTransition
  return (
    <Form {...form}>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit(() => {
          startTransition(() => {
            formAction(new FormData(formRef.current!))
          })
        })}
        className="space-y-4"
      >
        <Fieldset />
        <div className="mt-8 flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/playas')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending} loading={pending}>
            Crear playa
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

### Formularios de Edición

```typescript
// ✅ PATRÓN RECOMENDADO
'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import Fieldset from '@/app/admin/playas/nueva/components/CreatePlayaForm/Fieldset'
import { Button, Form, FormControl, FormField, Input } from '@/components/ui'
import { type UpdatePlayaFormRequest, updatePlayaSchema } from '@/schemas/playa'
import type { Playa } from '@/services/playas/types'
import { useSelectedPlaya } from '@/stores'

import { updatePlayaAction } from '../actions'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

interface PlayaDetailFormProps {
  playa: Playa
}

export default function PlayaDetailForm({ playa }: PlayaDetailFormProps) {
  const [formState, formAction, pending] = useActionState(updatePlayaAction, {
    success: false
  } as FormState)
  
  // 1. Estado para detectar cambios
  const [hasChanges, setHasChanges] = useState(false)
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const processedSuccessRef = useRef(false)

  // 2. Default values desde props
  const defaultValues: UpdatePlayaFormRequest = useMemo(
    () => ({
      id: playa.id,
      nombre: playa.nombre || '',
      descripcion: playa.descripcion || '',
      direccion: playa.direccion,
      ciudad: playa.ciudadNombre || '',
      provincia: playa.ciudadProvincia || '',
      latitud: playa.latitud || 0,
      longitud: playa.longitud || 0,
      horario: playa.horario
    }),
    [playa]
  )

  const form = useForm<UpdatePlayaFormRequest>({
    resolver: zodResolver(updatePlayaSchema),
    defaultValues,
    mode: 'onChange'
  })

  const { control, handleSubmit, reset, watch } = form
  const watchedValues = watch()

  // 3. Detectar cambios en el formulario
  useEffect(() => {
    const hasFormChanges = Object.keys(defaultValues).some((key) => {
      const currentValue = watchedValues[key as keyof UpdatePlayaFormRequest]
      const defaultValue = defaultValues[key as keyof UpdatePlayaFormRequest]
      return currentValue !== defaultValue
    })
    setHasChanges(hasFormChanges)
  }, [watchedValues, defaultValues])

  // 4. Manejar resultado
  useEffect(() => {
    if (formState.success && !processedSuccessRef.current) {
      processedSuccessRef.current = true
      toast.success('Playa actualizada exitosamente')
      router.refresh()
      router.push('/admin/playas')
    } else if (formState.errors) {
      Object.entries(formState.errors).forEach(([field, errors]) => {
        if (field === 'general') {
          toast.error('Error al actualizar la playa', {
            description: errors.join(', '),
            duration: 6000
          })
        }
      })
    }
  }, [formState.success, formState.errors, router])

  // 5. Reset handler
  const handleReset = () => {
    reset(defaultValues)
    setHasChanges(false)
  }

  return (
    <Form {...form}>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={(evt) => {
          evt.preventDefault()
          handleSubmit(() => {
            startTransition(() => {
              formAction(new FormData(formRef.current!))
            })
          })(evt)
        }}
        className="space-y-6"
      >
        <FormField
          control={control}
          name="id"
          render={({ field }) => (
            <FormControl>
              <Input {...field} type="hidden" />
            </FormControl>
          )}
        />

        <Fieldset />

        <div className="flex w-fit gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={pending || !hasChanges}
            className="flex-1"
          >
            Deshacer cambios
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/playas')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!hasChanges || pending}
            className="flex items-center gap-2"
            loading={pending}
          >
            Guardar
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

---

## 📋 Server Actions

### Patrón para Server Actions

```typescript
// ✅ PATRÓN RECOMENDADO
'use server'

import { revalidatePath } from 'next/cache'

import { createPlayaSchema } from '@/schemas/playa'
import { createPlaya } from '@/services/playas'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export async function createPlayaAction(
  prevState: FormState,
  payload: FormData
): Promise<FormState> {
  // 1. Validar que es FormData
  if (!(payload instanceof FormData)) {
    return {
      success: false,
      errors: { error: ['Datos de formulario inválidos'] }
    }
  }

  // 2. Convertir FormData a objeto
  const formData = Object.fromEntries(payload)

  // 3. Procesar campos (convertir tipos si es necesario)
  const processedData = {
    ...formData,
    latitud: formData.latitud ? Number(formData.latitud) : 0,
    longitud: formData.longitud ? Number(formData.longitud) : 0
  }

  // 4. Validar con Zod
  const parsed = createPlayaSchema.safeParse(processedData)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const fields: Record<string, string> = {}

    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString()
    }

    return {
      success: false,
      fields,
      errors
    }
  }

  // 5. Llamar al servicio
  const result = await createPlaya(parsed.data)

  if (result.error) {
    return {
      success: false,
      errors: { general: [result.error] }
    }
  }

  // 6. Revalidar paths
  revalidatePath('/admin/playas')

  return {
    success: true
  }
}
```

**Características clave:**
- ✅ Validar entrada con Zod
- ✅ Manejar errores por campo
- ✅ Revalidar paths después de mutación
- ✅ Retornar estado consistente

---

## 🪝 Hooks y React Query

### Wrapper de Server Action para Queries

```typescript
// ✅ PATRÓN RECOMENDADO
// app/admin/playas/queries.ts
'use server'

import { getPlayas } from '@/services/playas'
import type { GetPlayasParams } from '@/services/playas/types'

export async function getPlayasAction(params?: GetPlayasParams) {
  return await getPlayas(params)
}
```

### Hook con React Query

```typescript
// ✅ PATRÓN RECOMENDADO
// hooks/queries/playas/getPlayas.tsx
'use client'

import { useQuery } from '@tanstack/react-query'

import { getPlayasAction } from '@/app/admin/playas/queries'
import type { GetPlayasParams, Playa } from '@/services/playas'
import type { ApiResponse } from '@/types/api'

export function useGetPlayas(params?: GetPlayasParams) {
  return useQuery<ApiResponse<Playa[]>>({
    queryKey: ['playas', params],
    queryFn: async () => {
      return await getPlayasAction(params)
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchOnWindowFocus: false
  })
}
```

### Mutation con React Query

```typescript
// ✅ PATRÓN RECOMENDADO
// hooks/mutations/playas.tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updatePlayaEstado } from '@/services/playas'
import type { Playa } from '@/services/playas/types'

export function useUpdatePlayaEstado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      playaId,
      estado
    }: {
      playaId: string
      estado: string
    }) => {
      return await updatePlayaEstado(playaId, estado)
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error('Error', {
          description: result.error
        })
      } else {
        toast.success('Estado actualizado correctamente')
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['playas'] })
        queryClient.invalidateQueries({ queryKey: ['playa', result.data?.id] })
      }
    },
    onError: (error) => {
      toast.error('Error inesperado', {
        description: error.message
      })
    }
  })
}
```

---

## 🔍 Optimizaciones Identificadas

### 1. Caché y Revalidación

**✅ Implementado correctamente:**
```typescript
// Uso de cache() en servicios GET
export const getPlayas = cache(async (args) => {
  // ...
})

// Revalidación granular
await revalidatePlayas()
await revalidateTag(`playa-${playaId}`)
```

**⚠️ Oportunidad de mejora:**
```typescript
// Considerar usar unstable_cache para control más fino
import { unstable_cache } from 'next/cache'

export const getPlayas = unstable_cache(
  async (args) => {
    // ...
  },
  ['playas'],
  { revalidate: 60, tags: ['playas'] }
)
```

### 2. Vistas de Base de Datos

**✅ Implementado correctamente:**
```typescript
// Usar vistas para queries complejas
let requestQuery = supabase
  .from('v_playas') // Vista con JOINs pre-calculados
  .select('*')
```

**Beneficios:**
- Reduce queries complejas en el código
- Mejora performance con índices apropiados
- Centraliza lógica de negocio en la BD

### 3. Ordenamiento y Paginación

**✅ Implementado correctamente:**
```typescript
// Mapeo de columnas centralizado
const COLUMN_MAPPING = createColumnMapping({
  name: 'nombre',
  address: 'direccion'
})

// Aplicar ordenamiento con utilidad
requestQuery = applySorting(requestQuery, {
  sortBy,
  columnMapping: COLUMN_MAPPING,
  defaultSort: { column: 'fecha_creacion', direction: 'desc' }
})
```

### 4. Filtros Dinámicos

**✅ Implementado correctamente:**
```typescript
// Obtener filtros disponibles para UI
if (includeFilters) {
  const appliedFilters = extractAppliedFilters(args)
  const filtersResponse = await getPlayaFilters({
    query,
    appliedFilters
  })
  filters = filtersResponse.data || undefined
}
```

### 5. Transformación de Datos

**✅ Implementado correctamente:**
```typescript
// Transformers para convertir snake_case a camelCase
export function transformPlaya(raw: RawPlaya): Playa | null {
  if (!raw) return null
  return {
    id: raw.playa_id,
    nombre: raw.nombre,
    // ... conversión completa
  }
}
```

**⚠️ Considerar para casos complejos:**
```typescript
// Usar zod para validación adicional
const PlayaSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().nullable(),
  // ... esquema completo
})

export function transformPlaya(raw: RawPlaya): Playa | null {
  try {
    return PlayaSchema.parse({
      id: raw.playa_id,
      // ...
    })
  } catch {
    return null
  }
}
```

### 6. Error Handling

**✅ Implementado correctamente:**
```typescript
// Traducción de errores de DB
import { translateDBError } from '@/utils/errorMessages'

if (error) {
  return {
    data: null,
    error: translateDBError(error.message)
  }
}
```

### 7. Componentes Server vs Client

**✅ Separación correcta:**
```typescript
// Server Component obtiene datos
export default async function TableContainer({ params }) {
  const { data } = await getPlayas(params)
  return <ColumnsProvider data={data} />
}

// Client Component maneja interactividad
'use client'
export default function ColumnsProvider({ data }) {
  return <DataTable data={data} />
}
```

---

## ✅ Checklist de Desarrollo

### Al crear un nuevo módulo CRUD:

#### 1. Estructura de Archivos
- [ ] Crear carpeta `app/admin/[modulo]/`
- [ ] Crear `page.tsx` (lista)
- [ ] Crear `actions.ts`
- [ ] Crear carpeta `nueva/` con formulario de creación
- [ ] Crear carpeta `[id]/` con formulario de edición
- [ ] Crear carpeta `components/` con ActionContainer, ToolbarContainer, TableContainer

#### 2. Servicios
- [ ] Crear `services/[modulo]/types.ts` con tipos Raw y transformados
- [ ] Crear `services/[modulo]/transformers.ts`
- [ ] Implementar `get[Modulo]s.ts` con paginación y filtros
- [ ] Implementar `get[Modulo].ts` para obtener uno
- [ ] Implementar `create[Modulo].ts`
- [ ] Implementar `update[Modulo].ts`
- [ ] Implementar `delete[Modulo].ts`
- [ ] Crear `index.ts` con exports

#### 3. Schemas
- [ ] Crear `schemas/[modulo].ts` con validaciones Zod
- [ ] Definir schema para creación
- [ ] Definir schema para actualización
- [ ] Exportar tipos inferidos

#### 4. Componentes
- [ ] Implementar ActionContainer con botones
- [ ] Implementar ToolbarContainer con filtros
- [ ] Implementar TableContainer (Server Component)
- [ ] Implementar ColumnsProvider (Client Component)
- [ ] Definir columnas con ordenamiento
- [ ] Implementar DeleteButton si aplica

#### 5. Formularios
- [ ] Crear formulario de creación con React Hook Form
- [ ] Crear formulario de edición con React Hook Form
- [ ] Implementar Fieldset reutilizable
- [ ] Manejar estados de carga
- [ ] Implementar feedback con toasts

#### 6. Server Actions
- [ ] Implementar action para crear
- [ ] Implementar action para actualizar
- [ ] Implementar action para eliminar
- [ ] Validar con Zod en cada action
- [ ] Revalidar cache apropiadamente

#### 7. Hooks (si se usa React Query)
- [ ] Crear wrapper de server action en `queries.ts`
- [ ] Implementar hook `useGet[Modulo]s`
- [ ] Implementar mutations si aplica
- [ ] Configurar invalidación de queries

#### 8. Base de Datos
- [ ] Verificar que existe la tabla
- [ ] Verificar que existen los índices
- [ ] Crear vista si es necesario
- [ ] Verificar RLS policies

#### 9. Testing
- [ ] Probar creación
- [ ] Probar edición
- [ ] Probar eliminación
- [ ] Probar filtros y búsqueda
- [ ] Probar ordenamiento
- [ ] Probar paginación

#### 10. Documentación
- [ ] Documentar tipos especiales
- [ ] Documentar lógica de negocio compleja
- [ ] Actualizar README si aplica

---

## 📚 Recursos Adicionales

### Documentación del Proyecto
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura general
- [CODE_CONVENTIONS.md](./CODE_CONVENTIONS.md) - Convenciones de código
- [DATABASE.md](./DATABASE.md) - Estructura de base de datos
- [RLS_VIEWS.md](./RLS_VIEWS.md) - Políticas de seguridad

### Módulos de Referencia
- **Playas**: Módulo más completo, usar como referencia principal
- **Plazas**: Buen ejemplo de filtros complejos
- **Tarifas**: Ejemplo de relaciones múltiples
- **Playeros**: Ejemplo de invitaciones y validaciones

### Componentes Reutilizables
- `DataTable`: Tabla con ordenamiento, paginación y filtros
- `DataTableToolbar`: Barra de herramientas consistente
- `StatusBadge`: Badges de estado estandarizados
- `ActionColumnButton`: Botones de acción en tablas

---

## 🎓 Conclusión

Este documento proporciona una guía completa para desarrollar módulos siguiendo los patrones establecidos en el proyecto. Los puntos clave son:

1. **Consistencia**: Todos los módulos siguen la misma estructura
2. **Separación de responsabilidades**: Server Components para datos, Client Components para interactividad
3. **Tipado fuerte**: TypeScript en toda la aplicación
4. **Validación robusta**: Zod para schemas, validación en client y server
5. **Performance**: Cache apropiado, vistas de BD, lazy loading
6. **UX**: Feedback claro, estados de carga, manejo de errores

**Módulo de referencia principal: Playas** (`app/admin/playas/`)

Para cualquier duda, revisar primero el módulo de Playas y seguir los patrones establecidos.
