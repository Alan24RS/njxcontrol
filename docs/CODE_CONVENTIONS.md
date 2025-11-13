# 💻 Convenciones de Código

## 🎯 Principios Generales

### Filosofía del Proyecto
- **Simplicidad**: Código claro y directo
- **Consistencia**: Patrones uniformes en todo el proyecto
- **Mantenibilidad**: Fácil de entender y modificar
- **Performance**: Optimizado para velocidad y eficiencia

## 🏗️ Arquitectura de Componentes

### Server Components por Defecto

```typescript
// ✅ CORRECTO: Server Component por defecto
export default function PlayasPage() {
  const playas = await getPlayas()
  return <PlayasList playas={playas} />
}

// ✅ CORRECTO: Client Component solo cuando es necesario
'use client'
export default function PlayasForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  // ... lógica de estado
}
```

### Estructura de Componentes

```typescript
// Estructura recomendada para componentes
interface ComponentProps {
  // Props tipadas
  title: string
  onAction?: () => void
  children?: React.ReactNode
}

export default function ComponentName({ title, onAction, children }: ComponentProps) {
  // 1. Hooks (si es Client Component)
  // 2. Estados locales
  // 3. Efectos
  // 4. Handlers
  // 5. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

## 📝 Nomenclatura

### Archivos y Carpetas

**REGLA FUNDAMENTAL: La capitalización del archivo debe coincidir con su contenido principal**

#### 📋 Tabla de Convenciones de Archivos

| Tipo de Archivo | Convención | Ejemplos Correctos ✅ | Ejemplos Incorrectos ❌ |
|----------------|------------|---------------------|------------------------|
| **Componentes React** | **PascalCase** | `Button.tsx`<br>`UserProfile.tsx`<br>`PlayaCard.tsx` | `button.tsx`<br>`userProfile.tsx`<br>`playa-card.tsx` |
| **Servicios (funciones)** | **camelCase** | `getPlayas.ts`<br>`createUser.ts`<br>`deleteItem.ts` | `GetPlayas.ts`<br>`CreateUser.ts`<br>`DeleteItem.ts` |
| **Archivos de tipos** | **lowercase** | `types.ts`<br>`transformers.ts`<br>`index.ts` | `Types.ts`<br>`Transformers.ts`<br>`Index.ts` |
| **Utilidades** | **camelCase** | `formatDate.ts`<br>`errorMessages.ts`<br>`validators.ts` | `FormatDate.ts`<br>`ErrorMessages.ts` |
| **Hooks personalizados** | **camelCase** | `useDebounce.ts`<br>`useAuth.tsx`<br>`usePlayas.tsx` | `UseDebounce.ts`<br>`UseAuth.tsx` |
| **Constantes/Enums** | **camelCase** | `constants.ts`<br>`roles.ts`<br>`estados.ts` | `Constants.ts`<br>`Roles.ts` |

#### 📁 Ejemplos Completos

```typescript
// ✅ CORRECTO: Estructura de componentes
components/
├── ui/                    # Componentes base
│   ├── Button.tsx         # ✅ PascalCase
│   ├── Input.tsx          # ✅ PascalCase
│   ├── Modal.tsx          # ✅ PascalCase
│   ├── DataTable/         # ✅ PascalCase para carpeta de componente
│   │   ├── index.tsx      # ✅ lowercase
│   │   └── types.ts       # ✅ lowercase
│   └── index.ts           # ✅ lowercase (barrel export)
├── layout/                # Componentes de layout
│   ├── Header.tsx         # ✅ PascalCase
│   ├── Sidebar.tsx        # ✅ PascalCase
│   └── Breadcrumb.tsx     # ✅ PascalCase
└── admin/                 # Componentes específicos
    ├── PlayasList.tsx     # ✅ PascalCase
    ├── PlayasForm.tsx     # ✅ PascalCase
    └── PlayasFilters.tsx  # ✅ PascalCase

// ✅ CORRECTO: Estructura de servicios
services/
├── playas/
│   ├── types.ts           # ✅ lowercase
│   ├── transformers.ts    # ✅ lowercase
│   ├── getPlayas.ts       # ✅ camelCase (función)
│   ├── getPlaya.ts        # ✅ camelCase (función)
│   ├── createPlaya.ts     # ✅ camelCase (función)
│   ├── updatePlaya.ts     # ✅ camelCase (función)
│   ├── deletePlaya.ts     # ✅ camelCase (función)
│   └── index.ts           # ✅ lowercase
└── playeros/
    ├── types.ts           # ✅ lowercase
    ├── transformers.ts    # ✅ lowercase
    ├── invitePlayero.ts   # ✅ camelCase (función)
    ├── validateEmail.ts   # ✅ camelCase (función)
    └── index.ts           # ✅ lowercase

