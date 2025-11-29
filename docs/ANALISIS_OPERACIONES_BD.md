# Análisis de Operaciones de Base de Datos: Ocupaciones y Abonos

## Resumen Ejecutivo

Este documento detalla todas las operaciones de base de datos, validaciones y dependencias necesarias para registrar ocupaciones y abonos en el sistema NJX Control. Esta información es fundamental para crear semillas de datos útiles para probar reportes de recaudación.

---

## 1. FLUJO DE OCUPACIONES

### 1.1 Crear Ocupación (`createOcupacion`)

#### Precondiciones

1. **Usuario Autenticado**
   - Debe existir sesión válida
   - Usuario debe tener rol `PLAYERO` o `DUENO`

2. **Validación de Turno**
   - **Si es PLAYERO**: DEBE tener turno activo en la playa
     ```sql
     SELECT * FROM turno
     WHERE playa_id = :playaId
       AND playero_id = :userId
       AND fecha_hora_salida IS NULL
     ```
   - **Si es DUENO**: NO requiere turno (bypass de validación)

3. **Plaza Disponible**
   - La plaza no debe tener ocupación activa
   - Validado por constraint único en BD:
     ```sql
     UNIQUE (playa_id, patente) WHERE hora_egreso IS NULL
     ```

4. **Configuración de Playa**
   - Modalidad de ocupación debe estar activa:
     ```sql
     SELECT * FROM modalidad_ocupacion_playa
     WHERE playa_id = :playaId
       AND modalidad_ocupacion = :modalidad
       AND estado = 'ACTIVO'
     ```
   - Tipo de vehículo debe estar habilitado:
     ```sql
     SELECT * FROM tipo_vehiculo_playa
     WHERE playa_id = :playaId
       AND tipo_vehiculo = :tipo
       AND estado = 'ACTIVO'
     ```

#### Operaciones en Base de Datos

1. **INSERT en tabla `ocupacion`**
   ```sql
   INSERT INTO ocupacion (
     playa_id,
     plaza_id,
     playero_id,
     patente,
     tipo_vehiculo,
     modalidad_ocupacion,
     numero_pago,
     hora_ingreso,  -- DEFAULT now()
     estado         -- DEFAULT 'ACTIVO'
   ) VALUES (...)
   ```

2. **Constraints Aplicados**
   - `idx_ocupacion_patente_activa`: Previene patentes duplicadas activas
   - `ocupacion_playero_id_fkey`: FK a `auth.users`
   - `ocupacion_playa_id_fkey`: FK a `playa`
   - `ocupacion_plaza_id_fkey`: FK a `plaza`

3. **Valores por Defecto**
   - `hora_ingreso`: `now()` (timestamp del servidor)
   - `hora_egreso`: `NULL`
   - `estado`: `'ACTIVO'`
   - `numero_pago`: `NULL`

#### Resultado
- Retorna la ocupación creada con ID
- Cache revalidado: `/admin/ocupaciones`
- Estado inicial: `ACTIVO`

---

### 1.2 Finalizar Ocupación (`finalizar_ocupacion_y_registrar_pago`)

#### Precondiciones

1. **Ocupación Válida**
   - Debe existir
   - No debe estar finalizada (`hora_egreso IS NULL`)
   - Estado debe ser `ACTIVO`

2. **Turno Activo del Playero**
   ```sql
   SELECT * FROM turno
   WHERE playa_id = :playaId
     AND playero_id = :playeroId
     AND fecha_hora_salida IS NULL
   ```

3. **Método de Pago Activo**
   ```sql
   SELECT * FROM metodo_pago_playa
   WHERE playa_id = :playaId
     AND metodo_pago = :metodoPago
     AND estado = 'ACTIVO'
   ```

4. **Tarifa Configurada**
   ```sql
   SELECT * FROM v_tarifas
   WHERE playa_id = :playaId
     AND tipo_plaza_id = :tipoPlazaId
     AND modalidad_ocupacion = :modalidad
     AND tipo_vehiculo = :tipoVehiculo
   ```

5. **Monto Válido**
   - Debe ser mayor a 0
   - Puede ser monto manual o calculado por tarifa

#### Cálculo de Monto

