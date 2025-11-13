# 🔄 Flujo de Trabajo

## 🌿 Git Flow

El proyecto sigue una variante de **Git Flow** con convenciones de nombres de rama obligatorias.

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          GIT FLOW - VALET                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   DEVELOP ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●             │
│            ┃                                                 ┃            │
│            ┃  feature/nueva-funcionalidad                    ┃            │
│            ┣━━━━━━━━●━━━━━━━●━━━━━━●                        ┃            │
│            ┃                         ↓ PR                    ┃            │
│            ┃                         ●━━━━━━━━━━━━━━━━━━━━━━┛            │
│            ┃                                                              │
│            ┃  fix/correccion-bug                                          │
│            ┣━━━━━━━●━━━━━━━●━━━━━━●                                     │
│            ┃                         ↓ PR                                 │
│            ┃                         ●━━━━━━━━━━━━━━━━━━━━━━┛            │
│            ┃                                                              │
│            ┃  backport/hotfix-from-main                                   │
│            ┣━━●                     ← merge/cherry-pick from main        │
│            ┃   ↓ PR                                                       │
│            ●━━━┛                                                          │
│            ┃                                                              │
│            ┃                                                              │
│            ┃           release/v1.2.0                                     │
│            ┣━━━━━━━━●━━━━━━●━━●                                          │
│            ┃                     ↓ PR                                     │
│            ┃                     ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │
│            ┃                                                          ↓    │
│    MAIN ●━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━●    │
│         ↑                                              ↑             🏷️   │
│         │  hotfix/critical-fix                        │         v1.2.0   │
│         └━━━━━━━━●━━━━━●━━━●                          │                  │
│                            ↓ PR                        │                  │
│                            ●━━━━━━━━━━━━━━━━━━━━━━━━━━┛                  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Tipos de Ramas

| Prefijo     | Descripción                   | Destino   | Ejemplo                          |
| ----------- | ----------------------------- | --------- | -------------------------------- |
| `feature/`  | Nueva funcionalidad           | `develop` | `feature/user-authentication`    |
| `fix/`      | Corrección de bugs en develop | `develop` | `fix/calendar-timezone-issue`    |
| `hotfix/`   | Fix crítico en producción     | `main`    | `hotfix/payment-gateway-error`   |
| `release/`  | Preparación de release        | `main`    | `release/v1.2.0`                 |
| `backport/` | Backport de hotfix a develop  | `develop` | `backport/payment-gateway-error` |
| `docs/`     | Solo cambios de documentación | `develop` | `docs/update-api-guide`          |
| `refactor/` | Refactorización de código     | `develop` | `refactor/payment-service`       |
| `test/`     | Adición de tests              | `develop` | `test/booking-flow-unit-tests`   |
| `ci/`       | Cambios en CI/CD              | `develop` | `ci/update-github-actions`       |
| `chore/`    | Tareas de mantenimiento       | `develop` | `chore/update-dependencies`      |

## 🚀 Desarrollo Normal (Feature)

### 1. Crear Rama de Feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-descriptivo
```

### 2. Desarrollar y Committear

```bash
# Seguir Conventional Commits
git commit -m "feat: ✨ descripción de la funcionalidad"
git commit -m "fix: 🐛 corrección de bug"
git commit -m "docs: 📝 actualizar documentación"
```

### 3. Crear Pull Request

- Asegurarse de que todos los checks de CI estén en verde ✅
- Usar **Squash merge** al fusionar
- Incluir descripción clara del cambio

## 🔥 Hotfix en Producción

### 1. Crear Rama de Hotfix

```bash
git checkout main
git pull origin main
git checkout -b hotfix/descripcion-del-fix
```

### 2. Hacer Fix y Crear PR

```bash
git commit -m "fix: 🐛 descripción del hotfix"
git push origin hotfix/descripcion-del-fix
# Crear PR: hotfix/descripcion-del-fix → main
```

### 3. Backport a Develop

```bash
# Después del merge a main
git checkout develop
git pull origin develop
git checkout -b backport/descripcion-del-fix
git merge main  # O cherry-pick el commit específico
git push origin backport/descripcion-del-fix
# Crear PR: backport/descripcion-del-fix → develop
```

## 🏷️ Release

### 1. Crear Rama de Release

```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0
```

### 2. Preparar Release

```bash
# Actualizar version en package.json, generar changelog, etc.
git commit -m "chore: 🚀 prepare release v1.2.0"
git push origin release/v1.2.0
```

### 3. PR a Main

```bash
# Crear PR: release/v1.2.0 → main
```

### 4. Tag después del Merge

```bash
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

## 🚫 Prohibido

**NO hacer push directo a las ramas principales:**
- ❌ `main`
- ❌ `develop`

Siempre trabajar mediante Pull Requests. El workflow de CI bloqueará pushes directos con un mensaje de advertencia.

**NO usar nombres de rama sin el prefijo correcto:**
- ❌ `mi-nueva-feature` → ✅ `feature/mi-nueva-feature`
- ❌ `bugfix-login` → ✅ `fix/login-error`
- ❌ `v1.2.0` → ✅ `release/v1.2.0`

## 🔀 Validación de Branches (GitHub Actions)

Cuando creas un Pull Request, GitHub Actions ejecuta automáticamente 3 checks:

### 1. 📋 Validar Nombre de Rama y Destino

Verifica que:
- ✅ La rama tenga un prefijo válido: `feature/`, `fix/`, `hotfix/`, `release/`, `backport/`, `docs/`, `refactor/`, `test/`, `ci/`, `chore/`
- ✅ El tipo de rama sea apropiado para el destino:
  - `feature/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`, `ci/` → `develop` ✅
  - `hotfix/`, `release/` → `main` ✅
  - `backport/` → `develop` ✅

