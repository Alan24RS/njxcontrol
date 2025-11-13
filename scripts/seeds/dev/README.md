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
