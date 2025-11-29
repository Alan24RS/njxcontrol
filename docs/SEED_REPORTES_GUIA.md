# Guía: Seed de Datos para Reportes de Recaudación

## 📋 Descripción

El seed de reportes (`pnpm db:seed:reportes`) es un script especializado que genera datos históricos realistas para probar y validar los reportes de recaudación del sistema.

## 🎯 Objetivo

Crear un conjunto de datos de prueba que simule la actividad real de una playa durante los últimos 30 días, incluyendo:
- Turnos de playeros
- Ocupaciones finalizadas con pagos
- Abonos con pagos iniciales

## 📊 Datos Generados

### Cantidades
- **Turnos**: ~40 (distribuidos en últimos 30 días)
- **Ocupaciones**: ~120 finalizadas con pagos
- **Abonos**: ~10 activos con primera boleta pagada
- **Recaudación Total**: ~$500,000-800,000 ARS

### Distribución

#### Ocupaciones
- **Por modalidad**:
  - 70% POR_HORA (1-4 horas)
  - 30% DIARIA (8-10 horas)

- **Por tipo de vehículo**:
  - 50% AUTO
  - 30% MOTO
  - 20% CAMIONETA

- **Por método de pago**:
  - 40% EFECTIVO
  - 35% TRANSFERENCIA
  - 25% DÉBITO

#### Abonos
- 50% con un solo vehículo (AUTO)
- 50% con múltiples vehículos (AUTO + MOTO)
- Métodos de pago: 50% TRANSFERENCIA, 50% EFECTIVO
- Todos con primera boleta pagada

## 🚀 Cómo Usar

### Prerequisitos

1. **Supabase local corriendo**:
   ```bash
   supabase start
   ```

2. **Seed base ejecutado**:
   ```bash
   pnpm db:seed
   ```

### Ejecución

```bash
# Ejecutar seed de reportes
pnpm db:seed:reportes
```

### Verificar Resultados

1. **Ver en la app**:
   ```
   http://localhost:3000/admin/analytics/recaudacion-por-playa
   ```

2. **Filtros recomendados**:
   - Rango de fechas: Últimos 30 días
   - Playa: Todas o seleccionar Playa 1/Playa 2

3. **Validar datos**:
   - La tabla debe mostrar pagos individuales
   - El gráfico debe mostrar recaudación diaria
   - Los KPIs deben reflejar totales correctos

## 📁 Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `scripts/seed-recaudacion-reportes.ts` | Script ejecutable |
| `scripts/seeds/dev/recaudacion-reportes.ts` | Generador de datos |
| `docs/ANALISIS_OPERACIONES_BD.md` | Análisis completo de operaciones |

## 🔄 Workflow Completo

```bash
# 1. Iniciar Supabase (si no está corriendo)
supabase start

# 2. Reset completo (opcional, si necesitas empezar desde cero)
pnpm db:reset

# 3. Seed base (estructura)
pnpm db:seed

# 4. Seed de reportes (datos históricos)
pnpm db:seed:reportes

# 5. Abrir la app
pnpm dev

# 6. Navegar a reportes
# http://localhost:3000/admin/analytics/recaudacion-por-playa
```

## 🎨 Personalización

### Modificar Cantidades

Edita el archivo `scripts/seeds/dev/recaudacion-reportes.ts`:

```typescript
// Cambiar número de turnos
export function generarFechasTurnos(): Date[] {
  const hoy = new Date()
  const fechas: Date[] = []
  
  // Cambiar de 30 a 60 días, o de cada 3 días a cada 2 días
  for (let i = 60; i >= 0; i -= 2) {  // ← Modificar aquí
    // ...
  }
}

// Cambiar número de ocupaciones por turno
for (let i = 0; i < numOcupaciones; i++) {
  const numOcupaciones = 5 + (turnoIndex % 3)  // ← De 3-5 a 5-7
}
```

### Agregar Más Playas

1. Edita `generarTestTurnos()` para incluir más playas
2. Modifica `generarTestOcupaciones()` y `generarTestAbonos()` para distribuir datos

### Cambiar Distribución

```typescript
// En generarTestOcupaciones()
const modalidad = i % 2 === 0 ? 'DIARIA' : 'POR_HORA'  // ← 50/50 en lugar de 30/70
const tipoVehiculo = i % 2 === 0 ? 'AUTO' : 'MOTO'     // ← Sin camionetas
```

