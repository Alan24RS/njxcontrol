# 🗂️ Diagrama Entidad-Relación (DER) - Valet

## 📋 Introducción

Este documento contiene el **Diagrama Entidad-Relación (DER)** completo del sistema Valet. Fue diseñado por el equipo de desarrollo como referencia principal para la arquitectura de datos del proyecto.

### 🎯 Propósito

- **Guía de desarrollo**: Define las entidades, atributos y relaciones planificadas
- **Referencia para agentes de IA**: Los agentes deben consultar este documento para entender la estructura de datos esperada
- **Roadmap de base de datos**: Indica hacia dónde debe evolucionar el sistema
- **Documento vivo**: Puede mejorarse con el tiempo, pero los cambios deben documentarse

### ⚠️ Importante

- Este DER es la **visión ideal** del sistema
- Algunas entidades o campos pueden no estar implementados aún
- La implementación actual puede diferir levemente, pero debe tender hacia este diseño
- Cualquier desviación significativa debe estar justificada y documentada

---

## 📊 Entidades y Atributos

### 👤 Usuario

Entidad base para todos los usuarios del sistema.

```dbml
Table Usuario {
  usuarioId int [pk, increment]
  email    varchar(50) [not null, unique]
  contraseña varchar(128) [not null]
  verificado boolean [not null]
  nombre     varchar(50) [not null]
  telefono    varchar(20)
}
```

**Descripción**: Usuario genérico del sistema. Puede especializarse en Dueño o Playero.

---

### 👨‍💼 Dueño

Especialización de Usuario que puede ser propietario de playas.

```dbml
Table Dueño {
  dueñoId   int         [pk, increment, ref: - Usuario.usuarioId]
  cuil varchar(11) [unique, not null]  
}
```

**Relación**: Herencia 1:1 con Usuario (el `dueñoId` es también el `usuarioId`)

---

### 👷 Playero

Especialización de Usuario que trabaja en playas.

```dbml
Table Playero {
  playeroId   int [pk, increment ,ref: - Usuario.usuarioId]
  fechaInicioTrabajo date  [not null]
  fechaFinTrabajo   date
}
```

**Campos importantes**:
- `fechaInicioTrabajo`: Fecha de alta en el sistema
- `fechaFinTrabajo`: Baja lógica del playero (NULL = activo)

---

### 🏖️ Playa

Establecimiento de estacionamiento.

```dbml
Table Playa {
  playaId          int         [pk, increment]
  playaDueñoId    int         [not null, ref: > Dueño.dueñoId]
  horario       varchar(255)
  descripcion varchar (255)
  lat      float [not null]
  lng      float [not null]
  calle    varchar(50) [not null]
  numero   int [not null]
}
```

**Relación**: Cada playa pertenece a un único dueño (1:N)

---

### 🏷️ Caracteristica

Características asignables a tipos de plaza (techada, vigilancia, etc.).

```dbml
Table Caracteristica {
  caracteristicaId int [pk, increment]
  nombre varchar (20) [not null]
}
```

**Ejemplos**: "Techada", "Con cargador", "Vigilancia 24/7", "Cerca de entrada"

---

### 📦 TipoPlaza

Tipos de plaza definidos por cada playa.

```dbml
Table TipoPlaza {
  playaId int [ref: > Playa.playaId]
  tipoPlazaId int [increment]
  nombre          varchar(50) [not null]
  descripcion varchar(100)
  
  indexes {
    (playaId, tipoPlazaId) [pk]
  }
}
```

**Clave compuesta**: `(playaId, tipoPlazaId)` - Los IDs de tipo de plaza son únicos por playa

**Ejemplos**: "Estándar", "Premium", "Compacta", "SUV"

---

### 🔗 TipoPlazaCaracteristica

Relación N:M entre TipoPlaza y Caracteristica.

