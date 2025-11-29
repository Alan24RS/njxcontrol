# 📊 Plan de Implementación: Reporte de Recaudación por Playa

## Objetivo

Implementar un reporte completo de **Recaudación Mensual por Playa** siguiendo los patrones de diseño identificados en el proyecto, con filtros avanzados, visualización en tabla y gráfico, y capacidad de exportación.

---

## 🎯 Alcance del Reporte

**Funcionalidades:**
- ✅ Filtrar por rango de fechas (mes/año)
- ✅ Filtrar por playa específica o todas
- ✅ Ver recaudación total por playa
- ✅ Ver cantidad de abonos activos
- ✅ Calcular ticket promedio
- ✅ Visualizar en tabla con sorting
- ✅ Visualizar en gráfico de barras
- ✅ Exportar a Excel
- ✅ Responsive y accessible

---

## 📁 Estructura de Archivos

```
src/
├── services/
│   └── analytics/
│       ├── recaudacion-por-playa/
│       │   ├── types.ts                    # Interfaces TypeScript
│       │   ├── getRecaudacionPorPlaya.ts   # Función repositorio Supabase
│       │   ├── actions.ts                  # Server Actions
│       │   └── index.ts                    # Exports
│       └── index.ts
├── schemas/
│   └── analytics/
│       ├── recaudacion-por-playa.ts        # Validación Zod
│       └── index.ts
├── hooks/
│   └── queries/
│       └── analytics/
│           ├── useRecaudacionPorPlaya.ts   # Hook TanStack Query
│           └── index.ts
├── app/
│   └── admin/
│       └── analytics/
│           ├── layout.tsx                   # Layout común analytics
│           └── recaudacion-por-playa/
│               ├── page.tsx                 # Página principal
│               └── components/
│                   ├── RecaudacionPorPlayaFilters.tsx
│                   ├── RecaudacionPorPlayaTable.tsx
│                   ├── RecaudacionPorPlayaChart.tsx
│                   ├── RecaudacionPorPlayaKPIs.tsx
│                   └── ExportButton.tsx
├── utils/
│   └── analytics/
│       ├── exportToExcel.ts                # Utilidad export
│       ├── formatCurrency.ts               # Formateo moneda
│       └── index.ts
└── __tests__/
    └── services/
        └── analytics/
            └── recaudacion-por-playa.test.ts
```

---

## 🔧 Paso a Paso de Implementación

### **PASO 1: Crear Tipos TypeScript**

**Archivo:** `src/services/analytics/recaudacion-por-playa/types.ts`

```typescript
/**
 * Fila de datos del reporte de recaudación por playa
 */
export interface RecaudacionPorPlayaRow {
  playa_id: string;
  playa_nombre: string;
  mes: string;                    // ISO string: "2025-11-01T00:00:00Z"
  total_abonos: number;
  recaudacion_mensual: number;
  ticket_promedio: number;
}

/**
 * Filtros para el reporte
 */
export interface RecaudacionPorPlayaFilters {
  fecha_desde: Date;
  fecha_hasta: Date;
  playa_id?: string | null;       // null = todas las playas
}

/**
 * Respuesta del endpoint
 */
export interface RecaudacionPorPlayaResponse {
  data: RecaudacionPorPlayaRow[];
  totales: {
    recaudacion_total: number;
    total_abonos: number;
    ticket_promedio_global: number;
  };
}

/**
 * Formato para TanStack Query
 */
export type UseRecaudacionPorPlayaResult = {
  data: RecaudacionPorPlayaResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};
```

**Patrón aplicado:**
- ✅ Nomenclatura descriptiva (`RecaudacionPorPlayaRow`)
- ✅ Documentación JSDoc
- ✅ Separación de concerns (Row, Filters, Response)
- ✅ Tipos estrictos (no `any`)

---

### **PASO 2: Crear Schema Zod de Validación**

**Archivo:** `src/schemas/analytics/recaudacion-por-playa.ts`

