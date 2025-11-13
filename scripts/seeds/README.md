# 🌱 Seed Data Management

Este directorio contiene los datos de seed organizados por propósito y separados en módulos para facilitar su mantenimiento.

## 📁 Estructura

> **⚠️ IMPORTANTE**: El archivo `supabase/seed.sql` fue ELIMINADO. Todo está en TypeScript modular aquí.

```
seeds/
├── base/               # Datos maestros (seguros para producción)
│   └── caracteristicas.ts
└── dev/                # Datos de prueba (solo desarrollo)
    ├── ciudades.ts
    ├── users.ts
    ├── playas.ts
    ├── modalidades.ts
    └── README.md
```

## 🎯 Tipos de Seed

### `base/` - Datos Maestros

**Propósito**: Datos esenciales necesarios para el funcionamiento del sistema.

**Características**:

- ✅ Seguros para producción
- ✅ Operaciones idempotentes (upsert)
- ✅ No dependen de otros datos
- ✅ Usan constantes tipadas del código (evitan strings hardcodeados)

**Contenido actual**:

- `caracteristicas.ts` - Características de plazas (Techada, Con cargador, etc.)

**¿Cuándo agregar aquí?**

- Enums o catálogos globales del sistema
- Datos de configuración básica
- Valores que todo usuario/playa necesita

### `dev/` - Datos de Prueba

**Propósito**: Datos para testing y desarrollo local.

**Características**:

- ⚠️ **SOLO para desarrollo** - No usar en producción
- ✅ Dependencias claras entre archivos
- ✅ UUIDs fijos para reproducibilidad
- ✅ Usan constantes tipadas del código (evitan strings hardcodeados)

**Contenido actual**:

- `ciudades.ts` - Resistencia y Corrientes (para testing)
- `users.ts` - Usuarios de prueba (dueno@test.com, playero@test.com)
- `playas.ts` - Playas de prueba con toda su configuración (tipos de plaza, tarifas, plazas, métodos de pago, tipos de vehículo)
- `modalidades.ts` - Modalidades de ocupación habilitadas por playa

**¿Cuándo agregar aquí?**

- Usuarios de prueba
- Datos de ejemplo para nuevos desarrolladores
- Configuraciones de test

## 📝 Cómo Agregar Nuevos Datos

### Agregar Nueva Característica (Base)

1. Edita `base/caracteristicas.ts`:

```typescript
export const caracteristicas = [
  { nombre: 'Techada' },
  { nombre: 'Con cargador' },
  // ✨ Agrega aquí
  { nombre: 'Nueva Característica' }
]
```

2. Aplica el seed:

```bash
pnpm db:seed
```

### Agregar Nueva Ciudad de Prueba (Dev)

1. Edita `dev/ciudades.ts`:

```typescript
export const ciudades = [
  { ciudad_id: 'uuid-1', nombre: 'Resistencia', provincia: 'Chaco' },
  // ✨ Agrega aquí
  { ciudad_id: 'uuid-nuevo', nombre: 'Nueva Ciudad', provincia: 'Provincia' }
]
```

2. Aplica el seed:

```bash
pnpm db:seed
```

### Agregar Nueva Playa de Prueba (Dev)

1. Edita `dev/playas.ts`:

```typescript
import { PLAYA_ESTADO } from '@/constants/playaEstado'

export const testPlayas = [
  { playa_id: '...', nombre: 'UTN-Parking', estado: PLAYA_ESTADO.ACTIVO, ... },
  // ✨ Agrega aquí
  { playa_id: 'nuevo-uuid', nombre: 'Mi Playa', estado: PLAYA_ESTADO.ACTIVO, ... }
]
```

2. Agrega los datos relacionados (métodos de pago, tipos de vehículo, etc.) en el mismo archivo usando las constantes del código

3. Aplica el seed:

```bash
pnpm db:seed
```

## 🔄 Workflow de Seeds

### Durante Desarrollo Local

```bash
# Aplicar todos los seeds (base + dev)
pnpm db:seed

# O reiniciar todo (incluye migración + seed)
pnpm db:reset
```

### En Producción

```bash
# ⚠️ IMPORTANTE: Los seeds incluyen datos de prueba
# En producción, solo aplica migraciones:
pnpm db:migrate

# ❌ NUNCA en producción:
pnpm db:seed      # Incluye datos de prueba (usuarios test, etc.)
pnpm db:reset     # Destructivo
```

**Nota**: Si necesitás datos base en producción (como características), créalos manualmente o mediante migraciones.