```dbml
Table TipoPlazaCaracteristica {
  playaId int
  tipoPlazaId int
  caracteristicaId int
  
  indexes {
    (playaId, tipoPlazaId, caracteristicaId) [pk]
  }
}

Ref: TipoPlazaCaracteristica.(playaId, tipoPlazaId) > TipoPlaza.(playaId, tipoPlazaId)
Ref: TipoPlazaCaracteristica.(caracteristicaId) > Caracteristica.(caracteristicaId)
```

**Descripción**: Permite asignar múltiples características a un tipo de plaza.

---

### 🅿️ Plaza

Espacios de estacionamiento individuales.

```dbml
ENUM PlazaEstado {
  ocupada
  libre
}

Table Plaza {
  playaId  int [ref: > Playa.playaId]
  plazaId int
  tipoPlazaId  int [not null]
  identificador varchar(50) [not null]
  estado PlazaEstado [not null]

  Indexes {
    (playaId, plazaId) [pk]
  }
}

Ref: Plaza.(playaId, tipoPlazaId) > TipoPlaza.(playaId, tipoPlazaId)
```

**Clave compuesta**: `(playaId, plazaId)` - Los IDs de plaza son únicos por playa

**Estados**: `libre`, `ocupada`

---

### 🚗 TipoVehiculo

Tipos de vehículos soportados por el sistema.

```dbml
Table TipoVehiculo {
  tipoVehiculoId int [pk, increment]
  nombre  varchar(20) [not null]
}
```

**Ejemplos**: "Auto", "Moto", "Camioneta", "Bicicleta"

---

### 🚙 Vehiculo

Vehículos registrados en el sistema.

```dbml
Table Vehiculo {
  patente           varchar(20) [pk]
  tipoVehiculoId int [not null, ref: > TipoVehiculo.tipoVehiculoId]
}
```

**Clave primaria**: `patente` - Identificación única del vehículo

---

### 👥 Abonado

Clientes con suscripciones recurrentes (abonos).

```dbml
Table Abonado {
  abonadoId int [pk, increment]
  dni            int [unique]
  nombre         varchar(50) [not null]
  telefono       varchar(20) 
}
```

**Descripción**: Clientes que contratan abonos para estacionar regularmente. Los abonos son suscripciones de largo plazo (generalmente mensuales) que se gestionan en un sistema separado de las ocupaciones esporádicas.

---

### 📅 ModalidadOcupacion

Modalidades de cobro para ocupaciones esporádicas.

```dbml
Table ModalidadOcupacion {
  modalidadOcupacionId          int          [pk, increment]
  nombre      varchar(100) [not null]
}
```

**Valores permitidos**: `POR_HORA`, `DIARIA`, `SEMANAL`

**Nota importante**: Las ocupaciones mensuales o recurrentes se manejan exclusivamente a través del sistema de **ABONOS**, que es conceptualmente diferente y tiene su propia tabla y flujo de trabajo.

---

### 💰 Tarifa

Precios definidos por playa, tipo de plaza, modalidad y tipo de vehículo.

```dbml
Table Tarifa {
  playaId int
  tipoPlazaId int
  modalidadOcupacionId int
  tipoVehiculoId int
  precio                decimal  [not null] 
  
  Indexes {
    (playaId, tipoPlazaId, modalidadOcupacionId, tipoVehiculoId) [pk]
  }
}

Ref: Tarifa.(playaId, tipoPlazaId) > TipoPlaza.(playaId, tipoPlazaId)
Ref: Tarifa.(modalidadOcupacionId) > ModalidadOcupacion.(modalidadOcupacionId)
Ref: Tarifa.(tipoVehiculoId) > TipoVehiculo.(tipoVehiculoId)
```

**Clave compuesta**: Permite definir precios específicos para cada combinación de factores.

---

### 💳 MetodoPago

Métodos de pago aceptados.

```dbml
Table MetodoPago {
  metodoPagoId     int         [pk, increment]
  nombre varchar(50) [not null]
}
```

**Ejemplos**: "Efectivo", "Débito", "Crédito", "Transferencia", "Mercado Pago"

---

### 🔗 MetodoPagoPlaya

Relación entre playas y métodos de pago habilitados.