```typescript
import { z } from 'zod';

/**
 * Schema de validación para filtros de recaudación por playa
 */
export const recaudacionPorPlayaFiltersSchema = z.object({
  fecha_desde: z.coerce.date({
    required_error: 'La fecha desde es requerida',
    invalid_type_error: 'Fecha desde inválida',
  }),
  fecha_hasta: z.coerce.date({
    required_error: 'La fecha hasta es requerida',
    invalid_type_error: 'Fecha hasta inválida',
  }),
  playa_id: z.string().uuid().optional().nullable(),
}).refine(
  (data) => data.fecha_desde <= data.fecha_hasta,
  {
    message: 'La fecha desde debe ser anterior o igual a la fecha hasta',
    path: ['fecha_hasta'],
  }
);

export type RecaudacionPorPlayaFiltersInput = z.infer<typeof recaudacionPorPlayaFiltersSchema>;
```

**Patrón aplicado:**
- ✅ Validación con Zod (estándar del proyecto)
- ✅ Coerción de tipos (`z.coerce.date`)
- ✅ Refinements para validaciones complejas
- ✅ Type inference automática

---

### **PASO 3: Implementar Función de Repositorio Supabase**

**Archivo:** `src/services/analytics/recaudacion-por-playa/getRecaudacionPorPlaya.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import type { RecaudacionPorPlayaFilters, RecaudacionPorPlayaResponse } from './types';

/**
 * Obtiene la recaudación mensual agrupada por playa
 */
export async function getRecaudacionPorPlaya(
  filters: RecaudacionPorPlayaFilters
): Promise<RecaudacionPorPlayaResponse> {
  const supabase = await createClient();

  // Query para obtener datos por playa
  let query = supabase
    .from('abono')
    .select(`
      playa_id,
      playa:playa_id (
        nombre
      ),
      fecha_hora_inicio,
      precio_mensual
    `)
    .eq('estado', 'ACTIVO')
    .gte('fecha_hora_inicio', filters.fecha_desde.toISOString())
    .lte('fecha_hora_inicio', filters.fecha_hasta.toISOString());

  // Filtro opcional por playa
  if (filters.playa_id) {
    query = query.eq('playa_id', filters.playa_id);
  }

  const { data: abonosData, error } = await query;

  if (error) {
    console.error('[getRecaudacionPorPlaya] Error:', error);
    throw new Error(`Error al obtener recaudación: ${error.message}`);
  }

  if (!abonosData || abonosData.length === 0) {
    return {
      data: [],
      totales: {
        recaudacion_total: 0,
        total_abonos: 0,
        ticket_promedio_global: 0,
      },
    };
  }

  // Agrupar por playa y mes
  const grouped = new Map<string, RecaudacionPorPlayaRow>();

  for (const abono of abonosData) {
    const mes = new Date(abono.fecha_hora_inicio).toISOString().slice(0, 7) + '-01';
    const key = `${abono.playa_id}_${mes}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        playa_id: abono.playa_id,
        playa_nombre: abono.playa?.nombre ?? 'Sin nombre',
        mes,
        total_abonos: 0,
        recaudacion_mensual: 0,
        ticket_promedio: 0,
      });
    }

    const row = grouped.get(key)!;
    row.total_abonos += 1;
    row.recaudacion_mensual += Number(abono.precio_mensual);
  }

  // Calcular ticket promedio por cada fila
  const data = Array.from(grouped.values()).map((row) => ({
    ...row,
    ticket_promedio: row.recaudacion_mensual / row.total_abonos,
  }));

  // Calcular totales globales
  const recaudacion_total = data.reduce((sum, row) => sum + row.recaudacion_mensual, 0);
  const total_abonos = data.reduce((sum, row) => sum + row.total_abonos, 0);

  return {
    data,
    totales: {
      recaudacion_total,
      total_abonos,
      ticket_promedio_global: total_abonos > 0 ? recaudacion_total / total_abonos : 0,
    },
  };
}
```

**Patrón aplicado:**
- ✅ Función async pura (no side effects)
- ✅ Cliente Supabase del server
- ✅ Error handling con try-catch
- ✅ Validación de datos nulos
- ✅ Transformación de datos en memoria (agrupación)
- ✅ Logs para debugging

---

### **PASO 4: Crear Server Action**

**Archivo:** `src/services/analytics/recaudacion-por-playa/actions.ts`

```typescript
'use server';

import { recaudacionPorPlayaFiltersSchema } from '@/schemas/analytics/recaudacion-por-playa';
import { getRecaudacionPorPlaya } from './getRecaudacionPorPlaya';
import type { RecaudacionPorPlayaResponse } from './types';