### 2. 🎨 Calidad de Código

Ejecuta 3 verificaciones en secuencia:
- 🔍 **ESLint**: Verifica reglas de estilo y buenas prácticas
- 💄 **Prettier**: Verifica que el código esté correctamente formateado
- 🔷 **TypeScript**: Verifica que no haya errores de tipos

### 3. 🚫 Protección contra Pushes Directos

Solo se ejecuta cuando hay un push directo a `main` o `develop`.
- ❌ Falla intencionalmente para alertar
- 📚 Muestra el flujo correcto con Pull Requests
- 💡 Es un "bloqueo suave" (no previene el push, pero queda registrado)

## ✅ Cómo Asegurar que tus Checks Pasen

### 1. 🔍 Validar nombre de rama

```bash
pnpm branch:validate         # Para PRs a develop
pnpm branch:validate:main    # Para PRs a main
```

### 2. 🔍 ESLint (reglas de código)

```bash
pnpm lint
```

### 3. 💄 Prettier (formato)

```bash
pnpm format:check    # Solo verificar
pnpm format          # Arreglar automáticamente
```

### 4. 🔷 TypeScript (tipos)

```bash
pnpm typecheck
```

### 💡 Comando Todo-en-Uno

```bash
pnpm branch:validate && pnpm lint && pnpm format:check && pnpm typecheck
```

## 📝 Convenciones de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/) con emojis:

```
<type>: <emoji> <descripción corta en inglés>
```

### Tipos y Emojis

| Tipo       | Emoji    | Uso                     |
| ---------- | -------- | ----------------------- |
| `feat`     | ✨ 🚀 🎉 | Nueva funcionalidad     |
| `fix`      | 🐛 🔥    | Corrección de bugs      |
| `docs`     | 📝 📖    | Documentación           |
| `style`    | 🎨 💄    | Formato de código       |
| `refactor` | ♻️ 🔄 🚧 | Refactorización         |
| `perf`     | ⚡ 🚀    | Mejoras de rendimiento  |
| `test`     | ✅ 🧪    | Tests                   |
| `build`    | 📦 🔨    | Sistema de build        |
| `ci`       | 🤖       | Integración continua    |
| `chore`    | 🔧 🏗️    | Tareas de mantenimiento |

### Ejemplos

```bash
feat: ✨ add user authentication
fix: 🐛 resolve timezone issue in calendar
docs: 📝 update API documentation
refactor: ♻️ simplify payment processing
perf: ⚡ optimize database queries
test: ✅ add unit tests for booking flow
```

## 🔒 Migraciones de Base de Datos

Para cualquier cambio en la base de datos, **SIEMPRE** seguir el flujo:

```bash
# 1. Crear migración
supabase migration new nombre_descriptivo

# 2. Escribir SQL en el archivo generado en supabase/migrations/

# 3. Aplicar migración
supabase db push

# 4. Verificar
supabase migration list
```

**Importante:** Nunca hacer cambios directos en la consola de Supabase. Todo debe estar en migraciones versionadas.

## 📦 Merge de Pull Requests

### Política de Merge

1. **Squash Merge obligatorio**: Todos los commits del PR se unifican en uno solo
2. **Checks verdes**: Todos los checks de CI deben estar en verde ✅
3. **Review aprobado**: Al menos un review aprobado (según políticas del equipo)

### Título del Merge Commit

El título debe seguir Conventional Commits:

```
feat: ✨ descripción clara de lo que aporta el PR
```

## ❓ Problemas Comunes

### El check de validación de branch falla

**Error: "El nombre de la rama no sigue las convenciones"**

Tu rama no tiene el prefijo correcto. Renombra tu rama:

```bash
# Si estás en la rama incorrecta
git checkout -b feature/nombre-descriptivo  # crea nueva rama con nombre correcto
git merge nombre-incorrecto                  # trae los cambios
git push origin feature/nombre-descriptivo   # push de la nueva rama
git branch -D nombre-incorrecto              # borra la rama local incorrecta
git push origin --delete nombre-incorrecto   # borra la rama remota incorrecta
```

**Error: "Solo branches 'hotfix/_' y 'release/_' pueden ir a 'main'"**

Estás intentando hacer un PR de un tipo de rama incorrecto a `main`. Opciones:

1. Si es desarrollo normal → cambia el target del PR a `develop`
2. Si es un hotfix → renombra la rama a `hotfix/*`
3. Si es un release → renombra la rama a `release/*`

### El pre-commit hook es muy lento

Si `lint-staged` está lento, verifica que solo esté procesando archivos modificados. El hook solo debe tocar archivos en staging.

### Falló el typecheck pero TypeScript no muestra errores en mi IDE

Asegurarse de:

1. Reiniciar el servidor de TypeScript en tu IDE
2. Ejecutar `pnpm typecheck` localmente
3. Verificar que no haya archivos excluidos en `tsconfig.json`

### El workflow de CI falla pero localmente todo funciona

1. Verificar que estés usando la misma versión de Node (20)
2. Ejecutar `pnpm install --frozen-lockfile` para replicar el entorno de CI
3. Limpiar caché: `rm -rf node_modules .next && pnpm install`

## 🤝 Código de Conducta

- Mantener el código limpio y bien documentado
- Escribir tests para nuevas funcionalidades
- Actualizar documentación cuando sea necesario
- Ser respetuoso en los code reviews
- Reportar bugs y problemas de forma constructiva

---

**¿Dudas?** Abrí un issue o consultá con el equipo en el canal de desarrollo.