```dbml
ENUM MetodoPagoPlayaEstado {
  activo
  suspendido
  inactivo
}

Table MetodoPagoPlaya {
  playaId int [ref: > Playa.playaId]
  metodoPagoId int [ref: > MetodoPago.metodoPagoId]
  estado MetodoPagoPlayaEstado [not null]
  
  indexes {
    (playaId, metodoPagoId) [pk]
  }
}
```

**Descripción**: Cada playa puede habilitar o deshabilitar métodos de pago específicos.

---

### 📋 Abono

Suscripciones de abonados para plazas específicas.

```dbml
Table Abono {
  playaId int
  plazaId int
  fechaHoraInicio datetime
  fechaFin date
  abonadoId int [not null, ref: > Abonado.abonadoId]
  
  Indexes {
    (playaId, plazaId, fechaHoraInicio) [pk] 
  }
}

Ref: Abono.(playaId, plazaId) > Plaza.(playaId, plazaId)
```

**Descripción**: Asocia un abonado a una plaza específica durante un período.

**Clave compuesta**: `(playaId, plazaId, fechaHoraInicio)` - Permite múltiples abonos consecutivos en la misma plaza

---

### 🚘 AbonoVehiculo

Vehículos autorizados para un abono.

```dbml
Table AbonoVehiculo {
  playaId int
  plazaId int
  fechaHoraInicio datetime
  patente varchar(20) [not null]

  Indexes {
    (playaId, plazaId, fechaHoraInicio, patente) [pk]
  }
}

Ref: AbonoVehiculo.(playaId, plazaId, fechaHoraInicio) > Abono.(playaId, plazaId, fechaHoraInicio)
Ref: AbonoVehiculo.patente > Vehiculo.patente
```

**Descripción**: Un abono puede tener múltiples vehículos autorizados.

---

### 🧾 Boleta

Facturas periódicas generadas para abonos.

```dbml
Enum boletaEstado {
  pendiente
  pagada
  vencida
}

Table Boleta {
  playaId int
  plazaId int
  fechaHoraInicioAbono datetime
  fechaGeneracionBoleta date [not null]
  numeroDeBoleta int [unique, increment, not null]
  fechaVencimientoBoleta date [not null]
  fechaPago date
  numeroDePago int
  monto decimal  [not null]
  
  Indexes {
    (playaId, plazaId, fechaHoraInicioAbono, fechaGeneracionBoleta) [pk]
  }
}

Ref: Boleta.(playaId, numeroDePago) - Pago.(playaId, numeroDePago)
Ref: Boleta.(playaId, plazaId, fechaHoraInicioAbono) > Abono.(playaId, plazaId, fechaHoraInicio)
```

**Descripción**: Sistema de facturación para abonos. Se generan automáticamente.

**Estado**: Se infiere del contexto:
- `pendiente`: `fechaPago` es NULL y `fechaVencimientoBoleta` >= hoy
- `pagada`: `fechaPago` tiene valor
- `vencida`: `fechaPago` es NULL y `fechaVencimientoBoleta` < hoy

---

### 🚗 Ocupacion

Registro de ocupaciones esporádicas de plazas.

```dbml
Table Ocupacion {
  playaId int
  plazaId int
  fechaHoraInicio  datetime
  fechaHoraFin     datetime
  patente            varchar(20) [not null]
  modalidadOcupacionId  int        [not null]
  numeroDePago int
  
  indexes {
    (playaId, plazaId, fechaHoraInicio) [pk]
  }
}

Ref: Ocupacion.(playaId, numeroDePago) - Pago.(playaId, numeroDePago)
Ref: Ocupacion.(playaId, plazaId) > Plaza.(playaId, plazaId)
Ref: Ocupacion.patente > Vehiculo.patente
Ref: Ocupacion.modalidadOcupacionId > ModalidadOcupacion.modalidadOcupacionId
```

**Descripción**: Representa el uso de una plaza sin abono (uso esporádico).

**Relación con Pago**: Una ocupación puede tener un pago asociado (0..1)

---

### ⏰ Turno

Turnos de trabajo de playeros.

