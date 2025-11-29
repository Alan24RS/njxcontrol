# Dev Seeds - Estructura Modular

Este directorio contiene los datos de prueba organizados por entidad para facilitar el mantenimiento.

## 📁 Archivos

### `ciudades.ts`

Ciudades de prueba para testing.

```typescript
export const ciudades = [...]
```

### `users.ts`

Usuarios de prueba con roles predefinidos.

```typescript
export const testUsers = [
  { email: 'dueno@test.com', password: 'test1234', ... },
  { email: 'playero@test.com', password: 'test1234', ... }
]
```

### `playas.ts`

Playas de prueba con toda su configuración (tipos de plaza, métodos de pago, plazas, tarifas).

```typescript
export const PLAYA_1_ID = 'uuid-fijo'
export const PLAYA_2_ID = 'uuid-fijo'

export const testPlayas = [...]
```

### `recaudacion-reportes.ts` ⭐ NUEVO

Generador de datos históricos para probar reportes de recaudación.

**Propósito:** Crear turnos, ocupaciones finalizadas y abonos con pagos para validar los reportes de analytics.

**Funciones principales:**

```typescript
// Genera fechas de turnos (últimos 30 días)
export function generarFechasTurnos(): Date[]

// Genera turnos distribuidos para múltiples playeros
export function generarTestTurnos(
  playeroId1,
  playeroId2,
  playeroId3,
  playeroId4
): TestTurno[]

// Genera ocupaciones finalizadas con pagos
export function generarTestOcupaciones(turnos): TestOcupacion[]

// Genera abonos con pagos iniciales
export function generarTestAbonos(turnos): TestAbono[]

// Obtiene resumen de datos generados
export function obtenerResumenDatos(turnos, ocupaciones, abonos)
```

**Script de ejecución:** `scripts/seed-recaudacion-reportes.ts`

**Comando:** `pnpm db:seed:reportes`

**Datos generados:**

- ~40 turnos en últimos 30 días
- ~120 ocupaciones (70% por hora, 30% diarias)
- ~10 abonos activos
- Mix de métodos de pago y tipos de vehículos
- Recaudación total: ~$500,000-800,000 ARS

**Documentación completa:** `docs/ANALISIS_OPERACIONES_BD.md`

### `tarifas.ts`

**Generador automático** de tarifas MENSUAL basadas en tarifas DIARIAS.

```typescript
export async function seedTarifas(supabase) {
  // Busca tarifas DIARIAS
  // Genera tarifas MENSUAL (precio × 25)
  // Hace upsert en la tabla tarifa
}
```

## 🎯 Cómo Agregar una Nueva Entidad

1. **Crear archivo** en este directorio:

   ```typescript
   // seeds/dev/mi-entidad.ts
   export const miEntidadData = [{ id: 'uuid-fijo', campo: 'valor' }]
   ```

2. **Importar en el seeder principal** (`scripts/db-seed.ts`):

   ```typescript
   import { miEntidadData } from './seeds/dev/mi-entidad'

   async function seedMiEntidad() {
     const { error } = await supabase
       .from('mi_tabla')
       .upsert(miEntidadData, { onConflict: 'id' })
   }
   ```

3. **Llamar en el flujo** de `seedDevData()`:
   ```typescript
   async function seedDevData() {
     await seedUsers()
     await seedRoles()
     await seedMiEntidad() // ← agregar aquí
   }
   ```

## 💡 Principios

- **Modularidad**: Un archivo por tipo de entidad
- **Idempotencia**: Usar `upsert` para poder ejecutar múltiples veces
- **UUIDs fijos**: Para reproducibilidad en tests
- **Exportar constantes**: IDs importantes como constantes para referencias
- **Documentar**: Comentar el propósito y relaciones de los datos

## 🔗 Relaciones

```
users.ts
  ↓
roles → usuarios
  ↓
playas.ts → ciudades.ts
  ↓
tarifas.ts → busca tarifas DIARIAS y genera MENSUAL
```