```typescript
// Duración en minutos
const duracion = (hora_egreso - hora_ingreso) / 60

// Según modalidad
if (modalidad === 'POR_HORA') {
  monto = CEIL(duracion / 60) * precio_base
} else if (modalidad === 'DIARIA') {
  monto = CEIL(duracion / 1440) * precio_base
} else if (modalidad === 'SEMANAL') {
  monto = CEIL(duracion / (1440 * 7)) * precio_base
}
```

#### Operaciones en Base de Datos

1. **Lock Optimista para Número de Pago**
   ```sql
   SELECT pg_advisory_xact_lock(hashtext('pago_' || playa_id::text))
   ```

2. **Generar Número de Pago Secuencial**
   ```sql
   SELECT COALESCE(MAX(numero_pago), 0) + 1
   FROM pago
   WHERE playa_id = :playaId
   ```

3. **INSERT en tabla `pago`**
   ```sql
   INSERT INTO pago (
     playa_id,
     numero_pago,
     ocupacion_id,
     boleta_id,              -- NULL para ocupaciones
     metodo_pago,
     monto_pago,
     playero_id,
     turno_fecha_hora_ingreso,
     fecha_hora_pago,        -- now()
     observaciones
   ) VALUES (...)
   ```

4. **UPDATE en tabla `ocupacion`**
   ```sql
   UPDATE ocupacion
   SET hora_egreso = now(),
       numero_pago = :numeroPago,
       estado = 'FINALIZADO',
       playero_cierre_id = :playeroId,
       fecha_modificacion = now()
   WHERE ocupacion_id = :ocupacionId
   ```

5. **INSERT en `pago_event_log` (auditoría)**
   ```sql
   INSERT INTO pago_event_log (pago_id, evento, payload)
   VALUES (:pagoId, 'SUCCESS', jsonb_build_object(...))
   ```

#### Resultado
```json
{
  "ok": true,
  "pagoId": "uuid",
  "numeroPago": 123,
  "monto": 5000,
  "horaEgreso": "2025-11-26T15:30:00Z",
  "montoSugerido": 5000
}
```

---

## 2. FLUJO DE ABONOS

### 2.1 Crear Abonado con Abono (`create_abonado_with_abono`)

#### Precondiciones

1. **Usuario es Playero Activo**
   ```sql
   SELECT 1 FROM playero_playa
   WHERE playero_id = auth.uid()
     AND playa_id = :playaId
     AND estado = 'ACTIVO'
   ```

2. **Turno Activo**
   ```sql
   SELECT 1 FROM turno
   WHERE playa_id = :turnoPlayaId
     AND playero_id = :turnoPlayeroId
     AND fecha_hora_ingreso = :turnoFechaHoraIngreso
     AND fecha_hora_salida IS NULL
   ```

3. **Plaza Válida y Disponible**
   - Plaza pertenece a la playa
   - Plaza NO tiene abono activo:
   ```sql
   SELECT 1 FROM abono
   WHERE plaza_id = :plazaId
     AND playa_id = :playaId
     AND estado = 'ACTIVO'
     AND (fecha_fin IS NULL OR fecha_fin > CURRENT_TIMESTAMP)
   ```

4. **Tarifa de Abono Configurada**
   - Usa función `get_max_tarifa_abono_vehiculos()` para calcular precio
   - Debe existir tarifa para al menos un vehículo

#### Operaciones en Base de Datos

##### 1. Crear o Actualizar Abonado

```sql
-- Buscar por DNI
SELECT abonado_id FROM abonado WHERE dni = :dni

-- Si existe: UPDATE
UPDATE abonado
SET nombre = :nombre,
    apellido = :apellido,
    email = COALESCE(:email, email),
    telefono = COALESCE(:telefono, telefono)
WHERE abonado_id = :abonadoId

-- Si no existe: INSERT
INSERT INTO abonado (nombre, apellido, email, telefono, dni)
VALUES (...)
RETURNING abonado_id
```

##### 2. Crear Abono

