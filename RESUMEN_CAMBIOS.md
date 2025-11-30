# Resumen de Cambios: Funcionalidad "Editar y Reajustar Abono Vigente"

## 📋 Descripción General
Implementación completa de la funcionalidad para que administradores puedan editar abonos activos, permitiendo cambiar patente, tipo de vehículo, plaza y observaciones, con actualización automática del precio mensual cuando cambia el tipo de vehículo.

---

## 🗄️ Base de Datos (Migraciones SQL)

### 1. Migración Final: `20251130000002_fix_update_abono_admin_logic.sql`
**Función RPC:** `update_abono_details`

**Características:**
- ✅ Permite editar abonos activos únicamente
- ✅ Validación de permisos (solo playeros de la playa)
- ✅ Actualización de patente con registro automático si no existe
- ✅ Actualización de tipo de vehículo
- ✅ Cambio de plaza con validación de disponibilidad
- ✅ Actualización de observaciones
- ✅ **Actualización automática de `precio_mensual`** cuando cambia el tipo de vehículo
- ✅ Busca tarifa vigente en tabla `tarifa` para nuevo tipo de vehículo
- ✅ Manejo de errores completo con mensajes descriptivos
- ✅ Uso de `FOR UPDATE` para prevenir condiciones de carrera

**Parámetros:**
- `p_playa_id`: UUID (requerido)
- `p_plaza_id`: UUID (requerido)
- `p_fecha_hora_inicio`: TIMESTAMPTZ (requerido)
- `p_nueva_patente`: VARCHAR(7) (opcional)
- `p_nuevo_tipo_vehiculo`: tipo_vehiculo (opcional)
- `p_nueva_plaza_id`: UUID (opcional)
- `p_observaciones`: TEXT (opcional)

**Retorno:**
```json
{
  "success": true,
  "abono_id": { "playa_id": "...", "plaza_id": "...", "fecha_hora_inicio": "..." },
  "mensaje": "Abono actualizado exitosamente",
  "precio_mensual_anterior": 1000.00,
  "precio_mensual_nuevo": 1200.00
}
```

### 2. Migraciones Intermedias Corregidas
- `20251130000000_simplify_update_abono_rpc.sql`: Versión simplificada inicial
- `20251130000001_simplify_and_fix_abono_rpc.sql`: Agregado soporte para registro de vehículos nuevos

**Nota:** Todas las migraciones incluyen `DROP FUNCTION IF EXISTS ... CASCADE` y `COMMENT ON FUNCTION` con firma completa para evitar ambigüedades.

---

## 🔧 Backend (TypeScript - Service Layer)

### 1. Tipos (`src/services/abonos/types.ts`)
**Nuevos tipos agregados:**
- `UpdateAbonoParams`: Parámetros para actualizar un abono
- `UpdateAbonoResponse`: Respuesta de la actualización con precios anteriores/nuevos
- `AbonoDetails`: Extendido para incluir `observaciones`

### 2. Servicio (`src/services/abonos/updateAbono.ts`)
**Funcionalidad:**
- Llama a la RPC `update_abono_details`
- Manejo de errores con traducción de mensajes de base de datos
- Validación de respuesta del servidor
- Conversión de parámetros a formato requerido por la RPC

### 3. Servicio de Lectura (`src/services/abonos/getAbonoById.ts`)
**Mejoras:**
- Incluye campo `observaciones` en el SELECT
- Retorna `observaciones` en el objeto `AbonoDetails`
- Permite pre-llenar el formulario de edición

### 4. Schema de Validación (`src/schemas/abono.ts`)
**Nuevo schema:** `updateAbonoSchema`
- Validación de UUIDs para playa y plaza
- Validación de formato de patente (regex: `^(?:[A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})$`)
- Validación condicional: tipo de vehículo requerido si se ingresa nueva patente
- Validación de longitud máxima para observaciones (500 caracteres)

### 5. Exportaciones (`src/services/abonos/index.ts`)
- Exporta `updateAbono`
- Exporta `getAbonoById`

---

## 🎨 Frontend (React/Next.js)

### 1. Hook de Mutación (`src/hooks/mutations/abonos.tsx`)
**Nuevo hook:** `useUpdateAbono`
- Usa `useMutation` de TanStack Query
- Invalida queries de `abonos-vigentes` y `abono` al tener éxito
- Muestra toast de éxito con mensaje dinámico
- Muestra toast de error con mensaje descriptivo

### 2. Componente de Edición (`src/app/admin/abonos/components/EditAbonoDialog.tsx`)
**Características:**
- Modal/Dialog usando shadcn/ui
- Formulario con `react-hook-form` + `zodResolver`
- Carga datos del abono al abrir
- Campos del formulario:
  - **Patente:** Input con validación de formato
  - **Tipo de Vehículo:** Select con opciones (AUTOMOVIL, MOTOCICLETA, CAMIONETA)
  - **Plaza:** Select con plazas disponibles (incluye la plaza actual)
  - **Observaciones:** Textarea con máximo 500 caracteres
- Información de solo lectura:
  - Cliente (Nombre, Apellido, DNI)
  - Fecha de inicio
  - Fecha de fin (read-only)
- Alerta informativa cuando se detecta cambio de vehículo
- Estados de carga y error manejados correctamente
- Pre-llenado de campos con datos actuales del abono