// ❌ INCORRECTO: Errores comunes
services/
├── playas/
│   ├── Types.ts           # ❌ Debería ser types.ts
│   ├── Transformers.ts    # ❌ Debería ser transformers.ts
│   ├── GetPlayas.ts       # ❌ Debería ser getPlayas.ts
│   ├── Playas.ts          # ❌ No agrupa funciones en un archivo
│   └── Index.ts           # ❌ Debería ser index.ts

components/
└── ui/
    ├── button.tsx         # ❌ Debería ser Button.tsx
    ├── input.tsx          # ❌ Debería ser Input.tsx
    └── modal.tsx          # ❌ Debería ser Modal.tsx

// ✅ CORRECTO: Hooks y utilidades
hooks/
├── useDebounce.ts         # ✅ camelCase
├── useAuth.tsx            # ✅ camelCase
└── queries/
    └── useGetPlayas.tsx   # ✅ camelCase

utils/
├── formatDate.ts          # ✅ camelCase
├── errorMessages.ts       # ✅ camelCase
└── validators.ts          # ✅ camelCase

constants/
├── roles.ts               # ✅ camelCase
├── estados.ts             # ✅ camelCase
└── validations.ts         # ✅ camelCase
```

#### ⚠️ Casos Especiales

1. **Archivos de barril (index.ts)**: Siempre en **lowercase**
   ```typescript
   // ✅ Correcto
   index.ts
   index.tsx
   
   // ❌ Incorrecto
   Index.ts
   Index.tsx
   ```

2. **Archivos de configuración**: Siempre en **lowercase** o **kebab-case**
   ```typescript
   // ✅ Correcto
   next.config.ts
   tailwind.config.ts
   eslint.config.mjs
   
   // ❌ Incorrecto
   Next.Config.ts
   Tailwind.Config.ts
   ```

3. **Carpetas**: Generalmente **lowercase** o **kebab-case**, excepto cuando contienen un componente principal
   ```typescript
   // ✅ Correcto
   services/playas/
   components/ui/DataTable/    # PascalCase porque DataTable es el componente principal
   hooks/queries/
   
   // ❌ Incorrecto
   Services/Playas/
   Components/UI/
   ```

### Variables y Funciones

```typescript
// ✅ CORRECTO: camelCase para variables y funciones
const playasList = await getPlayas()
const isPlayeroActive = checkPlayeroStatus(playeroId)

// ✅ CORRECTO: PascalCase para componentes y tipos
interface PlayasListProps {
  playas: Playa[]
  onPlayaSelect: (playa: Playa) => void
}

export default function PlayasList({ playas, onPlayaSelect }: PlayasListProps) {
  // ...
}

// ✅ CORRECTO: SCREAMING_SNAKE_CASE para constantes
const MAX_PLAZAS_PER_PLAYA = 50
const DEFAULT_TARIFA_DIARIA = 1000
```

### Tipos e Interfaces

```typescript
// ✅ CORRECTO: Interfaces para objetos complejos
interface Playa {
  playa_id: string
  nombre: string
  direccion: string
  estado: PlayaEstado
  dueno_id: string
  created_at: string
  updated_at: string
}

// ✅ CORRECTO: Types para uniones y primitivos
type PlayaEstado = 'ACTIVA' | 'INACTIVA' | 'MANTENIMIENTO'
type PlayaFormData = Pick<Playa, 'nombre' | 'direccion'>

// ✅ CORRECTO: Enums para valores fijos
enum RolUsuario {
  DUENO = 'DUENO',
  PLAYERO = 'PLAYERO',
  ADMIN = 'ADMIN'
}
```

## 🎨 Manejo de Formularios y Datos

### Patrones de Implementación

El proyecto utiliza diferentes patrones según el tipo de operación:

1. **Server Actions**: Para CRUD operations (create/edit/delete)
2. **TanStack Query Mutations**: Para status updates y operaciones complejas
3. **TanStack Query (useQuery)**: Para lectura de datos en Client Components

> **📚 Para más detalles, consulta:** `.cursor/rules/form-patterns.mdc`

### Obtención de Datos en Client Components

```typescript
// ✅ CORRECTO: Patrón con Server Action wrapper
// app/admin/playas/queries.ts
'use server'