## 🐛 Troubleshooting

### Error: "Missing environment variables"

**Solución**:
```bash
# Verificar que .env.local existe
cat .env.local | grep SUPABASE

# Debe tener:
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Error: "relation does not exist"

**Causa**: Seed base no ejecutado o migraciones faltantes

**Solución**:
```bash
# Aplicar migraciones
supabase db push

# Ejecutar seed base
pnpm db:seed

# Luego seed de reportes
pnpm db:seed:reportes
```

### Error: "No se encontró turno para ocupación"

**Causa**: Los turnos no se insertaron correctamente

**Solución**:
```bash
# Verificar turnos en la BD
supabase db studio
# SQL: SELECT * FROM turno ORDER BY fecha_hora_ingreso DESC LIMIT 10;

# Re-ejecutar seed de reportes
pnpm db:seed:reportes
```

### Error: "duplicate key value violates unique constraint"

**Causa**: Datos ya existen (patentes duplicadas)

**Solución**:
```bash
# Opción 1: Limpiar solo pagos/ocupaciones/abonos
# (ejecutar en Supabase Studio)
DELETE FROM pago WHERE ocupacion_id IS NOT NULL OR boleta_id IS NOT NULL;
DELETE FROM boleta;
DELETE FROM abono_vehiculo;
DELETE FROM abono;
DELETE FROM ocupacion;
DELETE FROM turno;

# Opción 2: Reset completo
pnpm db:reset
pnpm db:seed
pnpm db:seed:reportes
```

## 📈 Casos de Uso

### 1. Testing de Filtros
- Filtrar por rango de fechas
- Filtrar por playa específica
- Validar totales por tipo de pago

### 2. Validación de KPIs
- Recaudación total
- Recaudación por abonos
- Recaudación por ocupaciones

### 3. Testing de Exportación
- Exportar a Excel
- Verificar formato de datos
- Validar cálculos

### 4. Performance Testing
- Cargar reportes con ~120 registros
- Verificar tiempos de respuesta
- Probar paginación

## 🔍 Análisis de Datos Generados

### SQL para Verificar

```sql
-- Ver distribución de turnos
SELECT 
  playa_id,
  DATE(fecha_hora_ingreso) as fecha,
  COUNT(*) as turnos
FROM turno
GROUP BY playa_id, DATE(fecha_hora_ingreso)
ORDER BY fecha DESC
LIMIT 20;

-- Ver recaudación por día
SELECT 
  DATE(fecha_hora_pago) as fecha,
  COUNT(*) as pagos,
  SUM(monto_pago) as total
FROM pago
GROUP BY DATE(fecha_hora_pago)
ORDER BY fecha DESC;

-- Ver distribución de ocupaciones por modalidad
SELECT 
  modalidad_ocupacion,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as porcentaje
FROM ocupacion
WHERE estado = 'FINALIZADO'
GROUP BY modalidad_ocupacion;

-- Ver abonos creados
SELECT 
  a.playa_id,
  COUNT(*) as total_abonos,
  SUM(b.monto) as recaudacion_inicial
FROM abono a
JOIN boleta b ON b.playa_id = a.playa_id 
  AND b.plaza_id = a.plaza_id 
  AND b.fecha_hora_inicio_abono = a.fecha_hora_inicio
GROUP BY a.playa_id;
```

## 📚 Documentación Relacionada

- [Análisis de Operaciones de BD](./ANALISIS_OPERACIONES_BD.md) - Detalle de todas las operaciones
- [README de Seeds](../scripts/seeds/README.md) - Estructura general de seeds
- [README de Scripts](../scripts/README.md) - Todos los scripts disponibles

## 💡 Tips

1. **Ejecutar regularmente**: Útil después de cambios en la BD para validar que todo sigue funcionando
2. **Combinar con db:reset**: Para empezar desde cero en cada iteración
3. **Personalizar montos**: Ajusta los cálculos de monto en el generador para probar diferentes escenarios
4. **Usar en CI/CD**: Puedes incluir este seed en tests de integración

## 🤝 Contribuir

Si mejoras el generador de datos:

1. Actualiza la documentación en `ANALISIS_OPERACIONES_BD.md`
2. Agrega tests si es posible
3. Documenta los cambios en el README

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0