```sql
INSERT INTO abono (
  playa_id,
  plaza_id,
  abonado_id,
  fecha_hora_inicio,
  fecha_fin,                              -- NULL (sin fin)
  precio_mensual,
  estado,                                  -- 'ACTIVO'
  turno_creacion_playa_id,
  turno_creacion_playero_id,
  turno_creacion_fecha_hora_ingreso
) VALUES (...)
```

##### 3. Registrar Vehículos

```sql
-- Para cada vehículo
INSERT INTO vehiculo (patente, tipo_vehiculo)
VALUES (:patente, :tipoVehiculo)
ON CONFLICT (patente) DO NOTHING

-- Vincular al abono
INSERT INTO abono_vehiculo (
  playa_id,
  plaza_id,
  fecha_hora_inicio,
  patente
) VALUES (...)
```

##### 4. Generar Primera Boleta

```sql
INSERT INTO boleta (
  playa_id,
  plaza_id,
  fecha_hora_inicio_abono,
  fecha_generacion_boleta,              -- CURRENT_DATE
  fecha_vencimiento_boleta,             -- + 15 días
  monto,
  monto_pagado,                          -- = monto (pagada)
  estado                                 -- 'PAGADA'
) VALUES (...)
RETURNING boleta_id
```

##### 5. Registrar Pago Inicial

```sql
-- Generar numero_pago
SELECT COALESCE(MAX(numero_pago), 0) + 1
FROM pago WHERE playa_id = :playaId

-- Insertar pago vinculado a boleta
INSERT INTO pago (
  playa_id,
  numero_pago,
  boleta_id,                             -- Vinculado a boleta
  fecha_hora_pago,
  monto_pago,
  metodo_pago,
  playero_id,
  turno_fecha_hora_ingreso
) VALUES (...)
```

##### 6. Trigger Automático

El trigger `update_boleta` genera boletas mensuales automáticamente:
- Se ejecuta cuando cambia el abono
- Genera boletas futuras hasta `fecha_fin` (si existe)
- Cada boleta: vencimiento al fin de mes

#### Resultado

```json
{
  "abonado": {
    "abonado_id": 123,
    "nombre": "Juan",
    "apellido": "Pérez",
    "dni": "12345678",
    "ya_existia": false
  },
  "abono": {
    "playa_id": "uuid",
    "plaza_id": "uuid",
    "fecha_hora_inicio": "2025-11-26T10:00:00Z",
    "fecha_fin": null,
    "precio_mensual": 15000,
    "estado": "ACTIVO"
  },
  "vehiculos": [
    {"patente": "ABC123", "tipo_vehiculo": "AUTO"}
  ],
  "boleta_inicial": {
    "boleta_id": "uuid",
    "fecha_generacion": "2025-11-26",
    "fecha_vencimiento": "2025-12-11",
    "monto": 15000,
    "estado": "PAGADA"
  },
  "pago": {
    "pago_id": "uuid",
    "numero_pago": 45,
    "monto": 15000,
    "metodo_pago": "TRANSFERENCIA"
  }
}
```

---

## 3. DEPENDENCIAS CLAVE

### 3.1 Tabla `turno`

**Columnas principales:**
- `playa_id`, `playero_id`, `fecha_hora_ingreso` (PK compuesta)
- `fecha_hora_salida` (NULL = turno abierto)

**Importancia:**
- Vincula todas las operaciones (ocupaciones/abonos) al playero y su turno
- Permite auditoría de quién realizó cada operación
- Campo `turno_fecha_hora_ingreso` en `pago` referencia este turno

### 3.2 Tabla `playa` (Configuración)

Cada playa debe tener:

1. **Modalidades habilitadas** (`modalidad_ocupacion_playa`)
   - `POR_HORA`, `DIARIA`, `SEMANAL`, `ABONO`
   - Estado: `ACTIVO`

2. **Métodos de pago** (`metodo_pago_playa`)
   - `EFECTIVO`, `TRANSFERENCIA`, `DEBITO`, `CREDITO`, `QR`
   - Estado: `ACTIVO`

3. **Tipos de vehículo** (`tipo_vehiculo_playa`)
   - `AUTO`, `MOTO`, `CAMIONETA`, `UTILITARIO`
   - Estado: `ACTIVO`

### 3.3 Tabla `tarifa`

