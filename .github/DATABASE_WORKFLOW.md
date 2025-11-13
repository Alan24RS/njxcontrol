# 🔄 Database Migration Workflow

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DESARROLLO LOCAL                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1️⃣  Nuevo desarrollador clona el repo                              │
│      ↓                                                               │
│  2️⃣  supabase start  OR  pnpm db:setup                             │
│      ↓                                                               │
│  3️⃣  Aplica 91 migraciones en secuencia                             │
│      ├─ Tablas                                                       │
│      ├─ Índices                                                      │
│      ├─ Policies RLS                                                 │
│      ├─ Triggers                                                     │
│      └─ Functions                                                    │
│      ↓                                                               │
│  4️⃣  Ejecuta seed.sql (datos de prueba)                             │
│      ↓                                                               │
│  ✅  Base de datos lista con TODO configurado                        │
│                                                                      │
│  Durante desarrollo:                                                 │
│  • pnpm build  →  Solo lint (sin migraciones)                       │
│  • Nueva migración  →  supabase migration new                       │
│  • Aplicar local  →  supabase db push                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      PRODUCCIÓN (Vercel/CI)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1️⃣  git push origin main                                           │
│      ↓                                                               │
│  2️⃣  Vercel detecta NODE_ENV=production                             │
│      ↓                                                               │
│  3️⃣  pnpm build                                                      │
│      ├─ pnpm lint ✓                                                  │
│      ├─ pnpm typecheck ✓                                             │
│      └─ conditional-migrate.sh                                       │
│          ↓                                                           │
│          Detecta NODE_ENV=production                                 │
│          ↓                                                           │
│          migrate-production.sh                                       │
│          ├─ Link a Supabase remoto                                   │
│          ├─ supabase db push --include-all                           │
│          └─ Aplica SOLO migraciones NUEVAS                           │
│      ↓                                                               │
│  4️⃣  next build                                                      │
│      ↓                                                               │
│  ✅  Deploy exitoso con migraciones aplicadas                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Archivos Clave

### 📁 Estructura

```
valet/
├── supabase/
│   ├── migrations/              # 91 archivos ordenados por timestamp
│   │   ├── 20250907143953_create_enum_types.sql
│   │   ├── 20250907144013_create_sequences.sql
│   │   ├── ...
│   │   └── 20251003222838_fix_crear_invitacion_return_nombre.sql
│   ├── seed.sql                 # Datos de prueba para desarrollo
│   └── schema_reference.sql     # Schema completo para referencia
│
├── scripts/
│   ├── conditional-migrate.sh   # Detecta NODE_ENV y decide si migrar
│   ├── migrate-production.sh    # Ejecuta migraciones en producción
│   └── setup-local-db.sh        # Setup para nuevos desarrolladores
│
├── README.md                    # Guía principal del proyecto
└── README_DATABASE.md           # Guía detallada de base de datos
```

### 🔧 Scripts

#### `conditional-migrate.sh`

```bash
if [ "$NODE_ENV" = "production" ]; then
  # Ejecutar migraciones de producción
  migrate-production.sh
else
  # Desarrollo: skip migrations
  echo "Development mode - skipping migrations"
fi
```

#### `migrate-production.sh`

```bash
# Link a Supabase remoto
supabase link --project-ref $PROJECT_REF

# Aplicar solo migraciones nuevas
supabase db push --linked --include-all
```

## 🎯 Casos de Uso

### Caso 1: Nuevo Desarrollador

```bash
# 1. Clonar repo
git clone <repo-url>
cd valet

# 2. Instalar dependencias
pnpm install

# 3. Setup base de datos
pnpm db:setup
# Esto aplica las 91 migraciones automáticamente

# 4. Desarrollo
pnpm dev
```

### Caso 2: Crear Nueva Feature con DB Change

```bash
# 1. Crear migración
supabase migration new add_payment_table

# 2. Editar SQL
# supabase/migrations/20251004XXX_add_payment_table.sql

# 3. Aplicar localmente
supabase db push

# 4. Probar cambios
pnpm dev

# 5. Commit y push
git add .
git commit -m "feat: ✨ add payment table"
git push

# 6. Deploy automático aplica la migración
```

### Caso 3: Build en Desarrollo

```bash
pnpm build
# ✓ lint
# ✓ typecheck
# ✓ conditional-migrate (detecta dev, skip migraciones)
# ✓ next build
```

### Caso 4: Build en Producción

```bash
NODE_ENV=production pnpm build
# ✓ lint
# ✓ typecheck
# ✓ conditional-migrate (detecta prod, ejecuta migraciones)
#   ✓ migrate-production.sh
#     ✓ Link a Supabase
#     ✓ Aplica solo migraciones nuevas
# ✓ next build
```

## 🔐 Variables de Entorno

### Desarrollo Local

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-key>
```

### Producción (Vercel)

```env
NODE_ENV=production                                    # Auto
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co      # Manual
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>         # Manual
SUPABASE_PROJECT_REF=<project-ref>                     # Manual
SUPABASE_ACCESS_TOKEN=<access-token>                   # Manual
SUPABASE_DB_PASSWORD=<db-password>                     # Manual
```

## 📊 Estado Actual

✅ **91 migraciones** sincronizadas entre local y producción  
✅ **47 políticas RLS** configuradas  
✅ **Todas las tablas** con RLS habilitado  
✅ **Triggers y funciones** completamente funcionales  
✅ **Schema de referencia** disponible en `schema_reference.sql`

## 🚀 Ventajas de esta Solución

1. ✅ **Desarrollo sin fricciones**: `pnpm build` no ejecuta migraciones localmente
2. ✅ **Producción segura**: Solo aplica migraciones nuevas automáticamente
3. ✅ **Onboarding simple**: Un comando (`pnpm db:setup`) configura todo
4. ✅ **Historial completo**: Todas las 91 migraciones documentadas
5. ✅ **Schema de referencia**: Archivo completo para consulta rápida
6. ✅ **Separación de entornos**: Local usa migraciones, producción usa incremental

## 📚 Documentación

- [README.md](../README.md) - Guía principal del proyecto
- [README_DATABASE.md](../README_DATABASE.md) - Guía detallada de base de datos
- [schema_reference.sql](../supabase/schema_reference.sql) - Schema completo
