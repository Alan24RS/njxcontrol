<div align="center">

# 🚗 njx

### Plataforma Integral de Gestión de Estacionamientos Urbanos

[![Next.js](https://img.shields.io/badge/Next.js-15.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.76-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[Características](#-características) • [Stack](#-stack-tecnológico) • [Instalación](#-instalación-rápida) • [Docs](#-documentación) • [Contribuir](#-cómo-contribuir)

<img src="https://raw.githubusercontent.com/yourusername/valet/main/public/demo.png" alt="njx Demo" width="100%" />

</div>

---

## 🎯 Descripción

**njx** revoluciona la gestión de estacionamientos urbanos, conectando conductores con propietarios de playas de estacionamiento mediante una plataforma moderna, escalable y fácil de usar.

### 💡 Problema que Resuelve

- **Para Conductores**: Dificultad para encontrar estacionamiento disponible en tiempo real
- **Para Propietarios**: Falta de herramientas digitales para optimizar la gestión y rentabilidad
- **Para Empleados**: Procesos manuales lentos y propensos a errores

---

## ✨ Características

<table>
<tr>
<td width="50%">

### 👥 Para Conductores

- 🗺️ **Búsqueda Inteligente**
  - Geolocalización automática
  - Mapa interactivo en tiempo real
  - Búsqueda por dirección (Google Places)

- 📍 **Información Detallada**
  - Horarios de atención
  - Tarifas por tipo de vehículo
  - Disponibilidad en tiempo real

</td>
<td width="50%">

### 🏢 Para Propietarios

- 📊 **Panel Administrativo**
  - Dashboard con métricas clave
  - Gestión completa de playas
  - Control de empleados (playeros)

- 💰 **Optimización de Ingresos**
  - Tarifas dinámicas
  - Análisis de ocupación
  - Reportes detallados

</td>
</tr>
<tr>
<td width="50%">

### 👨‍💼 Para Playeros (Empleados)

- 🎫 **Gestión de Ocupaciones**
  - Registro rápido de entradas/salidas
  - Cálculo automático de tarifas
  - Generación de tickets

- 💳 **Control de Pagos**
  - Múltiples métodos de pago
  - Histórico de transacciones
  - Cierre de caja automático

</td>
<td width="50%">

### 🔒 Seguridad y Roles

- 🛡️ **Autenticación Robusta**
  - Supabase Auth con RLS
  - Roles y permisos granulares
  - Protección de rutas con middleware

- 📧 **Notificaciones**
  - Emails transaccionales (Resend)
  - Invitaciones a playeros
  - Confirmaciones de registro

</td>
</tr>
</table>

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnología          | Versión | Uso                               |
| ------------------- | ------- | --------------------------------- |
| **Next.js**         | 15.4.6  | Framework React con App Router    |
| **React**           | 19.1.1  | Biblioteca UI                     |
| **TypeScript**      | 5.9.2   | Tipado estático                   |
| **Tailwind CSS**    | 4.1.12  | Framework CSS utility-first       |
| **Radix UI**        | Latest  | Sistema de componentes accesibles |
| **React Hook Form** | 7.62    | Gestión de formularios            |
| **Zod**             | 4.0.17  | Validación de schemas             |
| **Lucide React**    | 0.539   | Iconos SVG                        |

### Backend & Base de Datos

| Tecnología             | Versión | Uso                               |
| ---------------------- | ------- | --------------------------------- |
| **Supabase**           | 2.76    | Backend-as-a-Service (PostgreSQL) |
| **PostgreSQL**         | 17      | Base de datos relacional          |
| **Row Level Security** | -       | Seguridad a nivel de fila         |
| **Supabase Auth**      | -       | Autenticación y autorización      |
| **Resend**             | 6.1.2   | Envío de emails transaccionales   |

### Integraciones

| Servicio                 | Uso                                   |
| ------------------------ | ------------------------------------- |
| **Google Maps API**      | Mapas interactivos y geolocalización  |
| **Google Places API**    | Autocompletado de direcciones         |
| **Google Geocoding API** | Conversión coordenadas ↔ direcciones |

### DevTools

| Herramienta     | Uso                |
| --------------- | ------------------ |
| **ESLint**      | Linting de código  |
| **Prettier**    | Formateo de código |
| **Husky**       | Git hooks          |
| **lint-staged** | Lint pre-commit    |
| **pnpm**        | Gestor de paquetes |
| **Vitest**      | Testing unitario   |

---

## 🚀 Instalación Rápida

### Prerrequisitos

```bash
node -v   # >=18.18.0
pnpm -v   # >=8.0.0
```

Si no tienes pnpm:

```bash
npm install -g pnpm
```

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/yourusername/valet.git
cd valet

# 2. Instalar dependencias
pnpm install

# 3. Copiar variables de entorno
cp .env.example .env.local

# 4. Configurar Supabase local
supabase start
# O usar el script automatizado:
pnpm db:setup

# 5. Ejecutar en desarrollo
pnpm dev
```

🎉 La app estará en **http://localhost:3000**

### ⚙️ Configuración de Variables de Entorno

Edita `.env.local` con las credenciales necesarias:

```env
# Supabase (solicitar al admin del proyecto)
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Google Maps (solicitar API key)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key
NEXT_PUBLIC_GOOGLE_MAPS_ID=tu_map_id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend (para emails)
RESEND_API_KEY=tu_resend_api_key
RESEND_FROM_EMAIL=njx <onboarding@tudominio.com>
```

> 📝 **Nota**: Contacta al administrador del proyecto para obtener las credenciales.

---

## 👤 Usuarios de Prueba

El sistema crea automáticamente usuarios para testing:

| Email              | Contraseña | Rol         | Permisos                                              |
| ------------------ | ---------- | ----------- | ----------------------------------------------------- |
| `dueno@test.com`   | `test1234` | **DUENO**   | Crear/editar playas, gestionar playeros, ver reportes |
| `playero@test.com` | `test1234` | **PLAYERO** | Registrar ocupaciones, cobrar, ver turnos             |

---

## 📜 Comandos Disponibles

### Desarrollo

```bash
pnpm dev          # Inicia servidor de desarrollo con Turbopack
pnpm build        # Build de producción
pnpm start        # Ejecuta build de producción
pnpm lint         # ESLint + fix automático
pnpm format       # Prettier (formatear)
pnpm typecheck    # Verificar tipos TypeScript
```

### Base de Datos

```bash
pnpm db:setup     # Setup inicial completo (migraciones + seeds)
pnpm db:reset     # Reset total + usuarios de prueba
pnpm db:migrate   # Aplicar migraciones pendientes
pnpm db:status    # Ver estado de migraciones
pnpm db:info      # Ver información del ambiente
pnpm db:seed      # Ejecutar seeds manualmente
```

### Testing

```bash
pnpm test         # Ejecutar tests con Vitest
pnpm test:ui      # UI interactiva de tests
pnpm test:run     # Ejecutar tests una vez (CI)
```

### Git Hooks

```bash
pnpm prepare      # Configurar Husky
```

Los hooks se ejecutan automáticamente:

- **Pre-commit**: ESLint + Prettier en archivos staged
- **Pre-push**: Verificación de tipos

---

## 🏗️ Estructura del Proyecto

```
valet/
├── src/
│   ├── app/                    # Next.js App Router (rutas)
│   │   ├── admin/              # Panel administrativo
│   │   │   ├── playas/         # CRUD de playas
│   │   │   ├── playeros/       # Gestión de empleados
│   │   │   ├── plazas/         # Gestión de espacios
│   │   │   ├── tarifas/        # Configuración de precios
│   │   │   └── ocupaciones/    # Registro de uso
│   │   ├── auth/               # Login, Signup, Confirmación
│   │   ├── api/                # API Routes (REST endpoints)
│   │   └── mapa/               # Vista pública del mapa
│   │
│   ├── components/             # Componentes reutilizables
│   │   ├── ui/                 # Sistema de diseño base
│   │   ├── layout/             # Header, Sidebar, Breadcrumb
│   │   ├── admin/              # Componentes específicos de admin
│   │   └── providers/          # Context providers
│   │
│   ├── lib/                    # Configuraciones y utilidades
│   │   ├── supabase/           # Cliente Supabase (SSR + Client)
│   │   ├── resend/             # Configuración de emails
│   │   └── utils.ts            # cn(), formatters, etc.
│   │
│   ├── services/               # Lógica de negocio
│   │   ├── playas/             # CRUD playas
│   │   ├── playeros/           # Gestión playeros
│   │   ├── plazas/             # CRUD plazas
│   │   ├── tarifas/            # Cálculo de precios
│   │   ├── ocupaciones/        # Registro de entradas/salidas
│   │   └── google/             # Google Maps API
│   │
│   ├── schemas/                # Zod schemas (validación)
│   ├── types/                  # Definiciones TypeScript
│   ├── hooks/                  # Custom React hooks
│   ├── contexts/               # React Contexts
│   ├── stores/                 # Zustand stores
│   └── utils/                  # Funciones utilitarias
│
├── supabase/
│   ├── migrations/             # 91+ migraciones SQL
│   ├── config.toml             # Configuración Supabase local
│   └── schema_reference.sql   # Schema completo (referencia)
│
├── scripts/                    # Scripts de automatización
│   ├── seeds/                  # Datos de prueba
│   │   ├── base/               # Datos base (características)
│   │   └── dev/                # Datos de desarrollo
│   ├── db-reset.ts             # Reset de DB
│   ├── db-seed.ts              # Seed de datos
│   └── *.sh                    # Scripts Bash
│
├── docs/                       # Documentación detallada
│   ├── ARCHITECTURE.md         # Arquitectura del proyecto
│   ├── CODE_CONVENTIONS.md    # Convenciones de código
│   ├── DATABASE.md             # Estructura de BD
│   ├── DEPLOYMENT.md           # Guía de deployment
│   ├── DEVELOPMENT.md          # Testing y debugging
│   ├── QUICK_START.md          # Setup inicial
│   └── WORKFLOW.md             # Git flow y contribución
│
└── public/                     # Assets estáticos
```

---

## 🗄️ Arquitectura de Base de Datos

### Tablas Principales

```sql
-- Usuarios y Autenticación
usuario (usuario_id, email, nombre, telefono)
rol_usuario (usuario_id, rol) -- DUENO, PLAYERO

-- Gestión de Playas
playa (playa_id, nombre, direccion, latitud, longitud, horario)
playero_playa (playero_id, playa_id, estado) -- Relación many-to-many

-- Configuración de Playa
tipo_plaza (tipo_plaza_id, playa_id, nombre, descripcion)
plaza (plaza_id, playa_id, tipo_plaza_id, identificador)
tarifa (playa_id, tipo_plaza_id, modalidad_ocupacion, tipo_vehiculo, precio)

-- Ocupaciones y Pagos
ocupacion (ocupacion_id, plaza_id, patente, fecha_entrada, fecha_salida)
pago (pago_id, ocupacion_id, monto, metodo_pago)
turno (turno_id, playero_id, playa_id, fecha_inicio, fecha_fin)
```

### Características de Seguridad

- ✅ **Row Level Security (RLS)** en todas las tablas
- ✅ **Políticas granulares** por rol (DUENO, PLAYERO)
- ✅ **Triggers automáticos** para validaciones
- ✅ **Funciones PL/pgSQL** para lógica compleja
- ✅ **Índices optimizados** para consultas rápidas

---

## 🎨 Sistema de Diseño

### Componentes UI Base

Todos los componentes están construidos sobre **Radix UI** para máxima accesibilidad:

```tsx
// Ejemplo de uso
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
;<Button variant="default" size="lg">
  Guardar Cambios
</Button>
```

### Variantes Disponibles

| Componente | Variantes                                             |
| ---------- | ----------------------------------------------------- |
| **Button** | default, destructive, outline, secondary, ghost, link |
| **Badge**  | default, secondary, destructive, outline              |
| **Alert**  | default, destructive                                  |
| **Input**  | default, error, success                               |

### Temas

- 🌞 **Modo Claro** (por defecto)
- 🌙 **Modo Oscuro** (con next-themes)
- 🎨 **Personalización** vía CSS variables

---

## 🔐 Autenticación y Autorización

### Flujos Implementados

#### 1. Registro de Dueño

```
Signup → Confirmar Email → Login → Dashboard Admin
```

#### 2. Invitación de Playero

```
Dueño crea invitación → Playero recibe email →
Acepta invitación → Completa registro → Login
```

#### 3. Protección de Rutas

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Verifica autenticación en rutas /admin/*
  // Verifica rol del usuario
  // Redirige si no está autorizado
}
```

### Roles y Permisos

| Rol         | Permisos                                                                |
| ----------- | ----------------------------------------------------------------------- |
| **DUENO**   | CRUD playas, Gestión playeros, Ver reportes, Configurar tarifas         |
| **PLAYERO** | Ver playas asignadas, Registrar ocupaciones, Cobrar pagos, Cerrar turno |

---

## 🚀 Deployment

### Vercel (Recomendado)

#### Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Para migraciones automáticas
SUPABASE_ACCESS_TOKEN=
SUPABASE_DB_PASSWORD=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_ID=

# App
NEXT_PUBLIC_APP_URL=https://tudominio.com

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

#### Configuración de Build

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "nodeVersion": "18.x"
}
```

> 💡 **Migraciones Automáticas**: Las migraciones se ejecutan automáticamente durante el build de producción gracias al script `prebuild` en `package.json`.

### Otros Proveedores

- **Railway**: Compatible con configuración Docker
- **AWS Amplify**: Requiere configuración adicional
- **Render**: Compatible con `pnpm build`

---

## 🧪 Testing

### Estrategia de Testing

```bash
# Unit tests con Vitest
pnpm test

# UI interactiva
pnpm test:ui

# Coverage report
pnpm test:coverage
```

### Ejemplo de Test

```typescript
// services/playas/create.test.ts
import { describe, it, expect } from 'vitest'
import { createPlaya } from './create'

describe('createPlaya', () => {
  it('debe crear una playa válida', async () => {
    const playa = await createPlaya({
      nombre: 'Test Playa',
      direccion: 'Calle Test 123',
      latitud: -31.4201,
      longitud: -64.1888
    })

    expect(playa).toBeDefined()
    expect(playa.nombre).toBe('Test Playa')
  })
})
```

---

## 🤝 Cómo Contribuir

### 1. Fork y Clonar

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/tu-usuario/valet.git
cd valet
```

### 2. Crear Rama Feature

```bash
git checkout -b feature/nueva-caracteristica
```

### 3. Hacer Cambios

- ✅ Seguir [Code Conventions](docs/CODE_CONVENTIONS.md)
- ✅ Escribir tests para nuevas features
- ✅ Actualizar documentación si es necesario

### 4. Commit con Conventional Commits

```bash
git commit -m "feat: agregar filtro de búsqueda por ciudad"
git commit -m "fix: corregir cálculo de tarifa nocturna"
git commit -m "docs: actualizar README con sección de deployment"
```

Tipos válidos:

- `feat`: Nueva característica
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato, no afecta el código
- `refactor`: Refactorización
- `test`: Agregar/modificar tests
- `chore`: Tareas de mantenimiento

### 5. Push y Pull Request

```bash
git push origin feature/nueva-caracteristica
```

Luego abre un Pull Request en GitHub con:

- ✅ Descripción clara del cambio
- ✅ Screenshots (si aplica)
- ✅ Referencia a issues relacionados

---

## 📚 Documentación Completa

| Documento                                        | Descripción                                  |
| ------------------------------------------------ | -------------------------------------------- |
| [**Arquitectura**](docs/ARCHITECTURE.md)         | Patrones de diseño y estructura del proyecto |
| [**Code Conventions**](docs/CODE_CONVENTIONS.md) | Estándares de código y nomenclatura          |
| [**Base de Datos**](docs/DATABASE.md)            | Schema, migraciones y RLS                    |
| [**Deployment**](docs/DEPLOYMENT.md)             | Guía de producción y CI/CD                   |
| [**Development**](docs/DEVELOPMENT.md)           | Testing, debugging y herramientas            |
| [**Quick Start**](docs/QUICK_START.md)           | Setup inicial para nuevos devs               |
| [**Workflow**](docs/WORKFLOW.md)                 | Git flow y proceso de contribución           |

---

## 🐛 Reporte de Bugs

¿Encontraste un bug? Por favor:

1. ✅ Revisa los [Issues existentes](https://github.com/yourusername/valet/issues)
2. ✅ Si no existe, [crea un nuevo Issue](https://github.com/yourusername/valet/issues/new)
3. ✅ Incluye:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots/videos si aplica
   - Entorno (OS, navegador, versión de Node)

---

## 💬 Comunidad y Soporte

- 💼 **LinkedIn**: [Tu Perfil](https://linkedin.com/in/tu-perfil)
- 📧 **Email**: tu-email@example.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/valet/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/yourusername/valet/discussions)

---

## 📋 Roadmap

### ✅ Versión 1.0 (Actual)

- [x] Autenticación con roles
- [x] CRUD de playas, plazas y tarifas
- [x] Gestión de playeros
- [x] Registro de ocupaciones
- [x] Integración Google Maps
- [x] Envío de emails

### 🚧 Versión 1.1 (En Progreso)

- [ ] Dashboard con métricas en tiempo real
- [ ] Reportes exportables (PDF/Excel)
- [ ] Notificaciones push
- [ ] App móvil (React Native)

### 🔮 Versión 2.0 (Futuro)

- [ ] Sistema de reservas
- [ ] Pagos online
- [ ] API pública para integraciones
- [ ] Gamificación y puntos

---

## 📊 Estadísticas del Proyecto

![GitHub stars](https://img.shields.io/github/stars/yourusername/valet?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/valet?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/valet?style=social)

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2025 njx Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 🙏 Agradecimientos

- **Next.js Team** por el increíble framework
- **Supabase** por el backend-as-a-service
- **Radix UI** por los componentes accesibles
- **Tailwind CSS** por el framework CSS
- **Vercel** por el hosting y deployment

---

<div align="center">

### Desarrollado con ❤️ para la UTN - Universidad Tecnológica Nacional

**[⬆ Volver arriba](#-njx)**

</div>
