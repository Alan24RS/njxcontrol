# 🏗️ Arquitectura del Proyecto

## 📁 Estructura de Carpetas

```
valet/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Panel de administración
│   │   │   ├── playas/        # Gestión de playas
│   │   │   ├── playeros/      # Gestión de playeros
│   │   │   ├── plazas/        # Gestión de plazas
│   │   │   ├── tarifas/       # Gestión de tarifas
│   │   │   └── componentes/   # Componentes específicos de admin
│   │   ├── auth/              # Autenticación
│   │   │   ├── login/         # Página de login
│   │   │   ├── signup/        # Registro de usuarios
│   │   │   ├── signup-playero/ # Registro de playeros
│   │   │   └── complete-registration/ # Completar registro
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Endpoints de autenticación
│   │   │   ├── playas/        # Endpoints de playas
│   │   │   └── revalidate/    # Revalidación de cache
│   │   └── mapa/              # Página del mapa
│   ├── components/            # Componentes reutilizables
│   │   ├── ui/               # Sistema de componentes base
│   │   ├── layout/           # Componentes de layout
│   │   ├── auth/             # Componentes de autenticación
│   │   └── admin/            # Componentes de administración
│   ├── lib/                  # Configuraciones y utilidades
│   │   ├── supabase/         # Cliente de Supabase
│   │   ├── resend/           # Configuración de emails
│   │   └── utils.ts          # Utilidades generales
│   ├── services/             # Servicios de negocio
│   │   ├── playas/           # Gestión de playas
│   │   ├── playeros/          # Gestión de playeros
│   │   ├── plazas/           # Gestión de plazas
│   │   ├── tarifas/          # Gestión de tarifas
│   │   └── google/           # Integración con Google Maps
│   ├── schemas/              # Validaciones Zod
│   ├── types/                # Definiciones TypeScript
│   ├── hooks/                # Custom hooks
│   ├── contexts/             # Context providers
│   ├── stores/               # Estado global
│   └── utils/                # Funciones utilitarias
├── supabase/
│   ├── migrations/           # Migraciones de base de datos
│   ├── config.toml          # Configuración de Supabase
│   └── schema_reference.sql # Schema completo para referencia
└── scripts/                  # Scripts de automatización
    ├── seeds/               # Datos de seed
    └── *.sh                 # Scripts de base de datos
```

## 🎯 Patrones de Diseño

### 1. App Router de Next.js

El proyecto utiliza el nuevo App Router de Next.js 15 con las siguientes convenciones:

- **Server Components por defecto**: Solo se convierten a Client Components cuando es necesario
- **Directiva `'use client'`**: Solo cuando se requiere interactividad
- **API Routes**: Para endpoints de backend
- **Middleware**: Para autenticación y protección de rutas

### 2. Arquitectura de Componentes

```
Componentes/
├── UI Base (Radix UI + Tailwind)
│   ├── Button, Input, Modal, etc.
│   └── Sistema de temas (claro/oscuro)
├── Layout Components
│   ├── Header, Sidebar, Breadcrumb
│   └── PageContainer, PlayaSelector
├── Feature Components
│   ├── Auth (Login, Signup, etc.)
│   ├── Admin (Gestión de entidades)
│   └── Map (Integración con Google Maps)
└── Business Components
    ├── Playas, Playeros, Plazas
    └── Tarifas, Métodos de pago
```

### 3. Gestión de Estado

- **React Hook Form**: Para formularios con validación Zod
- **Context API**: Para estado global (tema, playa seleccionada)
- **Supabase**: Para estado del servidor y cache
- **React Query**: Para cache de datos del servidor

### 4. Servicios de Negocio

Cada entidad principal tiene su propio servicio:

```
services/
├── playas/
│   ├── create.ts          # Crear playa
│   ├── update.ts          # Actualizar playa
│   ├── delete.ts          # Eliminar playa
│   ├── get.ts             # Obtener playas
│   └── types.ts           # Tipos específicos
├── playeros/
│   ├── create.ts
│   ├── invite.ts          # Invitar playero
│   ├── validate.ts        # Validar playero
│   └── types.ts
└── google/
    ├── places.ts          # Google Places API
    ├── geocoding.ts       # Google Geocoding API
    └── maps.ts            # Google Maps API
```

## 🗄️ Base de Datos

### Estructura Principal