### 3. Botón de Edición (`src/app/admin/abonos/components/TableContainer/Columns/EditButton/index.tsx`)
**Componente nuevo:**
- Botón de acción con ícono de editar
- Abre el `EditAbonoDialog` con los datos de la fila seleccionada
- Maneja estado de apertura/cierre del modal

### 4. Integración en Tablas
**Archivos modificados:**
- `src/app/admin/abonos/components/TableContainer/Columns/index.tsx`
- `src/app/admin/abonos/playa-actual/components/TableContainer/Columns/index.tsx`

**Cambios:**
- Agregado `EditButton` en la columna de acciones
- Importado y renderizado correctamente

### 5. Queries (`src/app/admin/abonos/queries.ts`)
**Nueva función:** `getAbonoByIdAction`
- Wrapper server action para `getAbonoById`
- Permite usar la función desde componentes del cliente

### 6. Exportaciones (`src/app/admin/abonos/components/index.ts`)
- Exporta `EditAbonoDialog` como componente default

---

## 🔄 Flujo de Funcionamiento

1. **Usuario hace clic en "Editar"** en la tabla de abonos
2. **Se abre `EditAbonoDialog`** y carga los datos del abono mediante `getAbonoByIdAction`
3. **Usuario modifica campos** (patente, tipo de vehículo, plaza, observaciones)
4. **Validación en tiempo real** con Zod schema
5. **Al enviar el formulario:**
   - Se llama a `updateAbono` (service)
   - Se ejecuta la RPC `update_abono_details`
   - La RPC valida permisos, actualiza datos y calcula nuevo precio si cambia tipo de vehículo
   - Se muestra toast de éxito con mensaje
   - Se invalidan queries para refrescar la tabla
6. **La tabla se actualiza** automáticamente con los nuevos datos

---

## ✅ Validaciones Implementadas

### Backend (SQL)
- ✅ Solo se pueden editar abonos activos
- ✅ Validación de permisos (playero de la playa)
- ✅ Validación de formato de patente
- ✅ Validación de disponibilidad de plaza
- ✅ Validación de existencia de tarifa para nuevo tipo de vehículo
- ✅ Manejo de vehículos nuevos (upsert)

### Frontend (Zod)
- ✅ UUIDs válidos para playa y plaza
- ✅ Formato de patente válido
- ✅ Tipo de vehículo requerido si se cambia patente
- ✅ Longitud máxima de observaciones (500 caracteres)

---

## 📁 Archivos Nuevos

1. `supabase/migrations/20251130000002_fix_update_abono_admin_logic.sql`
2. `src/services/abonos/updateAbono.ts`
3. `src/services/abonos/getAbonoById.ts`
4. `src/hooks/mutations/abonos.tsx`
5. `src/app/admin/abonos/components/EditAbonoDialog.tsx`
6. `src/app/admin/abonos/components/TableContainer/Columns/EditButton/index.tsx`

## 📝 Archivos Modificados

1. `supabase/migrations/20251130000000_simplify_update_abono_rpc.sql` (corregido)
2. `supabase/migrations/20251130000001_simplify_and_fix_abono_rpc.sql` (corregido)
3. `src/services/abonos/types.ts`
4. `src/services/abonos/index.ts`
5. `src/schemas/abono.ts`
6. `src/app/admin/abonos/queries.ts`
7. `src/app/admin/abonos/components/index.ts`
8. `src/app/admin/abonos/components/TableContainer/Columns/index.tsx`
9. `src/app/admin/abonos/playa-actual/components/TableContainer/Columns/index.tsx`
10. `src/app/admin/abonos/[playaId]/[plazaId]/[fechaHoraInicio]/boletas/components/RegistrarPagoModal.tsx`

---

## 🎯 Características Destacadas

1. **Registro Automático de Vehículos:** Si se ingresa una patente nueva, se registra automáticamente con su tipo de vehículo
2. **Actualización de Precio:** Cuando cambia el tipo de vehículo, se busca y aplica la tarifa vigente automáticamente
3. **Validación Inteligente:** El sistema valida que exista una tarifa configurada antes de permitir el cambio
4. **UX Mejorada:** Alerta informativa cuando se detecta que cambiará el precio
5. **Prevención de Errores:** Uso de `FOR UPDATE` en SQL para prevenir condiciones de carrera
6. **Idempotencia:** Todas las migraciones son idempotentes con `DROP FUNCTION IF EXISTS ... CASCADE`

---

## 🔐 Seguridad

- ✅ Validación de permisos en la RPC (solo playeros de la playa)
- ✅ Función con `SECURITY DEFINER` para operaciones controladas
- ✅ Validación de estado (solo abonos activos)
- ✅ Validación de integridad referencial (plaza pertenece a la playa)
- ✅ Prevención de condiciones de carrera con `FOR UPDATE`

---

## 📊 Estadísticas

- **Archivos nuevos:** 6
- **Archivos modificados:** 10
- **Migraciones SQL:** 4 (1 final + 3 intermedias)
- **Líneas de código:** ~1500+ líneas agregadas
- **Funciones nuevas:** 3 (1 RPC + 2 TypeScript)
- **Componentes nuevos:** 2
- **Hooks nuevos:** 1

---

## ✨ Próximos Pasos Sugeridos

1. ✅ Testing manual de la funcionalidad
2. ⏳ Testing de casos edge (vehículos duplicados, tarifas faltantes, etc.)
3. ⏳ Documentación de usuario final
4. ⏳ Considerar agregar historial de cambios (auditoría)