## 🎨 Patrones de Código

### ✨ Usar Constantes en Lugar de Strings

**SIEMPRE** usa las constantes tipadas del código en lugar de strings hardcodeados:

```typescript
// ❌ MAL - String hardcodeado
export const testPlayas = [
  {
    playa_id: 'uuid-1',
    nombre: 'Mi Playa',
    estado: 'ACTIVO' // ❌ Propenso a errores de tipeo
  }
]

// ✅ BIEN - Constante tipada
import { PLAYA_ESTADO } from '@/constants/playaEstado'

export const testPlayas = [
  {
    playa_id: 'uuid-1',
    nombre: 'Mi Playa',
    estado: PLAYA_ESTADO.ACTIVO // ✅ Type-safe, autocompleta
  }
]
```

**Ventajas**:

- ✅ **Type safety**: TypeScript valida los valores
- ✅ **Autocomplete**: IntelliSense te ayuda
- ✅ **Sincronización automática**: Si cambia la constante, se actualiza el seed
- ✅ **Sin duplicación**: Una sola fuente de verdad
- ✅ **Menos errores**: No hay typos posibles

**Constantes disponibles**:

- `PLAYA_ESTADO` (ACTIVO, SUSPENDIDO, BORRADOR)
- `PLAZA_ESTADO` (ACTIVO, SUSPENDIDO)
- `MODALIDAD_OCUPACION` (POR_HORA, DIARIA, SEMANAL)
- `ESTADO_MODALIDAD_OCUPACION` (ACTIVO, SUSPENDIDO)
- `METODO_PAGO` (EFECTIVO, TRANSFERENCIA, MERCADO_PAGO)
- `ESTADO_METODO_PAGO` (ACTIVO, SUSPENDIDO)
- `TIPO_VEHICULO` (AUTOMOVIL, MOTOCICLETA, CAMIONETA)
- `ESTADO_TIPO_VEHICULO` (ACTIVO, SUSPENDIDO)
- `PLAYERO_PLAYA_ESTADO` (ACTIVO, SUSPENDIDO, PENDIENTE)

### Estructura de Archivo

```typescript
// dev/mi-seed.ts
import { MI_CONSTANTE } from '@/constants/miConstante'

export const misDatos = [
  {
    id: 'uuid-fijo', // UUIDs fijos para reproducibilidad
    nombre: 'Valor',
    estado: MI_CONSTANTE.VALOR // Usar constantes
  }
]

// Puedes exportar constantes útiles
export const MI_ID_IMPORTANTE = 'uuid-fijo'
```

### Usando los Seeds

```typescript
// scripts/db-seed.ts
import { misDatos } from './seeds/dev/mi-seed'

await supabase.from('tabla').upsert(misDatos, {
  onConflict: 'id' // Siempre usar upsert para idempotencia
})
```

## 📊 Datos Actuales

### Base (Producción OK)

- ⭐ 6 características de plazas

### Dev (Solo desarrollo)

- 🏙️ 2 ciudades (Resistencia, Corrientes)
- 👤 2 usuarios (dueno@test.com, playero@test.com)
- 🏖️ 2 playas con configuración completa
  - UTN-Parking (Resistencia)
  - Centro Plaza Parking (Corrientes)
- 🅿️ 16 plazas totales
- 💰 11 tarifas
- 💳 5 métodos de pago
- 🚗 5 tipos de vehículo

## 🔒 Seguridad

### Datos Base

- ✅ Seguros para producción
- ✅ No contienen información sensible
- ✅ Idempotentes (se pueden ejecutar múltiples veces)

### Datos Dev

- ⚠️ Usuarios con contraseñas conocidas
- ⚠️ Datos de ejemplo públicos
- ❌ **NUNCA** en producción

## 🚀 Tips

1. **UUIDs Fijos**: Usa UUIDs fijos en dev para reproducibilidad
2. **Constantes Tipadas**: SIEMPRE usa constantes de `@/constants/` en lugar de strings
3. **Comentarios**: Documenta el propósito de cada dato
4. **Modularidad**: Un archivo por tipo de entidad
5. **Relaciones**: Exporta las constantes de IDs para referencias
6. **Testing**: Los seeds dev deben cubrir casos de uso comunes

## 📚 Referencias

- Ver `../db-seed.ts` - Implementación unificada del seeder
- Ver archivos en `seeds/` - Datos modulares por entidad
- Ver `../../src/constants/` - Constantes tipadas disponibles para usar en seeds