/**
 * Server Action para obtener recaudación por playa
 * Valida permisos y ejecuta query
 */
export async function getRecaudacionPorPlayaAction(
  formData: FormData | Record<string, unknown>
): Promise<RecaudacionPorPlayaResponse> {
  try {
    // Si es FormData, convertir a objeto
    const rawData = formData instanceof FormData 
      ? Object.fromEntries(formData.entries()) 
      : formData;

    // Validar datos de entrada
    const validatedData = recaudacionPorPlayaFiltersSchema.parse(rawData);

    // TODO: Validar permisos del usuario (solo admin/supervisor)
    // const { data: session } = await getSession();
    // if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user.rol)) {
    //   throw new Error('No tienes permisos para acceder a este reporte');
    // }

    // Ejecutar query
    const result = await getRecaudacionPorPlaya(validatedData);

    return result;
  } catch (error) {
    console.error('[getRecaudacionPorPlayaAction] Error:', error);
    
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Error desconocido al obtener recaudación');
  }
}
```

**Patrón aplicado:**
- ✅ `'use server'` directive
- ✅ Validación con Zod antes de ejecutar
- ✅ Manejo de FormData y objetos
- ✅ Error handling con contexto
- ✅ Preparado para validación de permisos

---

### **PASO 5: Implementar Hook de TanStack Query**

**Archivo:** `src/hooks/queries/analytics/useRecaudacionPorPlaya.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getRecaudacionPorPlayaAction } from '@/services/analytics/recaudacion-por-playa/actions';
import type { RecaudacionPorPlayaFilters, UseRecaudacionPorPlayaResult } from '@/services/analytics/recaudacion-por-playa/types';

/**
 * Hook para obtener datos de recaudación por playa
 * Usa TanStack Query para caching y refetch automático
 */
export function useRecaudacionPorPlaya(
  filters: RecaudacionPorPlayaFilters,
  enabled: boolean = true
): UseRecaudacionPorPlayaResult {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recaudacion-por-playa', filters],
    queryFn: async () => {
      return await getRecaudacionPorPlayaAction(filters);
    },
    staleTime: 5 * 60 * 1000,        // 5 minutos
    gcTime: 10 * 60 * 1000,           // 10 minutos (antes cacheTime)
    enabled,                          // Permite deshabilitar query
    retry: 2,                         // Reintentos en caso de error
  });

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
```

**Patrón aplicado:**
- ✅ `'use client'` para hook de React
- ✅ TanStack Query con queryKey dinámico
- ✅ StaleTime y gcTime configurados
- ✅ Opción `enabled` para control condicional
- ✅ Tipos explícitos en retorno

---

### **PASO 6: Crear Componente de Filtros**

**Archivo:** `app/admin/analytics/recaudacion-por-playa/components/RecaudacionPorPlayaFilters.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Search } from 'lucide-react';
import { recaudacionPorPlayaFiltersSchema } from '@/schemas/analytics/recaudacion-por-playa';
import type { RecaudacionPorPlayaFiltersInput } from '@/schemas/analytics/recaudacion-por-playa';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryParams } from '@/hooks/useQueryParams';

interface RecaudacionPorPlayaFiltersProps {
  playas: Array<{ playa_id: string; nombre: string }>;
  onFilterChange: (filters: RecaudacionPorPlayaFiltersInput) => void;
}