```
Tablas Principales:
├── usuario                 # Usuarios del sistema
├── playa                  # Playas de estacionamiento
├── playero                # Empleados de playas
├── plaza                  # Plazas individuales
├── tarifa                 # Tarifas de estacionamiento
├── tipo_plaza            # Tipos de plaza (Estándar, Premium, etc.)
├── tipo_vehiculo         # Tipos de vehículo (Auto, Moto, etc.)
├── metodo_pago           # Métodos de pago
└── modalidad_ocupacion   # Modalidades (Diaria, Por hora, etc.)
```

### Características de la Base de Datos

- **Row Level Security (RLS)**: Habilitado en todas las tablas
- **Políticas de seguridad**: Basadas en roles y ownership
- **Triggers**: Para auditoría y lógica de negocio
- **Funciones**: Para operaciones complejas
- **Migraciones versionadas**: 91 migraciones sincronizadas

## 🔧 Configuración y Variables de Entorno

### Variables Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Resend (Emails)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# App
NEXT_PUBLIC_APP_URL=
```

### Configuración por Ambiente

- **Desarrollo**: Docker local con Supabase CLI
- **Staging**: Supabase Cloud con datos de prueba
- **Producción**: Supabase Cloud con datos reales

## 🎨 Sistema de Diseño

### Componentes Base

Basado en Radix UI con Tailwind CSS:

```typescript
// Ejemplo de componente base
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"

// Uso consistente
<Button variant="primary" size="md">
  Crear Playa
</Button>
```

### Temas

- **Modo claro**: Colores por defecto
- **Modo oscuro**: Implementado con next-themes
- **Consistencia**: Variables CSS personalizadas

## 🔐 Seguridad

### Autenticación

- **Supabase Auth**: Manejo completo de autenticación
- **JWT Tokens**: Para sesiones seguras
- **Middleware**: Protección de rutas administrativas

### Autorización

- **Roles**: DUENO, PLAYERO, ADMIN
- **RLS Policies**: Control de acceso a nivel de fila
- **Ownership**: Usuarios solo ven sus propios datos

### Validación

- **Zod Schemas**: Validación de formularios
- **TypeScript**: Tipado estático
- **Sanitización**: Limpieza de inputs

## 🚀 Performance

### Optimizaciones

- **Server Components**: Por defecto para mejor performance
- **Code Splitting**: Automático con Next.js
- **Image Optimization**: Next.js Image component
- **Caching**: React Query para datos del servidor

### Monitoreo

- **Build Analytics**: Vercel Analytics
- **Error Tracking**: Integración con servicios de monitoreo
- **Performance**: Core Web Vitals

## 🔄 Integraciones

### Google Maps Platform

- **Places API**: Autocompletado de direcciones
- **Geocoding API**: Conversión de direcciones a coordenadas
- **Maps JavaScript API**: Mapas interactivos

### Resend

- **Email Templates**: HTML personalizado
- **Invitaciones**: Para playeros
- **Notificaciones**: Sistema de alertas

### Supabase

- **Database**: PostgreSQL con extensiones
- **Auth**: Sistema completo de autenticación
- **Storage**: Para archivos (futuro)
- **Realtime**: Para actualizaciones en tiempo real (futuro)

## 📱 Responsive Design

### Breakpoints

```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Componentes Adaptativos

- **Mobile-first**: Diseño desde móvil hacia desktop
- **Touch-friendly**: Botones y elementos táctiles
- **Navigation**: Sidebar colapsable en móvil

## 🧪 Testing

### Estrategia de Testing

- **Unit Tests**: Funciones utilitarias
- **Integration Tests**: Servicios de negocio
- **E2E Tests**: Flujos completos de usuario
- **Visual Tests**: Componentes UI

### Herramientas

- **Vitest**: Framework de testing
- **Testing Library**: Para componentes React
- **Playwright**: Para E2E testing

## 📚 Documentación

### Código

- **JSDoc**: Documentación en funciones
- **TypeScript**: Tipos como documentación
- **README**: En cada carpeta importante

### API

- **OpenAPI**: Especificación de endpoints
- **Ejemplos**: Casos de uso comunes
- **Error Codes**: Códigos de error documentados

---

Esta arquitectura está diseñada para ser escalable, mantenible y fácil de entender tanto para desarrolladores humanos como para agentes de IA.
