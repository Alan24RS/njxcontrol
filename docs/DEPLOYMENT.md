# 🚀 Deployment

## 🌐 Ambientes

### Desarrollo Local
- **URL**: http://localhost:3000
- **Base de datos**: Docker local con Supabase CLI
- **Variables**: `.env.local`

### Staging
- **URL**: https://valet-staging.vercel.app
- **Base de datos**: Supabase Cloud (staging)
- **Variables**: Vercel Environment Variables

### Producción
- **URL**: https://valet.vercel.app
- **Base de datos**: Supabase Cloud (producción)
- **Variables**: Vercel Environment Variables

## ⚙️ Configuración de Vercel

### Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyB...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Valet <onboarding@tudominio.com>

# App
NEXT_PUBLIC_APP_URL=https://valet.vercel.app

# Para migraciones automáticas
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_DB_PASSWORD=your-db-password
```

### Configuración de Dominio

1. **Configurar dominio personalizado** en Vercel
2. **Actualizar variables de entorno** con la nueva URL
3. **Configurar DNS** para apuntar al dominio

## 🔄 Migraciones Automáticas

### Flujo de Deploy

```
1. git push origin main
2. Vercel detecta NODE_ENV=production
3. pnpm build
   ├─ pnpm lint ✓
   ├─ pnpm typecheck ✓
   └─ conditional-migrate.sh
       ├─ Detecta NODE_ENV=production
       ├─ migrate-production.sh
       │   ├─ Link a Supabase remoto
       │   └─ supabase db push --include-all
       └─ Aplica SOLO migraciones NUEVAS
4. next build
5. Deploy exitoso
```

### Script de Migración

```bash
#!/bin/bash
# conditional-migrate.sh

if [ "$NODE_ENV" = "production" ]; then
  echo "🚀 Production detected, running migrations..."
  bash scripts/migrate-production.sh
else
  echo "🔧 Development detected, skipping migrations"
fi
```

### Variables para Migraciones

```env
# Requeridas para migraciones automáticas
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_DB_PASSWORD=your-db-password
```

## 🚀 Preview Deployments

### Sistema Inteligente

El sistema detecta automáticamente si un PR incluye cambios en la base de datos:

#### PR sin Migraciones
1. **Se abre un PR** → Se ejecuta el workflow
2. **Se detecta:** No hay cambios en DB
3. **Se hace deploy** → Solo frontend (rápido)
4. **Se comenta:** Link de preview + "No database changes"
5. **Resultado:** Preview lista en ~2 minutos

#### PR con Migraciones
1. **Se abre un PR** → Se ejecuta el workflow
2. **Se detecta:** Hay archivos de migración nuevos
3. **Se aplican migraciones** → De forma segura
4. **Se hace deploy** → Frontend + DB actualizada
5. **Se comenta:** Link + detalles de migraciones
6. **Resultado:** Preview lista en ~5 minutos

### Configuración de GitHub Actions

#### Secrets Requeridos

```bash
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
SUPABASE_ACCESS_TOKEN=your-supabase-token
SUPABASE_PROJECT_REF=your-project-ref
```

#### Workflow de Preview

```yaml
name: Preview Deployment
on:
  pull_request:
    branches: [develop, main]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: pnpm install
      - name: Deploy to Vercel
        run: vercel deploy --prebuilt
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 🔒 Seguridad

### Variables Sensibles

- **Nunca commitees** variables de entorno
- **Usa Vercel Environment Variables** para producción
- **Rota las API keys** regularmente
- **Monitorea el uso** de las APIs

### RLS en Producción

```sql
-- Verificar que RLS esté habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;

-- Habilitar RLS si es necesario
ALTER TABLE tabla_name ENABLE ROW LEVEL SECURITY;
```

### Políticas de Seguridad

```sql
-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 📊 Monitoreo

### Métricas de Performance

#### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

#### Métricas de Base de Datos
```sql
-- Queries lentas
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Conexiones activas
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';
```

### Logs y Alertas

#### Vercel Analytics
- **Page Views**: Tráfico por página
- **Performance**: Tiempo de carga
- **Errors**: Errores de JavaScript

#### Supabase Logs
```bash
# Ver logs de la base de datos
supabase logs --project-ref your-project-ref

# Ver logs de autenticación
supabase logs --project-ref your-project-ref --service auth
```

## 🔧 Troubleshooting

### Problemas Comunes

#### "Build failed: Migration error"

```bash
# Verificar migraciones
supabase migration list

# Aplicar migraciones manualmente
supabase db push --linked

# Verificar logs
supabase logs --project-ref your-project-ref
```

#### "Environment variables not found"

```bash
# Verificar variables en Vercel
vercel env ls

# Agregar variable
vercel env add NEXT_PUBLIC_SUPABASE_URL
```

#### "Google Maps API error"

```bash
# Verificar API key
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Resistencia&key=YOUR_API_KEY"

# Verificar dominios autorizados
# Google Cloud Console > APIs & Services > Credentials
```

### Debugging en Producción

#### Herramientas de Debug

```typescript
// Verificar variables de entorno
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Google Maps Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

// Verificar conexión a Supabase
const { data, error } = await supabase.from('playa').select('count')
console.log('Supabase connection:', { data, error })
```

#### Logs de Aplicación

```typescript
// En producción, usar un servicio de logging
import { logger } from '@/lib/logger'

try {
  await createPlaya(data)
  logger.info('Playa creada exitosamente', { playaId: data.id })
} catch (error) {
  logger.error('Error al crear playa', { error, data })
}
```

## 📈 Optimizaciones

### Performance

#### Bundle Optimization
```bash
# Analizar bundle
pnpm build
npx @next/bundle-analyzer

# Optimizar imágenes
# Usar next/image para todas las imágenes
# Configurar dominios en next.config.js
```

#### Database Optimization
```sql
-- Crear índices para queries frecuentes
CREATE INDEX idx_playa_dueno ON playa(dueno_id);
CREATE INDEX idx_plaza_playa ON plaza(playa_id);
CREATE INDEX idx_tarifa_playa ON tarifa(playa_id);

-- Analizar queries lentas
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC;
```

### Caching

#### Next.js Caching
```typescript
// Cache de datos estáticos
export const revalidate = 3600 // 1 hora

// Cache de datos dinámicos
export const dynamic = 'force-dynamic'
```

#### Supabase Caching
```typescript
// Usar React Query para cache
import { useQuery } from '@tanstack/react-query'

const { data: playas } = useQuery({
  queryKey: ['playas'],
  queryFn: () => getPlayas(),
  staleTime: 5 * 60 * 1000, // 5 minutos
})
```

## 🔄 Rollback

### Rollback de Código

```bash
# Rollback a commit anterior
git revert <commit-hash>
git push origin main

# Rollback de Vercel
vercel rollback <deployment-url>
```

### Rollback de Base de Datos

```bash
# Ver historial de migraciones
supabase migration list

# Rollback a migración específica
supabase db reset --linked
```

## 📚 Recursos Adicionales

### Documentación

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### Herramientas

- [Vercel CLI](https://vercel.com/cli)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Google Cloud Console](https://console.cloud.google.com)

### Monitoreo

- [Vercel Analytics](https://vercel.com/analytics)
- [Supabase Dashboard](https://app.supabase.com)
- [Google Maps Platform](https://console.cloud.google.com)

---

Esta guía te ayudará a desplegar y mantener el proyecto Valet en producción de forma segura y eficiente.