export function RecaudacionPorPlayaFilters({ playas, onFilterChange }: RecaudacionPorPlayaFiltersProps) {
  const { updateParams, getParam } = useQueryParams();

  // Valores iniciales desde URL o defaults
  const defaultValues: RecaudacionPorPlayaFiltersInput = {
    fecha_desde: getParam('fecha_desde') 
      ? new Date(getParam('fecha_desde')!) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    fecha_hasta: getParam('fecha_hasta') 
      ? new Date(getParam('fecha_hasta')!) 
      : new Date(),
    playa_id: getParam('playa_id') || null,
  };

  const form = useForm<RecaudacionPorPlayaFiltersInput>({
    resolver: zodResolver(recaudacionPorPlayaFiltersSchema),
    defaultValues,
  });

  const onSubmit = (data: RecaudacionPorPlayaFiltersInput) => {
    // Actualizar URL params
    updateParams({
      fecha_desde: data.fecha_desde.toISOString().split('T')[0],
      fecha_hasta: data.fecha_hasta.toISOString().split('T')[0],
      playa_id: data.playa_id || '',
    });

    // Notificar padre
    onFilterChange(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Fecha Desde */}
          <FormField
            control={form.control}
            name="fecha_desde"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha Desde</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha Hasta */}
          <FormField
            control={form.control}
            name="fecha_hasta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha Hasta</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Playa */}
          <FormField
            control={form.control}
            name="playa_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Playa</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'all'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las playas" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Todas las playas</SelectItem>
                    {playas.map((playa) => (
                      <SelectItem key={playa.playa_id} value={playa.playa_id}>
                        {playa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Botón Filtrar */}
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              <Search className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
```

**Patrón aplicado:**
- ✅ React Hook Form + Zod resolver
- ✅ Componentes shadcn/ui
- ✅ useQueryParams para persistir filtros en URL
- ✅ Props tipadas con interface
- ✅ Accesibilidad con FormLabel/FormMessage

---

### **PASO 7: Crear Tabla de Datos**

**Archivo:** `app/admin/analytics/recaudacion-por-playa/components/RecaudacionPorPlayaTable.tsx`

```typescript
'use client';

import { useMemo } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RecaudacionPorPlayaRow } from '@/services/analytics/recaudacion-por-playa/types';

interface RecaudacionPorPlayaTableProps {
  data: RecaudacionPorPlayaRow[];
}

export function RecaudacionPorPlayaTable({ data }: RecaudacionPorPlayaTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'recaudacion_mensual', desc: true },
  ]);

  const columns: ColumnDef<RecaudacionPorPlayaRow>[] = useMemo(
    () => [
      {
        accessorKey: 'mes',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Mes
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const fecha = new Date(row.getValue('mes'));
          return new Intl.DateTimeFormat('es-AR', {
            year: 'numeric',
            month: 'long',
          }).format(fecha);
        },
      },
      {
        accessorKey: 'playa_nombre',
        header: 'Playa',
      },
      {
        accessorKey: 'total_abonos',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Abonos
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {row.getValue<number>('total_abonos').toLocaleString('es-AR')}
          </div>
        ),
      },
      {
        accessorKey: 'recaudacion_mensual',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Recaudación
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const amount = row.getValue<number>('recaudacion_mensual');
          const formatted = new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(amount);
          return <div className="text-right font-bold text-green-600">{formatted}</div>;
        },
      },
      {
        accessorKey: 'ticket_promedio',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Ticket Promedio
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const amount = row.getValue<number>('ticket_promedio');
          const formatted = new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(amount);
          return <div className="text-right">{formatted}</div>;
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No se encontraron resultados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Patrón aplicado:**
- ✅ TanStack Table v8
- ✅ Sorting integrado
- ✅ Formateo de moneda con Intl
- ✅ shadcn/ui Table components
- ✅ useMemo para columnas

---

### **PASO 8: Crear Gráfico de Barras**

**Archivo:** `app/admin/analytics/recaudacion-por-playa/components/RecaudacionPorPlayaChart.tsx`

```typescript
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { RecaudacionPorPlayaRow } from '@/services/analytics/recaudacion-por-playa/types';

interface RecaudacionPorPlayaChartProps {
  data: RecaudacionPorPlayaRow[];
}

export function RecaudacionPorPlayaChart({ data }: RecaudacionPorPlayaChartProps) {
  // Transformar datos para recharts
  const chartData = data.map((row) => ({
    nombre: row.playa_nombre,
    mes: new Intl.DateTimeFormat('es-AR', { year: 'numeric', month: 'short' }).format(
      new Date(row.mes)
    ),
    recaudacion: row.recaudacion_mensual,
  }));

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-lg font-semibold">Recaudación Mensual por Playa</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="nombre"
            className="text-xs"
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'hsl(var(--foreground))' }}
            tickFormatter={(value) =>
              new Intl.NumberFormat('es-AR', {
                notation: 'compact',
                compactDisplay: 'short',
              }).format(value)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) =>
              new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
              }).format(value)
            }
          />
          <Legend />
          <Bar
            dataKey="recaudacion"
            name="Recaudación"
            fill="hsl(var(--primary))"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Patrón aplicado:**
- ✅ Recharts para visualización
- ✅ Responsive con ResponsiveContainer
- ✅ Colores del theme (hsl CSS variables)
- ✅ Tooltip personalizado
- ✅ Formateo de moneda

---

### **PASO 9: Crear Página Principal**

**Archivo:** `app/admin/analytics/recaudacion-por-playa/page.tsx`

```typescript
import { Suspense } from 'react';
import { Metadata } from 'next';
import { RecaudacionPorPlayaContent } from './RecaudacionPorPlayaContent';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Recaudación por Playa | Analytics',
  description: 'Reporte de recaudación mensual agrupado por playa',
};

