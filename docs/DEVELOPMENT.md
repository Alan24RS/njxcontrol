# 🧪 Testing y Desarrollo

## 👥 Usuarios de Prueba

### Usuarios Disponibles

Después de ejecutar `pnpm db:reset`, tendrás automáticamente estos usuarios creados:

| Email              | Contraseña | Rol     | Permisos                                                     |
| ------------------ | ---------- | ------- | ------------------------------------------------------------ |
| `dueno@test.com`   | `test1234` | DUENO   | Crear/gestionar playas, invitar playeros, configurar tarifas |
| `playero@test.com` | `test1234` | PLAYERO | Gestionar plazas asignadas, ver historial                    |

### Playa de Prueba

El sistema crea automáticamente una playa completa con todas sus configuraciones:

**🏖️ UTN-Parking** (Resistencia, Chaco)

- **Dueño**: Oscar Gómez (dueno@test.com)
- **Dirección**: Avenida Laprida 405, Resistencia, Chaco
- **Horario**: 15:00 - 18:00
- **Estado**: ACTIVO

#### Configuraciones Incluidas

**Métodos de Pago:**
- ✅ Efectivo
- ✅ Mercado Pago

**Tipos de Vehículo:**
- 🏍️ Motocicleta
- 🚗 Automóvil

**Tipos de Plaza:**
1. **Estándar** (4 plazas: A1, A2, A3, A4)
   - Tarifa diaria para automóvil: $5,000
   
2. **Eléctricos** (2 plazas: E1, E2)
   - Tarifa diaria para automóvil: $10,000
   
3. **Premium** (1 plaza: P1)
   - Tarifa por hora para automóvil: $1,220
   - Tarifa diaria para automóvil: $1,233

**Playeros Asignados:**
- ✅ **Juan Romero** (playero@test.com) - Estado: ACTIVO
  - Ya validado y con acceso completo a la playa
  - No requiere validación por email

### Total de Recursos Creados

- 🏖️ 1 Playa completa
- 👤 2 Usuarios (1 dueño + 1 playero)
- 💳 2 Métodos de pago
- 🚗 2 Tipos de vehículo
- 📦 3 Tipos de plaza
- 🅿️ 7 Plazas individuales
- 💰 4 Tarifas configuradas
- 🔗 1 Conexión playero-playa validada

## 🔄 Comandos de Desarrollo

### Setup Inicial

```bash
# Primera vez
pnpm db:info        # Ver información del ambiente
pnpm db:setup       # Setup completo (migraciones + seeds)
pnpm dev            # Iniciar servidor de desarrollo
```

### Durante el Desarrollo

```bash
# Si necesitas resetear la base de datos
pnpm db:reset

# Si solo necesitas recrear usuarios
pnpm db:seed:dev

# Aplicar nuevas migraciones
pnpm db:migrate

# Ver estado de la base de datos
pnpm db:status
```

### Calidad de Código

```bash
# Verificar código
pnpm lint

# Formatear código
pnpm format

# Verificar tipos
pnpm typecheck

# Todo en uno
pnpm lint && pnpm format:check && pnpm typecheck
```

## 🐛 Debugging

### Herramientas de Desarrollo

#### React Developer Tools
- Instalar extensión del navegador
- Inspeccionar componentes y estado
- Ver props y hooks

#### Supabase Dashboard
- Acceder a la consola de Supabase
- Ver datos en tiempo real
- Ejecutar consultas SQL
- Monitorear autenticación

#### Network Tab
- Inspeccionar requests a la API
- Ver headers y respuestas
- Debuggear errores de red

### Logs Útiles

#### Console del Navegador
```javascript
// Verificar autenticación
console.log('User:', await supabase.auth.getUser())

// Verificar datos
console.log('Playas:', await supabase.from('playa').select('*'))
```

#### Terminal del Servidor
```bash
# Ver logs de Next.js
pnpm dev

# Ver logs de Supabase
supabase logs
```

### Problemas Comunes

#### "Error: supabaseUrl is required"

❌ Verifica que tu archivo `.env.local` tenga las variables correctas:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

#### "Error: A user with this email address has already been registered"

✅ **Normal**: Los usuarios ya existen. Usa `pnpm db:reset` para empezar de cero.

#### "sh: tsx: command not found"

❌ Instala las dependencias: `pnpm install`

#### "Error: supabase command not found"

❌ Instala Supabase CLI: `npm install -g supabase`

#### "Error: Database connection failed"

❌ Verifica que Supabase esté corriendo:
```bash
supabase status
# Si no está corriendo:
supabase start
```

## 🧪 Testing

### Testing Manual

#### Flujo de Usuario Dueño

1. **Iniciar sesión** con `dueno@test.com` / `test1234`
2. **Ver playas** en el panel de administración
3. **Crear nueva playa** con dirección válida
4. **Configurar tarifas** para diferentes tipos de plaza
5. **Invitar playero** con email válido
6. **Verificar** que el playero reciba el email

#### Flujo de Usuario Playero

1. **Iniciar sesión** con `playero@test.com` / `test1234`
2. **Ver playas asignadas** en el dashboard
3. **Gestionar plazas** (cambiar estado, ver historial)
4. **Verificar permisos** (no puede crear playas)