**Columnas de identificación:**
- `playa_id`
- `tipo_plaza_id`
- `modalidad_ocupacion`
- `tipo_vehiculo`
- `precio_base`

**Tipos de tarifas:**
- Ocupaciones: `POR_HORA`, `DIARIA`, `SEMANAL`
- Abonos: `ABONO` (precio mensual)

### 3.4 Tabla `playero_playa`

**Relación muchos a muchos:**
- Un playero puede trabajar en múltiples playas
- Una playa puede tener múltiples playeros

**Columnas:**
- `playero_id`, `playa_id` (PK compuesta)
- `dueno_invitador_id`
- `estado`: `ACTIVO` | `INACTIVO` | `INVITACION_PENDIENTE`

---

## 4. ESTRUCTURA DE DATOS PARA SEMILLAS

### 4.1 Orden de Inserción

```
1. Usuarios (auth.users)
2. Roles (rol_usuario)
3. Ciudades
4. Playas
5. Configuración de playas:
   - Tipos de plaza
   - Modalidades de ocupación
   - Métodos de pago
   - Tipos de vehículo
6. Plazas
7. Tarifas
8. Relaciones playero-playa
9. TURNOS (prerequisito para pagos)
10. Ocupaciones + Pagos
11. Abonos + Boletas + Pagos
```

### 4.2 Datos Mínimos para Reportes

Para probar reportes de recaudación necesitas:

1. **Al menos 2 playas** con configuración completa
2. **Múltiples playeros** (2-3 por playa)
3. **Turnos históricos** (últimos 30 días)
4. **Mix de operaciones:**
   - Ocupaciones por hora (mayoría)
   - Ocupaciones diarias
   - Abonos con pagos iniciales
5. **Diferentes métodos de pago**
6. **Diferentes tipos de vehículos**

### 4.3 Escenarios de Prueba

#### Escenario 1: Día típico con ocupaciones
- 10-15 ocupaciones por turno
- 70% por hora, 30% diarias
- Mix de tipos de vehículo (50% auto, 30% moto, 20% camioneta)
- Mix de métodos de pago (60% efectivo, 40% transferencia)

#### Escenario 2: Creación de abonos
- 2-3 abonos por semana
- 50% con un vehículo, 50% con múltiples
- Pago inicial completo
- Genera boletas mensuales automáticamente

#### Escenario 3: Múltiples playas y playeros
- Playeros que trabajan en una sola playa
- Playeros que trabajan en múltiples playas
- Turnos alternados entre playeros
- Recaudación distribuida

---

## 5. VALIDACIONES Y CONSTRAINTS

### 5.1 Constraints de Integridad

```sql
-- Ocupación activa única por patente
UNIQUE (playa_id, patente) WHERE hora_egreso IS NULL

-- Turno activo único por playero/playa
UNIQUE (playa_id, playero_id) WHERE fecha_hora_salida IS NULL

-- Abono activo único por plaza
CHECK: validado en aplicación (RPC)

-- Número de pago único por playa
UNIQUE (playa_id, numero_pago)
```

### 5.2 Validaciones de Negocio

1. **Playero debe tener turno activo** (excepto dueños)
2. **Método de pago debe estar activo** en la playa
3. **Modalidad debe estar habilitada** en la playa
4. **Tipo de vehículo debe estar permitido** en la playa
5. **Debe existir tarifa** para la combinación de parámetros
6. **Monto debe ser > 0**
7. **Plaza no debe estar ocupada/abonada**

---

## 6. LOGS Y AUDITORÍA

### 6.1 Tabla `pago_event_log`

Registra eventos de pagos:
```sql
INSERT INTO pago_event_log (pago_id, evento, payload)
VALUES (:pagoId, 'SUCCESS', jsonb_build_object(...))
```

### 6.2 Campos de Auditoría

Todas las tablas principales tienen:
- `fecha_creacion` (DEFAULT now())
- `fecha_modificacion` (actualizada en cada UPDATE)

### 6.3 Logs de Función RPC

Las funciones PL/pgSQL logean errores:
```sql
RAISE LOG 'finalizar_ocupacion: TARIFA_NOT_FOUND (playa %, ...)', ...
```

---

## 7. CONSIDERACIONES PARA REPORTES