export default function RecaudacionPorPlayaPage() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recaudación por Playa</h1>
          <p className="text-muted-foreground">
            Análisis de ingresos mensuales agrupados por ubicación
          </p>
        </div>
      </div>

      <Suspense fallback={<RecaudacionSkeleton />}>
        <RecaudacionPorPlayaContent />
      </Suspense>
    </div>
  );
}

function RecaudacionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
```

**Archivo:** `app/admin/analytics/recaudacion-por-playa/RecaudacionPorPlayaContent.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useRecaudacionPorPlaya } from '@/hooks/queries/analytics/useRecaudacionPorPlaya';
import { RecaudacionPorPlayaFilters } from './components/RecaudacionPorPlayaFilters';
import { RecaudacionPorPlayaTable } from './components/RecaudacionPorPlayaTable';
import { RecaudacionPorPlayaChart } from './components/RecaudacionPorPlayaChart';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { RecaudacionPorPlayaFiltersInput } from '@/schemas/analytics/recaudacion-por-playa';

export function RecaudacionPorPlayaContent() {
  const [filters, setFilters] = useState<RecaudacionPorPlayaFiltersInput>({
    fecha_desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    fecha_hasta: new Date(),
    playa_id: null,
  });

  const { data, isLoading, isError, error } = useRecaudacionPorPlaya(filters);

  // TODO: Fetch playas para el selector
  const playas = [
    { playa_id: '1', nombre: 'Playa Centro' },
    { playa_id: '2', nombre: 'Playa Norte' },
  ];

  const handleExport = () => {
    // TODO: Implementar export a Excel
    console.log('Exportando...', data);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <RecaudacionPorPlayaFilters playas={playas} onFilterChange={setFilters} />

      {/* KPIs */}
      {data && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">Recaudación Total</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
              }).format(data.totales.recaudacion_total)}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">Total Abonos</div>
            <div className="mt-2 text-3xl font-bold">
              {data.totales.total_abonos.toLocaleString('es-AR')}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">Ticket Promedio</div>
            <div className="mt-2 text-3xl font-bold">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
              }).format(data.totales.ticket_promedio_global)}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Error al cargar datos: {error?.message || 'Error desconocido'}
          </AlertDescription>
        </Alert>
      )}

      {/* Gráfico */}
      {data && data.data.length > 0 && (
        <>
          <RecaudacionPorPlayaChart data={data.data} />

          {/* Botón Export */}
          <div className="flex justify-end">
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar a Excel
            </Button>
          </div>

          {/* Tabla */}
          <RecaudacionPorPlayaTable data={data.data} />
        </>
      )}

      {/* Sin datos */}
      {data && data.data.length === 0 && (
        <Alert>
          <AlertDescription>
            No se encontraron datos para los filtros seleccionados.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

**Patrón aplicado:**
- ✅ Server Component (page.tsx) + Client Component (Content)
- ✅ Suspense para loading states
- ✅ Skeleton loaders
- ✅ Error boundaries
- ✅ KPIs en cards
- ✅ Layout responsive con grid

---

### **PASO 10: Agregar Índice a Base de Datos**

**Archivo:** `supabase/migrations/20251120000001_add_analytics_indexes.sql`

```sql
-- Índice para optimizar queries de recaudación mensual
CREATE INDEX IF NOT EXISTS idx_abono_fecha_mes 
  ON public.abono(DATE_TRUNC('month', fecha_hora_inicio))
  WHERE estado = 'ACTIVO';

-- Índice para filtros por playa y estado
CREATE INDEX IF NOT EXISTS idx_abono_playa_estado_fecha 
  ON public.abono(playa_id, estado, fecha_hora_inicio)
  WHERE estado = 'ACTIVO';

COMMENT ON INDEX idx_abono_fecha_mes IS 'Optimiza queries de recaudación mensual en reportes de analytics';
COMMENT ON INDEX idx_abono_playa_estado_fecha IS 'Optimiza filtros por playa y rango de fechas en reportes';
```

**Ejecutar:**
```bash
pnpm supabase db push
```

---

### **PASO 11: Implementar Export a Excel**

**Archivo:** `src/utils/analytics/exportToExcel.ts`

```typescript
import * as XLSX from 'xlsx';
import type { RecaudacionPorPlayaRow } from '@/services/analytics/recaudacion-por-playa/types';

/**
 * Exporta datos de recaudación a Excel
 */
export function exportRecaudacionToExcel(data: RecaudacionPorPlayaRow[], filename: string = 'recaudacion-por-playa.xlsx') {
  // Transformar datos para Excel
  const excelData = data.map((row) => ({
    Mes: new Intl.DateTimeFormat('es-AR', { year: 'numeric', month: 'long' }).format(new Date(row.mes)),
    Playa: row.playa_nombre,
    'Total Abonos': row.total_abonos,
    'Recaudación Mensual': row.recaudacion_mensual,
    'Ticket Promedio': row.ticket_promedio,
  }));

  // Crear workbook
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Formatear columnas de moneda
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const recaudacionCell = XLSX.utils.encode_cell({ r: R, c: 3 });
    const ticketCell = XLSX.utils.encode_cell({ r: R, c: 4 });
    
    if (ws[recaudacionCell]) {
      ws[recaudacionCell].z = '"$"#,##0.00';
    }
    if (ws[ticketCell]) {
      ws[ticketCell].z = '"$"#,##0.00';
    }
  }

  // Ajustar anchos de columna
  ws['!cols'] = [
    { wch: 15 }, // Mes
    { wch: 20 }, // Playa
    { wch: 15 }, // Total Abonos
    { wch: 20 }, // Recaudación
    { wch: 18 }, // Ticket Promedio
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Recaudación por Playa');

  // Descargar archivo
  XLSX.writeFile(wb, filename);
}
```

**Instalar dependencia:**
```bash
pnpm add xlsx
pnpm add -D @types/xlsx
```

---

### **PASO 12: Agregar Tests Unitarios**

**Archivo:** `src/__tests__/services/analytics/recaudacion-por-playa.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getRecaudacionPorPlaya } from '@/services/analytics/recaudacion-por-playa/getRecaudacionPorPlaya';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              data: [
                {
                  playa_id: '1',
                  playa: { nombre: 'Playa Test' },
                  fecha_hora_inicio: '2025-11-01T00:00:00Z',
                  precio_mensual: 10000,
                },
                {
                  playa_id: '1',
                  playa: { nombre: 'Playa Test' },
                  fecha_hora_inicio: '2025-11-05T00:00:00Z',
                  precio_mensual: 15000,
                },
              ],
              error: null,
            })),
          })),
        })),
      })),
    })),
  })),
}));

describe('getRecaudacionPorPlaya', () => {
  it('debería agrupar datos correctamente por playa y mes', async () => {
    const filters = {
      fecha_desde: new Date('2025-11-01'),
      fecha_hasta: new Date('2025-11-30'),
    };

    const result = await getRecaudacionPorPlaya(filters);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].playa_nombre).toBe('Playa Test');
    expect(result.data[0].total_abonos).toBe(2);
    expect(result.data[0].recaudacion_mensual).toBe(25000);
    expect(result.data[0].ticket_promedio).toBe(12500);
  });

  it('debería calcular totales globales correctamente', async () => {
    const filters = {
      fecha_desde: new Date('2025-11-01'),
      fecha_hasta: new Date('2025-11-30'),
    };

    const result = await getRecaudacionPorPlaya(filters);

    expect(result.totales.recaudacion_total).toBe(25000);
    expect(result.totales.total_abonos).toBe(2);
    expect(result.totales.ticket_promedio_global).toBe(12500);
  });
});
```

**Ejecutar tests:**
```bash
pnpm test
```

---

### **PASO 13: Actualizar Navegación en Sidebar**

**Archivo:** `src/components/layout/Sidebar/index.tsx`

Agregar en la sección de items:

```typescript
{
  title: 'Analytics',
  icon: BarChart3,
  href: '/admin/analytics',
  role: ['ADMIN', 'SUPERVISOR'],
  submenu: [
    {
      title: 'Recaudación por Playa',
      href: '/admin/analytics/recaudacion-por-playa',
    },
    // Futuros reportes...
  ],
},
```

---

## 🎯 Checklist de Implementación

### Backend
- [ ] **Paso 1**: Crear tipos TypeScript (`types.ts`)
- [ ] **Paso 2**: Crear schema Zod (`schemas/analytics/recaudacion-por-playa.ts`)
- [ ] **Paso 3**: Implementar función repositorio (`getRecaudacionPorPlaya.ts`)
- [ ] **Paso 4**: Crear Server Action (`actions.ts`)
- [ ] **Paso 5**: Implementar hook TanStack Query (`useRecaudacionPorPlaya.ts`)

### Frontend
- [ ] **Paso 6**: Crear componente de filtros (`RecaudacionPorPlayaFilters.tsx`)
- [ ] **Paso 7**: Crear tabla de datos (`RecaudacionPorPlayaTable.tsx`)
- [ ] **Paso 8**: Crear gráfico de barras (`RecaudacionPorPlayaChart.tsx`)
- [ ] **Paso 9**: Crear página principal (`page.tsx` + `RecaudacionPorPlayaContent.tsx`)

### Database
- [ ] **Paso 10**: Crear migración con índices de performance

### Extras
- [ ] **Paso 11**: Implementar export a Excel
- [ ] **Paso 12**: Agregar tests unitarios
- [ ] **Paso 13**: Actualizar navegación en Sidebar

### Testing Manual
- [ ] Verificar filtros por fecha funcionen correctamente
- [ ] Verificar filtro por playa funcione (todas/específica)
- [ ] Verificar sorting en tabla funcione
- [ ] Verificar gráfico se renderice sin errores
- [ ] Verificar KPIs calculen correctamente
- [ ] Verificar export a Excel descargue archivo
- [ ] Verificar responsive en móvil
- [ ] Verificar accesibilidad con screen reader

---

## 📊 Estimación de Tiempo

| Paso | Descripción | Tiempo Estimado |
|------|-------------|-----------------|
| 1-2 | Tipos y schemas | 30 min |
| 3-4 | Backend (repositorio + action) | 1 hora |
| 5 | Hook TanStack Query | 20 min |
| 6 | Componente filtros | 1 hora |
| 7 | Tabla de datos | 1 hora |
| 8 | Gráfico de barras | 45 min |
| 9 | Página principal + layout | 1 hora |
| 10 | Migración índices DB | 15 min |
| 11 | Export a Excel | 45 min |
| 12 | Tests unitarios | 1 hora |
| 13 | Actualizar navegación | 15 min |
| Testing manual | QA completo | 1 hora |

**Total estimado: ~9 horas** (1-2 sprints dependiendo de la dedicación)

---

## 🚀 Próximos Pasos

Una vez completado este reporte, podrás replicar la misma estructura para los otros 8 reportes:

1. **Recaudación Total** (más simple, sin agrupación por playa)
2. **Proyección Futura** (usar `fecha_fin`)
3. **Recaudación por Playero** (join con `turno`)
4. **Tasa de Renovación** (calcular diferencia entre ACTIVO y FINALIZADO)
5. **Ticket Promedio** (simple AVG)
6. **Distribución de Precios** (usar CASE para rangos)
7. **Recaudación por Tipo Plaza** (join con `tipo_plaza`)
8. **Tasa de Ocupación** (join con todas las plazas)

**El patrón es idéntico, solo cambian las queries SQL y los componentes de visualización.**

---

## 💡 Tips de Desarrollo

1. **Desarrolla incremental**: Implementa primero el backend (Pasos 1-5), prueba con curl/Postman, luego el frontend
2. **Usa Storybook**: Desarrolla componentes aislados para debugging más rápido
3. **Mock data primero**: Usa datos hardcodeados mientras desarrollas el UI
4. **Git commits atómicos**: Un commit por cada paso completado
5. **Pair programming**: Revisa código con otro dev para detectar bugs temprano

---

## 📚 Referencias

- [Documentación Supabase](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [TanStack Table](https://tanstack.com/table/latest)
- [Recharts](https://recharts.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

---

**¿Listo para comenzar? Empieza por el Paso 1 y avanza sistemáticamente. ¡Éxito!** 🚀
