# 🚀 Guía de Inicio Rápido

## ¿Qué es Valet?

**Valet** es una plataforma integral que revoluciona la gestión de estacionamientos urbanos, conectando conductores que buscan donde estacionar con dueños que quieren optimizar la rentabilidad de sus playas.

## 🎯 Características Principales

### Para Conductores
- 🗺️ **Búsqueda de playas cercanas** con geolocalización automática
- 📍 **Mapa interactivo** con ubicaciones en tiempo real
- 🔍 **Búsqueda por dirección** usando Google Places API
- ⏰ **Información de horarios** y disponibilidad

### Para Dueños de Playas
- 🏢 **Panel de administración** completo para gestionar playas
- 📝 **Registro de nuevas playas** con validación automática de direcciones
- 💰 **Optimización de tarifas** según demanda y horarios pico
- 📊 **Análisis y métricas** de ocupación y rentabilidad
- 🛡️ **Gestión de usuarios** y permisos administrativos

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 con App Router
- **Frontend**: React 19 con TypeScript
- **Estilos**: Tailwind CSS 4 + Radix UI
- **Base de datos**: Supabase con autenticación integrada
- **Mapas**: Google Maps API con Places API
- **Emails**: Resend para notificaciones
- **Formularios**: React Hook Form + Zod
- **UI**: Sistema de componentes personalizado basado en Radix UI
- **Temas**: next-themes con soporte para modo oscuro

## ⚙️ Setup Inicial

### 1. Requisitos del Sistema

- **Node.js**: Versión 18.18 o superior (recomendado: LTS más reciente)
- **pnpm**: Versión 8.0 o superior
  ```bash
  npm install -g pnpm
  ```

### 2. Clonar y Configurar

```bash
# Clonar el repositorio
git clone <repository-url>
cd valet

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
```

### 3. Variables de Entorno

**IMPORTANTE**: Solicita al administrador del proyecto las credenciales necesarias.

Edita `.env.local` con las credenciales proporcionadas:

```env
# Supabase Configuration (solicitar al admin)
NEXT_PUBLIC_SUPABASE_URL=valor_proporcionado_por_admin
NEXT_PUBLIC_SUPABASE_ANON_KEY=valor_proporcionado_por_admin
SUPABASE_SERVICE_ROLE_KEY=valor_proporcionado_por_admin

# Google Maps Configuration (solicitar al admin)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=valor_proporcionado_por_admin

# App URL (para links en emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend Configuration (para envío de emails)
RESEND_API_KEY=re_tu_api_key_de_resend
RESEND_FROM_EMAIL=Valet <onboarding@tudominio.com>
```

### 4. Configurar Base de Datos

```bash
# Setup inicial de Supabase local (solo primera vez)
supabase start

# O usa el script automatizado:
pnpm db:setup
```

Este comando:
- 🔄 Aplica todas las migraciones (91 archivos)
- ✅ Configura RLS, triggers y funciones
- 📊 Inserta datos de prueba

### 5. Usuarios de Prueba

El sistema crea automáticamente usuarios para testing:

| Email              | Contraseña | Rol                     |
| ------------------ | ---------- | ----------------------- |
| `dueno@test.com`   | `test1234` | DUENO (Dueño de playas) |
| `playero@test.com` | `test1234` | PLAYERO (Empleado)      |

### 6. Ejecutar en Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📜 Comandos Esenciales

```bash
# Desarrollo
pnpm dev                 # Inicia el servidor de desarrollo

# Calidad de código
pnpm lint               # Ejecuta ESLint
pnpm format             # Formatea el código con Prettier
pnpm typecheck          # Verifica tipos TypeScript

# Base de datos
pnpm db:info            # Ver información del ambiente
pnpm db:setup           # Setup inicial completo
pnpm db:reset           # Reset completo + usuarios de prueba
pnpm db:migrate         # Aplicar migraciones
pnpm db:status          # Ver estado de migraciones

# Build y deploy
pnpm build              # Construir para producción
pnpm start              # Ejecutar build de producción
```

## 🏗️ Estructura del Proyecto

```
src/
├── app/                      # App Router de Next.js
│   ├── admin/               # Panel de administración
│   ├── auth/               # Autenticación (login/signup)
│   └── api/                # API routes
├── components/             # Componentes reutilizables
│   ├── ui/                # Sistema de componentes base
│   ├── layout/            # Componentes de layout
│   └── providers/         # Providers de contexto
├── lib/                   # Configuraciones y utilidades
│   └── supabase/         # Cliente de Supabase
├── services/              # Servicios de negocio
├── schemas/              # Validaciones Zod
├── types/                # Definiciones TypeScript
└── utils/                # Funciones utilitarias
```

## 🔒 Autenticación

La aplicación utiliza Supabase Auth con:
- **Registro de usuarios** con email, contraseña, nombre y CUIL
- **Login/Logout** con manejo de sesiones
- **Middleware de autenticación** que protege rutas administrativas
- **Roles de usuario** (conductores y dueños de playas)

## 🗺️ Integración con Google Maps

### Funcionalidades implementadas:
- **Autocompletado de direcciones** para registro de playas
- **Validación automática** de coordenadas geográficas
- **Mini mapas** para visualización de ubicaciones
- **Geolocalización** del usuario para búsqueda de playas cercanas

### APIs utilizadas:
- **Places API**: Autocompletado y detalles de lugares
- **Geocoding API**: Conversión entre direcciones y coordenadas
- **Maps JavaScript API**: Renderizado de mapas interactivos

## 🚀 Próximos Pasos

1. **Explora la aplicación**: Inicia sesión con los usuarios de prueba
2. **Lee la documentación**: Consulta los archivos en `docs/`
3. **Familiarízate con el código**: Revisa la estructura en `src/`
4. **Contribuye**: Sigue las [Convenciones de Código](./CODE_CONVENTIONS.md)

## 🆘 Soporte

Si encuentras algún problema:

1. Revisa los [Issues existentes](../../issues)
2. Consulta la [documentación de troubleshooting](./DEVELOPMENT.md)
3. Crea un nuevo Issue con detalles del problema
4. Incluye información del entorno (OS, Node.js version, etc.)

## 🔗 Enlaces Útiles

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Google Maps Platform](https://developers.google.com/maps)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

Desarrollado con ❤️ para la UTN - Universidad Tecnológica Nacional