### 7.1 Vista `v_ocupaciones`

Une datos de:
- ocupacion
- plaza
- tipo_plaza
- playa
- usuario (playero apertura)
- usuario (playero cierre)
- pago

### 7.2 Consultas de Recaudación

```sql
-- Recaudación por ocupaciones
SELECT
  p.playa_id,
  p.fecha_hora_pago::DATE as fecha,
  SUM(p.monto_pago) as recaudacion
FROM pago p
WHERE p.ocupacion_id IS NOT NULL
  AND p.fecha_hora_pago BETWEEN :desde AND :hasta
GROUP BY p.playa_id, fecha

-- Recaudación por abonos
SELECT
  p.playa_id,
  p.fecha_hora_pago::DATE as fecha,
  SUM(p.monto_pago) as recaudacion
FROM pago p
WHERE p.boleta_id IS NOT NULL
  AND p.fecha_hora_pago BETWEEN :desde AND :hasta
GROUP BY p.playa_id, fecha
```

### 7.3 Joins Importantes

```sql
-- Pago → Playa
pago.playa_id = playa.playa_id

-- Pago → Playero (quien cobró)
pago.playero_id = auth.users.id

-- Pago → Ocupación
pago.ocupacion_id = ocupacion.ocupacion_id

-- Pago → Boleta (abonos)
pago.boleta_id = boleta.boleta_id

-- Pago → Turno
pago.playa_id = turno.playa_id
AND pago.playero_id = turno.playero_id
AND pago.turno_fecha_hora_ingreso = turno.fecha_hora_ingreso
```

---

## 8. ERRORES COMUNES

### 8.1 Al Crear Ocupación

| Error | Causa | Solución |
|-------|-------|----------|
| `TURN_NOT_ACTIVE` | No hay turno abierto | Crear turno primero |
| `OCUPACION_ALREADY_EXISTS` | Patente duplicada | Usar patente diferente |
| `PLAZA_NOT_AVAILABLE` | Plaza ocupada | Usar otra plaza |

### 8.2 Al Finalizar Ocupación

| Error | Causa | Solución |
|-------|-------|----------|
| `TARIFA_NOT_FOUND` | Sin tarifa configurada | Crear tarifa |
| `METODO_PAGO_INACTIVO` | Método no habilitado | Activar método en playa |
| `MISSING_OR_INVALID_AMOUNT` | Monto <= 0 | Proporcionar monto válido |

### 8.3 Al Crear Abono

| Error | Causa | Solución |
|-------|-------|----------|
| `TURNO_CLOSED` | Turno cerrado | Abrir turno |
| `PLAZA_HAS_ACTIVE_ABONO` | Plaza ya abonada | Usar otra plaza |
| `NO_TARIFA_ABONO` | Sin tarifa de abono | Crear tarifa ABONO |

---

## 9. SCRIPTS DE SEED

### 9.1 Archivo Principal
`scripts/seed-recaudacion-reportes.ts`

### 9.2 Datos de Prueba
`scripts/seeds/dev/recaudacion-reportes.ts`

### 9.3 Ejecución
```bash
# 1. Seed base (estructura)
pnpm tsx scripts/db-seed.ts

# 2. Seed de recaudación (datos históricos)
pnpm tsx scripts/seed-recaudacion-reportes.ts
```

### 9.4 Resultado Esperado
- ~120 ocupaciones finalizadas
- ~10 abonos activos
- Recaudación total: ~$500,000-800,000 ARS
- Distribución en últimos 30 días
- Múltiples playeros y playas

---

## 10. CONCLUSIÓN

Este análisis cubre:
✅ Todas las operaciones de BD para ocupaciones
✅ Todas las operaciones de BD para abonos
✅ Precondiciones y validaciones
✅ Dependencias y relaciones
✅ Estructura de datos para semillas
✅ Consideraciones para reportes

**Próximos pasos:**
1. Ejecutar `db-seed.ts` para estructura base
2. Ejecutar `seed-recaudacion-reportes.ts` para datos históricos
3. Probar reportes en `/admin/analytics/recaudacion-por-playa`
4. Ajustar cantidades/fechas según necesidades de prueba