import { getPlayas } from '@/services/playas'
import type { GetPlayasParams } from '@/services/playas/types'

export async function getPlayasAction(params?: GetPlayasParams) {
  return await getPlayas(params)
}

// hooks/queries/playas/getPlayas.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { getPlayasAction } from '@/app/admin/playas/queries'
import type { Playa } from '@/services/playas'
import type { ApiResponse } from '@/types/api'

export function useGetPlayas(params?: GetPlayasParams) {
  return useQuery<ApiResponse<Playa[]>>({
    queryKey: ['playas', params],
    queryFn: async () => {
      return await getPlayasAction(params)
    },
    staleTime: 30 * 1000
  })
}

// Component
'use client'

import { useGetPlayas } from '@/hooks/queries/playas/getPlayas'

export function PlayasList() {
  const { data, isLoading, error } = useGetPlayas({ page: 1, limit: 20 })

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage />

  return (
    <div>
      {data?.data?.map((playa) => (
        <PlayaCard key={playa.id} playa={playa} />
      ))}
    </div>
  )
}
```

**⚠️ IMPORTANTE:** Los servicios que usan `createClient()` de `@/lib/supabase/server` NO pueden ser llamados directamente desde Client Components porque importan `next/headers`. Siempre debes crear un Server Action wrapper en `queries.ts`.

### React Hook Form + Zod

```typescript
// ✅ CORRECTO: Schema de validación
import { z } from 'zod'

const playaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  horario_apertura: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido'),
  horario_cierre: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido')
})

type PlayaFormData = z.infer<typeof playaSchema>

// ✅ CORRECTO: Componente de formulario
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export default function PlayaForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<PlayaFormData>({
    resolver: zodResolver(playaSchema)
  })

  const onSubmit = async (data: PlayaFormData) => {
    try {
      await createPlaya(data)
      // Manejar éxito
    } catch (error) {
      // Manejar error
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('nombre')}
        error={errors.nombre?.message}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creando...' : 'Crear Playa'}
      </Button>
    </form>
  )
}
```

### Manejo de Errores

```typescript
// ✅ CORRECTO: Manejo de errores en formularios
const onSubmit = async (data: PlayaFormData) => {
  try {
    setIsSubmitting(true)
    await createPlaya(data)
    toast.success('Playa creada exitosamente')
    router.push('/admin/playas')
  } catch (error) {
    if (error instanceof ValidationError) {
      setFieldErrors(error.errors)
    } else {
      toast.error('Error al crear la playa')
    }
  } finally {
    setIsSubmitting(false)
  }
}
```

## 🗄️ Gestión de Estado

### Estado Local

```typescript
// ✅ CORRECTO: useState para estado simple
const [isLoading, setIsLoading] = useState(false)
const [playas, setPlayas] = useState<Playa[]>([])

// ✅ CORRECTO: useReducer para estado complejo
const [state, dispatch] = useReducer(playasReducer, initialState)
```

### Estado Global

```typescript
// ✅ CORRECTO: Context para estado compartido
interface PlayaSelectorContextType {
  selectedPlaya: Playa | null
  setSelectedPlaya: (playa: Playa | null) => void
}

export const PlayaSelectorContext = createContext<PlayaSelectorContextType | null>(null)