```dbml
Table Turno {
  playaId int [pk, ref: > Playa.playaId] 
  playeroId int [pk, ref: > Playero.playeroId]
  fechaHoraIngreso  datetime   [not null]
  fechaHoraSalida   datetime
  efectivoInicial int
  efectivoFinal int
  
  Indexes {
    (playaId, playeroId, fechaHoraIngreso) [pk]
  }
}
```

**Nota**: Al finalizar el turno se hace el cierre de caja. Se muestra el total de pagos en efectivo y no efectivo.

**Campos de cierre de caja**:
- `efectivoInicial`: Efectivo con el que se empieza el turno
- `efectivoFinal`: Efectivo al finalizar el turno

---

### 💵 Pago

Registro de todos los pagos realizados.

```dbml
Table Pago {
  playaId int
  numeroDePago int
  fechaHoraPago  datetime   [not null]
  montoPago        decimal   [not null]
  metodoPagoId    int       [not null]
  playeroId int [not null]
  fechaHoraIngreso datetime [not null]
  
  indexes {
    (playaId, numeroDePago) [pk]
  }
}

Ref: Pago.(playaId, playeroId, fechaHoraIngreso) > Turno.(playaId, playeroId, fechaHoraIngreso)
Ref: Pago.(playaId, metodoPagoId) > MetodoPagoPlaya.(playaId, metodoPagoId)
```

**Nota importante**: Existe un **XOR entre Ocupacion y Boleta**. Un pago corresponde a:
- **O** una ocupación esporádica
- **O** una boleta de abono

**Campos de auditoría**:
- `playeroId`, `fechaHoraIngreso`: Relacionan el pago con el turno en el que se efectuó

---

### 🔗 PlayeroPlaya

Relación entre playeros y playas donde trabajan.

```dbml
ENUM PlayeroPlayaEstado {
  activo
  suspendido
  inactivo
}

Table PlayeroPlaya {
  playaId   int         [pk, not null, ref: > Playa.playaId]
  playeroId int         [pk, not null, ref: > Playero.playeroId]
  estado    PlayeroPlayaEstado [not null]
}
```

**Descripción**: Relación N:M. Un playero puede trabajar en múltiples playas, y una playa puede tener múltiples playeros.

**Estados**:
- `activo`: Trabajando actualmente
- `suspendido`: Temporalmente suspendido
- `inactivo`: No trabaja más en esa playa

---

## 🔗 Relaciones Principales

### Jerarquía de Usuario

```
Usuario (base)
  ├─ Dueño (1:1 herencia)
  └─ Playero (1:1 herencia)
```

### Playa y sus componentes

```
Playa (1) ──── (N) Plaza
Playa (1) ──── (N) TipoPlaza
Playa (1) ──── (N) Tarifa
Playa (N) ──── (N) Playero [via PlayeroPlaya]
Playa (N) ──── (N) MetodoPago [via MetodoPagoPlaya]
```

### Plaza y ocupación

```
Plaza (1) ──── (N) Ocupacion
Plaza (1) ──── (N) Abono
```

### Sistema de precios

```
Tarifa = (Playa + TipoPlaza + ModalidadOcupacion + TipoVehiculo) → Precio
```

### Sistema de facturación

```
Abono (1) ──── (N) Boleta
Boleta (0..1) ──── (1) Pago
Ocupacion (0..1) ──── (1) Pago
```

**Nota**: Existe XOR entre Boleta y Ocupacion en relación a Pago.

---

## 🎯 Casos de Uso Principales

### 1. Cliente Esporádico

```
1. Cliente llega con vehículo (Vehiculo)
2. Se le asigna una plaza (Plaza)
3. Se crea ocupación (Ocupacion) con modalidad y patente
4. Al salir, se calcula tarifa y se registra pago (Pago)
```

### 2. Cliente Abonado

```
1. Cliente contrata abono (Abonado)
2. Se crea abono (Abono) asignando plaza específica
3. Se registran vehículos autorizados (AbonoVehiculo)
4. Sistema genera boletas periódicas (Boleta)
5. Cliente paga boleta → se registra pago (Pago)
```