#### Flujo de Mapa

1. **Acceder al mapa** en `/mapa`
2. **Ver playas** marcadas en el mapa
3. **Hacer clic** en una playa para ver detalles
4. **Verificar** información de horarios y tarifas

### Testing de API

#### Endpoints de Autenticación

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dueno@test.com","password":"test1234"}'

# Logout
curl -X POST http://localhost:3000/api/auth/logout
```

#### Endpoints de Playas

```bash
# Obtener playas
curl -X GET http://localhost:3000/api/playas \
  -H "Authorization: Bearer <token>"

# Crear playa
curl -X POST http://localhost:3000/api/playas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"nombre":"Mi Playa","direccion":"Calle 123"}'
```

### Testing de Base de Datos

#### Consultas Útiles

```sql
-- Ver todos los usuarios
SELECT * FROM usuario;

-- Ver playas con sus dueños
SELECT p.nombre, u.nombre as dueno
FROM playa p
JOIN usuario u ON p.dueno_id = u.usuario_id;

-- Ver playeros asignados a playas
SELECT pp.*, p.nombre as playa, u.nombre as playero
FROM playero_playa pp
JOIN playa p ON pp.playa_id = p.playa_id
JOIN playero pl ON pp.playero_id = pl.playero_id
JOIN usuario u ON pl.usuario_id = u.usuario_id;
```

#### Verificar RLS

```sql
-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

## 🔧 Configuración de Ambiente

### Variables de Entorno

#### Desarrollo Local

```env
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google-maps-key>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend (opcional para desarrollo)
RESEND_API_KEY=<resend-key>
RESEND_FROM_EMAIL=Valet <onboarding@tudominio.com>
```

#### Staging/Producción

```env
# Supabase Cloud
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<prod-service-role-key>
SUPABASE_DB_PASSWORD=<db-password>

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google-maps-key>

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Resend
RESEND_API_KEY=<resend-key>
RESEND_FROM_EMAIL=Valet <onboarding@tudominio.com>
```

### Configuración de Node.js

El proyecto requiere **Node.js v20.6.0+** para soportar el flag `--env-file` nativo.

```bash
# Verificar versión
node --version

# Si tienes nvm instalado
nvm use
```

## 🚀 Performance

### Optimizaciones de Desarrollo

#### Hot Reload

```bash
# Desarrollo con Turbopack (más rápido)
pnpm dev

# Desarrollo normal
pnpm dev --turbo
```

#### Bundle Analysis

```bash
# Analizar bundle
pnpm build
npx @next/bundle-analyzer
```

#### Memory Usage

```bash
# Ver uso de memoria
node --inspect pnpm dev
```

### Monitoreo

#### Core Web Vitals

```bash
# Ver métricas de performance
pnpm build
pnpm start
# Abrir DevTools > Lighthouse
```

#### Database Performance

```sql
-- Ver queries lentas
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 🛠️ Herramientas de Desarrollo

### Extensiones de VS Code Recomendadas

- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **TypeScript Importer**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**
- **GitLens**
- **Thunder Client** (para testing de API)

### Configuración de VS Code

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html"
  }
}
```

### Scripts Útiles

```bash
# Limpiar cache
rm -rf .next node_modules
pnpm install

# Reinstalar dependencias
pnpm install --frozen-lockfile

# Verificar tipos sin compilar
npx tsc --noEmit

# Verificar linting
pnpm lint --fix
```

## 📱 Testing en Dispositivos

### Responsive Design

```bash
# Abrir en diferentes tamaños
# Chrome DevTools > Toggle device toolbar
# iPhone SE (375x667)
# iPad (768x1024)
# Desktop (1920x1080)
```

### Testing en Móvil Real

```bash
# Usar ngrok para testing en móvil
npx ngrok http 3000

# Compartir URL con el equipo
# https://abc123.ngrok.io
```

## 🔍 Troubleshooting Avanzado

### Problemas de Base de Datos

#### "Migration failed"

```bash
# Ver estado de migraciones
supabase migration list

# Resetear migraciones
supabase db reset

# Aplicar migraciones específicas
supabase db push --include-all
```

#### "RLS policy error"

```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'playa';

-- Deshabilitar RLS temporalmente para debugging
ALTER TABLE playa DISABLE ROW LEVEL SECURITY;
```

### Problemas de Autenticación

#### "Invalid JWT token"

```bash
# Verificar variables de entorno
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Limpiar localStorage
localStorage.clear()
```

#### "User not found"

```sql
-- Verificar usuario en la base de datos
SELECT * FROM usuario WHERE email = 'dueno@test.com';

-- Verificar en auth.users
SELECT * FROM auth.users WHERE email = 'dueno@test.com';
```

### Problemas de Google Maps

#### "Google Maps API error"

```bash
# Verificar API key
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Resistencia&key=YOUR_API_KEY"

# Verificar dominios autorizados en Google Cloud Console
```

## 📚 Recursos Adicionales

### Documentación

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Comunidad

- [Next.js Discord](https://discord.gg/nextjs)
- [Supabase Discord](https://discord.supabase.com)
- [React Hook Form Discord](https://discord.gg/react-hook-form)

---

Esta guía te ayudará a desarrollar y debuggear eficientemente en el proyecto Valet.
