# Race Condition Prevention in Database Operations

## Problema: Pre-validaciones vs Constraints de Base de Datos

### ❌ Antipatrón: Verificación antes de inserción

```typescript
// MALO: Race condition window
const { data: existing } = await db
  .from('table')
  .select('id')
  .eq('unique_field', value)
  .maybeSingle()

if (existing) {
  return { error: 'Ya existe' }
}

// ⚠️ VENTANA DE RACE CONDITION AQUÍ
// Otro proceso puede insertar entre la verificación y el insert

await db.from('table').insert({ unique_field: value })
```

**Problemas:**
- ⚠️ Race condition window entre SELECT e INSERT
- 🐢 Round trip adicional a la base de datos (más lento)
- 🔄 Lógica duplicada (verificación + constraint)
- 🐛 Posibles inconsistencias si el constraint no existe

### ✅ Patrón Correcto: Confiar en constraints de BD

```typescript
// BUENO: Dejar que la BD maneje la unicidad
const { data, error: insertError } = await db
  .from('table')
  .insert({ unique_field: value })
  .select()
  .single()

if (insertError) {
  // Manejar error específico del constraint
  if (insertError.code === '23505') {
    // Violación de constraint único (PostgreSQL)
    return {
      data: null,
      error: 'Este valor ya está registrado'
    }
  }
  // Otros errores...
}
```

**Ventajas:**
- ✅ Sin race conditions (atomicidad garantizada)
- ⚡ Más rápido (un solo round trip)
- 🎯 Single source of truth (la base de datos)
- 🔒 Integridad garantizada a nivel de BD

## Caso Real: createOcupacion

### Antes (con race condition)

```typescript
// 1. Pre-verificación (innecesaria y peligrosa)
const { data: ocupacionExistente } = await supabase
  .from('ocupacion')
  .select('ocupacion_id, patente')
  .eq('playa_id', data.playaId)
  .eq('patente', data.patente)
  .is('hora_egreso', null)
  .maybeSingle()

if (ocupacionExistente) {
  return { error: 'Patente ya registrada' }
}

// ⚠️ RACE CONDITION: Otro playero puede insertar la misma patente aquí

// 2. Inserción
await supabase.from('ocupacion').insert(...)
```

**Escenario de fallo:**
1. Playero A verifica patente ABC123 → No existe ✅
2. Playero B verifica patente ABC123 → No existe ✅
3. Playero A inserta ABC123 → OK
4. Playero B inserta ABC123 → ❌ Falla (o peor, se inserta si no hay constraint)

### Después (sin race condition)

```typescript
// Insertar directamente, confiar en el constraint de BD
const { data: rawOcupacion, error: insertError } = await supabase
  .from('ocupacion')
  .insert({
    playa_id: data.playaId,
    patente: data.patente,
    // ... otros campos
  })
  .select()
  .single()

// Manejar error del constraint único
if (insertError?.code === '23505') {
  if (insertError.message.includes('idx_ocupacion_patente_activa')) {
    return {
      data: null,
      error: `La patente ${data.patente} ya está registrada en una ocupación activa.`
    }
  }
}
```

**Constraint en la BD:**
```sql
-- Índice único parcial que previene duplicados de patentes activas
CREATE UNIQUE INDEX idx_ocupacion_patente_activa 
ON ocupacion (playa_id, patente) 
WHERE hora_egreso IS NULL;
```

## Beneficios Medibles

### Performance

| Operación | Antes | Después | Mejora |
|-----------|-------|---------|--------|
| Round trips | 2 | 1 | 50% menos |
| Latencia típica | ~50-100ms | ~25-50ms | 2x más rápido |
| Carga en BD | Alta | Baja | Menos queries |

### Confiabilidad

| Aspecto | Antes | Después |
|---------|-------|---------|
| Race conditions | ❌ Posible | ✅ Imposible |
| Atomicidad | ⚠️ No garantizada | ✅ Garantizada |
| Consistencia | ⚠️ Depende del timing | ✅ Siempre consistente |

## Cuándo usar cada patrón

### ✅ Usar pre-validación cuando:
- Necesitas dar feedback específico ANTES de intentar la operación
- La validación involucra lógica de negocio compleja (no solo unicidad)
- Quieres evitar intentos innecesarios (UX mejor)
- **PERO**: Acepta que puede fallar de todos modos y maneja el error del constraint

Ejemplo: Validar si un usuario tiene permisos antes de crear un registro

### ✅ Usar solo constraint cuando:
- Es una validación de integridad (unicidad, foreign keys)
- El error es manejable a nivel de aplicación
- Performance es crítica
- Concurrencia es alta

Ejemplo: Prevenir duplicados de patentes activas

## Códigos de Error PostgreSQL Comunes

```typescript
// Violación de constraint único
if (error.code === '23505') { /* ... */ }

// Violación de foreign key
if (error.code === '23503') { /* ... */ }

// Violación de check constraint
if (error.code === '23514') { /* ... */ }

// Violación de not null
if (error.code === '23502') { /* ... */ }
```

## Testing

```typescript
import { describe, expect, it } from 'vitest'

describe('createOcupacion race condition', () => {
  it('previene duplicados con inserts concurrentes', async () => {
    const patente = 'ABC123'
    
    // Simular 2 requests concurrentes con la misma patente
    const [result1, result2] = await Promise.all([
      createOcupacion({ patente, playaId, plazaId }),
      createOcupacion({ patente, playaId, plazaId })
    ])
    
    // Solo uno debe tener éxito
    const successes = [result1, result2].filter(r => r.data !== null)
    const errors = [result1, result2].filter(r => r.error !== null)
    
    expect(successes).toHaveLength(1)
    expect(errors).toHaveLength(1)
    expect(errors[0].error).toContain('ya está registrada')
  })
})
```

## Mejores Prácticas

1. ✅ **Confía en la base de datos** para integridad referencial y unicidad
2. ✅ **Maneja errores de constraints** con mensajes claros para el usuario
3. ✅ **Documenta los constraints** en migraciones y código
4. ✅ **Usa índices parciales** para constraints condicionales (WHERE clause)
5. ✅ **Testea concurrencia** con Promise.all() en tests

6. ❌ **No dupliques lógica** entre validaciones y constraints
7. ❌ **No asumas que** SELECT + INSERT es atómico (no lo es)
8. ❌ **No ignores** errores de constraints pensando que "no deberían pasar"

## Referencias

- [PostgreSQL Unique Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS)
- [Race Conditions in Database Operations](https://use-the-index-luke.com/sql/dml/insert)
- [Optimistic vs Pessimistic Locking](https://stackoverflow.com/questions/129329/optimistic-vs-pessimistic-locking)