### 3. Gestión de Playero

```
1. Dueño invita playero (Usuario → Playero)
2. Se asocia a playa (PlayeroPlaya)
3. Playero inicia turno (Turno) con efectivo inicial
4. Cobra estacionamientos → pagos asociados al turno
5. Finaliza turno → cierre de caja (efectivo final)
```

---

## 📐 Convenciones y Consideraciones

### Claves Compuestas

Varias tablas utilizan claves compuestas para permitir particionamiento lógico por playa:

- `(playaId, plazaId)` - Plazas únicas por playa
- `(playaId, tipoPlazaId)` - Tipos de plaza únicos por playa
- `(playaId, plazaId, fechaHoraInicio)` - Ocupaciones/Abonos únicos por plaza y tiempo

**Ventajas**:
- Aislamiento de datos entre playas
- Facilita sharding futuro
- IDs más simples (autoincrement por playa)

### Estados y Enums

Se utilizan ENUMs para campos de estado:

- `PlazaEstado`: libre, ocupada
- `boletaEstado`: pendiente, pagada, vencida
- `PlayeroPlayaEstado`: activo, suspendido, inactivo
- `MetodoPagoPlayaEstado`: activo, suspendido, inactivo

**Razón**: Garantiza integridad referencial y previene valores inválidos.

### Baja Lógica

Se prefiere baja lógica sobre baja física:

- `Playero.fechaFinTrabajo`: NULL = activo
- `PlayeroPlaya.estado`: inactivo en lugar de eliminar
- `MetodoPagoPlaya.estado`: inactivo en lugar de eliminar

**Razón**: Mantiene integridad histórica y permite auditoría.

### Relación XOR en Pago

Un pago puede estar asociado a:
- **O** una `Ocupacion` (pago esporádico)
- **O** una `Boleta` (pago de abono)

Pero **NUNCA** ambas. Esta restricción debe implementarse a nivel de aplicación o trigger.

---

## 🚧 Estado de Implementación

### ✅ Implementado

- Usuario, Dueño (rol), Playero (rol)
- Playa, Plaza, TipoPlaza
- Caracteristica, TipoPlazaCaracteristica
- TipoVehiculo, Vehiculo (parcial)
- ModalidadOcupacion
- Tarifa
- MetodoPago, MetodoPagoPlaya
- Ocupacion (parcial)
- Turno
- PlayeroPlaya

### 🚧 En Progreso

- Abonado (schemas y services creados)
- Abono (schemas y services creados)
- AbonoVehiculo (pendiente)
- Boleta (pendiente)
- Pago (parcial - vinculación con ocupación y boleta)

### ⏳ Pendiente

- Sistema completo de facturación de abonos
- Integración completa de pagos con turnos
- Validación XOR entre Boleta y Ocupacion
- Cierres de caja automatizados
- Reportes financieros

---

## 📝 Notas para Desarrollo

### Para Implementar Nueva Entidad

1. ✅ Crear migración SQL (con RLS)
2. ✅ Definir schema Zod en `/src/schemas/`
3. ✅ Crear tipos TypeScript en service
4. ✅ Implementar servicios CRUD en `/src/services/`
5. ✅ Crear componentes UI necesarios
6. ✅ Añadir a documentación de API

### Para Agentes de IA

Al trabajar en el proyecto, los agentes deben:

1. **Consultar este DER** antes de proponer cambios en la base de datos
2. **Respetar las relaciones** definidas aquí
3. **Mantener consistencia** con los nombres y tipos de datos
4. **Proponer mejoras** al DER cuando encuentren casos de uso no contemplados
5. **Documentar desviaciones** si la implementación difiere del DER

---

## 📚 Referencias

- [DATABASE.md](./DATABASE.md) - Implementación actual de la base de datos
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura general del proyecto
- [RLS_VIEWS.md](./RLS_VIEWS.md) - Políticas de seguridad Row Level Security

---

**Última actualización**: 2025-10-25  
**Versión**: 1.0  
**Mantenedores**: Equipo Valet