export function usePlayaSelector() {
  const context = useContext(PlayaSelectorContext)
  if (!context) {
    throw new Error('usePlayaSelector must be used within PlayaSelectorProvider')
  }
  return context
}
```

### Servicios y API

```typescript
// ✅ CORRECTO: Servicios tipados
export async function createPlaya(data: PlayaFormData): Promise<Playa> {
  const { data: playa, error } = await supabase
    .from('playa')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Error al crear playa: ${error.message}`)
  }

  return playa
}

// ✅ CORRECTO: Hooks personalizados para lógica reutilizable
export function usePlayas() {
  const [playas, setPlayas] = useState<Playa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlayas() {
      try {
        setIsLoading(true)
        const data = await getPlayas()
        setPlayas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlayas()
  }, [])

  return { playas, isLoading, error, refetch: fetchPlayas }
}
```

## 📂 Estructura de Servicios

### Patrón Estándar de Servicios

Todos los servicios deben seguir esta estructura consistente para garantizar mantenibilidad y escalabilidad:

```
services/
├── caracteristicas/
│   ├── types.ts           # Definición de tipos
│   ├── transformers.ts    # Funciones de transformación
│   ├── getCaracteristicas.ts
│   └── index.ts          # Exportaciones centralizadas
├── playas/
│   ├── types.ts
│   ├── transformers.ts
│   ├── getPlayas.ts
│   ├── createPlaya.ts
│   ├── updatePlaya.ts
│   └── index.ts
```

### 1. Archivo `types.ts`

Define todos los tipos relacionados con el servicio:

```typescript
// ✅ CORRECTO: Estructura de types.ts
import { PaginationParams } from '@/types/api'

// Tipo Raw - representa la estructura de la base de datos (snake_case)
export type RawCaracteristica = {
  caracteristica_id: number
  nombre: string
  fecha_creacion: string
  fecha_modificacion: string
}

// Tipo Transformado - estructura de la aplicación (camelCase)
export type Caracteristica = {
  id: number
  nombre: string
  fechaCreacion: Date
  fechaModificacion: Date
}

// Parámetros para operaciones GET
export type GetCaracteristicasParams = PaginationParams & {
  sortBy?: string
  order?: 'asc' | 'desc'
}

// Parámetros para operaciones CREATE/UPDATE
export type CreateCaracteristicaParams = {
  nombre: string
}

export type UpdateCaracteristicaParams = {
  id: number
  nombre: string
}
```

**Convenciones de tipos:**
- `RawX`: tipo que representa datos directos de la base de datos (snake_case)
- `X`: tipo transformado para uso en la aplicación (camelCase)
- `GetXParams`: parámetros para operaciones de lectura (debe extender `PaginationParams` si aplica)
- `CreateXParams`: parámetros para operaciones de creación
- `UpdateXParams`: parámetros para operaciones de actualización

### 2. Archivo `transformers.ts`

Contiene funciones puras para transformar datos entre formatos:

```typescript
// ✅ CORRECTO: Estructura de transformers.ts
import type { Caracteristica, RawCaracteristica } from './types'

// Transformar un solo elemento
export function transformCaracteristica(
  raw: RawCaracteristica | null | undefined
): Caracteristica | null {
  if (!raw) return null

  return {
    id: raw.caracteristica_id,
    nombre: raw.nombre,
    fechaCreacion: new Date(raw.fecha_creacion),
    fechaModificacion: new Date(raw.fecha_modificacion)
  }
}

// Transformar una lista de elementos
export function transformListCaracteristica(
  raw: RawCaracteristica[] | null | undefined
): Caracteristica[] {
  if (!raw) return []

  return raw
    .map((item) => transformCaracteristica(item))
    .filter(Boolean) as Caracteristica[]
}
```

**Convenciones de transformers:**
- `transformX()`: transforma un solo elemento
- `transformListX()`: transforma una lista de elementos
- Siempre manejar casos `null` y `undefined`
- Las funciones deben ser puras (sin efectos secundarios)
- Transformar snake_case a camelCase
- Convertir strings de fecha a objetos `Date`

### 3. Funciones de Servicio

Cada operación en su propio archivo:

```typescript
// ✅ CORRECTO: getCaracteristicas.ts
'use server'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformListCaracteristica } from './transformers'
import type {
  Caracteristica,
  GetCaracteristicasParams,
  RawCaracteristica
} from './types'

export const getCaracteristicas = cache(
  async (
    args?: GetCaracteristicasParams
  ): Promise<ApiResponse<Caracteristica[]>> => {
    const supabase = await createClient()

    let queryBuilder = supabase.from('caracteristica').select('*')

    if (args?.query) {
      queryBuilder = queryBuilder.ilike('nombre', `%${args.query}%`)
    }

    const { data, error } = await queryBuilder.order('nombre', {
      ascending: true
    })

    if (error) {
      return {
        data: null,
        error: translateDBError(error.message)
      }
    }

    return {
      data: transformListCaracteristica(data as RawCaracteristica[]),
      error: null
    }
  }
)
```

**Convenciones de funciones de servicio:**
- Usar `'use server'` al inicio del archivo
- Usar `cache()` de React para funciones GET cuando sea apropiado
- Siempre tipar el retorno como `Promise<ApiResponse<T>>`
- Usar transformers para convertir datos Raw a tipos de aplicación
- Manejar errores con `translateDBError()`
- Retornar siempre un objeto con estructura `{ data, error }`

### Servicios con Paginación y Ordenamiento

Para servicios que requieren paginación y ordenamiento (especialmente con vistas de base de datos):

```typescript
// ✅ CORRECTO: getTarifas.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'
import { getPagination } from '@/utils/pagination'
import { applySorting, createColumnMapping } from '@/utils/sortingUtils'

import { transformListTarifas } from './transformers'
import type { GetTarifasParams, RawTarifaView, Tarifa } from './types'

// 1. Mapeo de columnas del frontend a campos de la vista/tabla
const TARIFA_COLUMN_MAPPING = createColumnMapping({
  tipoPlaza: 'tipo_plaza_nombre',
  modalidadOcupacion: 'modalidad_ocupacion_order', // Campo calculado en vista
  precioBase: 'precio_base',
  fechaCreacion: 'fecha_creacion'
} as const)

export async function getTarifas(
  args: GetTarifasParams
): Promise<ApiResponse<Tarifa[]>> {
  const supabase = await createClient()
  const { page, limit, skip } = getPagination(args)
  const { playaId, sortBy } = args

  // 2. Query base (usar vista cuando sea necesario)
  let requestQuery = supabase
    .from('v_tarifas') // Vista con campos calculados
    .select('*', { count: 'exact' })
    .eq('playa_id', playaId)

  // 3. Aplicar ordenamiento con applySorting
  requestQuery = applySorting(requestQuery, {
    sortBy,
    columnMapping: TARIFA_COLUMN_MAPPING,
    defaultSort: {
      column: 'fecha_creacion',
      direction: 'desc'
    }
  })

  // 4. Aplicar paginación
  requestQuery = requestQuery.range(skip, skip + limit - 1)

  // 5. Ejecutar query
  const { data, error, count } = await requestQuery.overrideTypes<
    RawTarifaView[],
    { merge: false }
  >()

  const total = typeof count === 'number' ? count : 0
  const lastPage = total > 0 ? Math.ceil(total / limit) : 1

  return {
    data: transformListTarifas(data),
    error: error ? translateDBError(error.message) : null,
    pagination: {
      total,
      lastPage,
      currentPage: page
    }
  }
}
```

**Convenciones de ordenamiento:**
- Usar `createColumnMapping()` para mapear columnas del frontend a DB
- Usar `applySorting()` con el mapeo y default sort
- Mapear a campos calculados en vistas cuando se necesite ordenamiento especial (ej: ordenar enums alfabéticamente)
- Aplicar ordenamiento ANTES de paginación
- Usar `getPagination()` para calcular skip, limit, page

**Cuándo usar vistas:**
- Cuando necesitas ordenar enums alfabéticamente por sus etiquetas traducidas
- Cuando necesitas campos calculados para ordenamiento (ej: `modalidad_ocupacion_order`)
- Cuando necesitas JOINs frecuentes para mostrar datos relacionados

**Ejemplo de vista para ordenamiento:**
```sql
-- Vista con campo calculado para ordenamiento alfabético
CREATE OR REPLACE VIEW v_metodos_pago_playa AS
SELECT 
    mpp.playa_id,
    mpp.metodo_pago,
    mpp.estado,
    mpp.fecha_creacion,
    CASE mpp.metodo_pago
        WHEN 'EFECTIVO' THEN 'Efectivo'
        WHEN 'MERCADO_PAGO' THEN 'Mercado Pago'
        WHEN 'TRANSFERENCIA' THEN 'Transferencia'
    END as metodo_pago_label  -- Campo para ordenamiento
FROM metodo_pago_playa mpp;
```

Luego en el servicio, mapear `metodoPago` a `metodo_pago_label`:
```typescript
const COLUMN_MAPPING = createColumnMapping({
  metodoPago: 'metodo_pago_label', // Ordena alfabéticamente por etiqueta
  estado: 'estado',
  fechaCreacion: 'fecha_creacion'
})
```

### 4. Archivo `index.ts`

Centraliza todas las exportaciones del módulo:

```typescript
// ✅ CORRECTO: index.ts
export * from './getCaracteristicas'
export * from './createCaracteristica'
export * from './updateCaracteristica'
export * from './deleteCaracteristica'
export * from './transformers'
export * from './types'
```

**Convenciones de index.ts:**
- Exportar todo con `export *` para simplicidad
- Mantener el orden alfabético
- Incluir siempre `transformers` y `types`

### Ejemplo Completo: Servicio de Abonos

```typescript
// types.ts
export type RawAbono = {
  playa_id: string
  plaza_id: string
  fecha_hora_inicio: string
  precio_mensual: number
  estado: 'ACTIVO' | 'FINALIZADO' | 'SUSPENDIDO'
}

export type Abono = {
  playaId: string
  plazaId: string
  fechaHoraInicio: Date
  precioMensual: number
  estado: 'ACTIVO' | 'FINALIZADO' | 'SUSPENDIDO'
}

export type GetAbonosParams = PaginationParams & {
  estado?: string[]
  playaId?: string
}

// transformers.ts
export function transformAbono(
  raw: RawAbono | null | undefined
): Abono | null {
  if (!raw) return null

  return {
    playaId: raw.playa_id,
    plazaId: raw.plaza_id,
    fechaHoraInicio: new Date(raw.fecha_hora_inicio),
    precioMensual: Number(raw.precio_mensual),
    estado: raw.estado
  }
}

export function transformListAbono(
  raw: RawAbono[] | null | undefined
): Abono[] {
  if (!raw) return []

  return raw.map((item) => transformAbono(item)).filter(Boolean) as Abono[]
}

// getAbonos.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

import { transformListAbono } from './transformers'
import type { Abono, GetAbonosParams, RawAbono } from './types'

export async function getAbonos(
  params?: GetAbonosParams
): Promise<ApiResponse<Abono[]>> {
  const supabase = await createClient()

  let queryBuilder = supabase.from('abono').select('*')

  if (params?.estado) {
    queryBuilder = queryBuilder.in('estado', params.estado)
  }

  if (params?.playaId) {
    queryBuilder = queryBuilder.eq('playa_id', params.playaId)
  }

  const { data, error } = await queryBuilder

  if (error) {
    return {
      data: null,
      error: translateDBError(error.message)
    }
  }

  return {
    data: transformListAbono(data as RawAbono[]),
    error: null
  }
}

// index.ts
export * from './getAbonos'
export * from './createAbono'
export * from './finalizarAbono'
export * from './transformers'
export * from './types'
```

### Beneficios de este Patrón

1. **Consistencia**: Todos los servicios siguen la misma estructura
2. **Mantenibilidad**: Fácil encontrar y modificar código
3. **Reutilización**: Transformers pueden ser reutilizados
4. **Separación de responsabilidades**: Cada archivo tiene un propósito claro
5. **Tipado fuerte**: TypeScript garantiza seguridad de tipos
6. **Escalabilidad**: Fácil agregar nuevas operaciones sin afectar las existentes

## 🎨 Estilos y UI

### Tailwind CSS

```typescript
// ✅ CORRECTO: Clases de Tailwind organizadas
<div className="flex flex-col space-y-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">
    Gestión de Playas
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Contenido */}
  </div>
</div>

// ✅ CORRECTO: Componentes con variantes
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  danger: 'bg-red-600 hover:bg-red-700 text-white'
}

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
}
```

### Componentes Reutilizables

```typescript
// ✅ CORRECTO: Componente base reutilizable
interface InputProps {
  label?: string
  error?: string
  className?: string
  // ... otras props de input
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={cn(
          'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
```

## 🔧 Utilidades y Helpers

### Funciones Utilitarias

```typescript
// ✅ CORRECTO: Funciones puras y tipadas
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

// ✅ CORRECTO: Validaciones
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidCUIL(cuil: string): boolean {
  const cuilRegex = /^\d{2}-\d{8}-\d{1}$/
  return cuilRegex.test(cuil)
}
```

### Manejo de Errores

```typescript
// ✅ CORRECTO: Clases de error personalizadas
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public operation: string,
    public table?: string
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// ✅ CORRECTO: Función para manejar errores
export function handleError(error: unknown): string {
  if (error instanceof ValidationError) {
    return `Error de validación: ${error.message}`
  }
  
  if (error instanceof DatabaseError) {
    return `Error de base de datos: ${error.message}`
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'Error desconocido'
}
```

## 📦 Gestión de Dependencias

### Instalación

```bash
# ✅ CORRECTO: Usar pnpm como gestor de paquetes
pnpm add react-hook-form @hookform/resolvers zod
pnpm add -D @types/node

# ✅ CORRECTO: Instalar dependencias de desarrollo
pnpm add -D eslint prettier typescript
```

### Imports

```typescript
// ✅ CORRECTO: Imports organizados
// 1. React y Next.js
import React from 'react'
import { useRouter } from 'next/navigation'

// 2. Librerías externas
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 3. Componentes internos
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// 4. Servicios y utilidades
import { createPlaya } from '@/services/playas/create'
import { formatCurrency } from '@/utils/formatters'

// 5. Tipos
import type { Playa, PlayaFormData } from '@/types/playa'
```

## 🧪 Testing

### Estructura de Tests

```typescript
// ✅ CORRECTO: Tests de utilidades
import { formatCurrency, isValidEmail } from '@/utils/helpers'

describe('formatCurrency', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1000)).toBe('$1.000,00')
    expect(formatCurrency(0)).toBe('$0,00')
  })
})

describe('isValidEmail', () => {
  it('should validate email correctly', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('invalid-email')).toBe(false)
  })
})
```

### Tests de Componentes

```typescript
// ✅ CORRECTO: Tests de componentes
import { render, screen, fireEvent } from '@testing-library/react'
import { PlayaForm } from './PlayaForm'

describe('PlayaForm', () => {
  it('should render form fields', () => {
    render(<PlayaForm />)
    
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
    expect(screen.getByLabelText('Dirección')).toBeInTheDocument()
  })

  it('should show validation errors', async () => {
    render(<PlayaForm />)
    
    const submitButton = screen.getByRole('button', { name: 'Crear Playa' })
    fireEvent.click(submitButton)
    
    expect(await screen.findByText('El nombre es requerido')).toBeInTheDocument()
  })
})
```

## 📝 Comentarios y Documentación

### JSDoc

```typescript
// ✅ CORRECTO: Documentación de funciones
/**
 * Crea una nueva playa en el sistema
 * @param data - Datos de la playa a crear
 * @returns Promise con la playa creada
 * @throws {ValidationError} Si los datos no son válidos
 * @throws {DatabaseError} Si hay error en la base de datos
 */
export async function createPlaya(data: PlayaFormData): Promise<Playa> {
  // Implementación
}

// ✅ CORRECTO: Documentación de componentes
/**
 * Componente para mostrar la lista de playas
 * @param playas - Array de playas a mostrar
 * @param onPlayaSelect - Callback cuando se selecciona una playa
 */
interface PlayasListProps {
  playas: Playa[]
  onPlayaSelect: (playa: Playa) => void
}
```

### Comentarios en Código

```typescript
// ✅ CORRECTO: Comentarios explicativos
export function calculateTarifa(plaza: Plaza, horas: number): number {
  // Obtener la tarifa base de la plaza
  const tarifaBase = plaza.tarifa_diaria
  
  // Aplicar descuento por horas (más de 8 horas = 20% descuento)
  if (horas > 8) {
    return tarifaBase * 0.8
  }
  
  return tarifaBase
}

// ✅ CORRECTO: Comentarios de TODO
// TODO: Implementar validación de horarios de apertura/cierre
// TODO: Agregar soporte para múltiples monedas
```

## 🚀 Performance

### Optimizaciones

```typescript
// ✅ CORRECTO: useMemo para cálculos costosos
const expensiveCalculation = useMemo(() => {
  return playas.reduce((total, playa) => total + playa.plazas.length, 0)
}, [playas])

// ✅ CORRECTO: useCallback para funciones que se pasan como props
const handlePlayaSelect = useCallback((playa: Playa) => {
  setSelectedPlaya(playa)
  onPlayaSelect?.(playa)
}, [onPlayaSelect])

// ✅ CORRECTO: Lazy loading para componentes pesados
const PlayaMap = lazy(() => import('./PlayaMap'))
```

### Code Splitting

```typescript
// ✅ CORRECTO: Dynamic imports para componentes pesados
import dynamic from 'next/dynamic'

const PlayaMap = dynamic(() => import('./PlayaMap'), {
  loading: () => <div>Cargando mapa...</div>,
  ssr: false // Si no necesita SSR
})
```

---

Estas convenciones aseguran que el código sea consistente, mantenible y fácil de entender tanto para desarrolladores como para agentes de IA.
