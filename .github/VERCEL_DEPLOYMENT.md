# Configuración de Deployment a Vercel vía GitHub Actions

## Resumen

Este proyecto usa GitHub Actions para deployar automáticamente a Vercel en cada push a las ramas `main` y `develop`, en lugar de la integración nativa de Vercel.

## Secretos Requeridos

Debes configurar los siguientes secretos en tu repositorio de GitHub:

### Cómo obtener los valores:

1. **VERCEL_TOKEN**
   - Ve a [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
   - Crea un nuevo token con scope completo
   - Copia el token generado

2. **VERCEL_ORG_ID** y **VERCEL_PROJECT_ID**
   - En tu proyecto local, ejecuta:
     ```bash
     vercel link
     ```
   - Esto creará el archivo `.vercel/project.json`
   - Los valores `orgId` y `projectId` están en ese archivo

### Cómo configurar los secretos en GitHub:

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Haz clic en "New repository secret"
4. Agrega cada uno de estos secretos:
   - `VERCEL_TOKEN` → tu token de Vercel
   - `VERCEL_ORG_ID` → el `orgId` del archivo `.vercel/project.json`
   - `VERCEL_PROJECT_ID` → el `projectId` del archivo `.vercel/project.json`

## Funcionamiento

### Push a `main`:

- Se ejecuta el workflow de GitHub Actions
- Se construye el proyecto usando `vercel build --prod`
- Se despliega a producción con `vercel deploy --prebuilt --prod`
- URL: tu dominio de producción

### Push a `develop`:

- Se ejecuta el workflow de GitHub Actions
- Se construye el proyecto usando `vercel build` (preview)
- Se despliega como preview con `vercel deploy --prebuilt`
- URL: URL de preview generada automáticamente

## Verificación

Para verificar que todo está funcionando:

1. Haz un push a `develop` o `main`
2. Ve a la pestaña "Actions" en GitHub
3. Verifica que el workflow "Deploy to Vercel" se ejecute correctamente
4. Revisa los logs de cada step para cualquier error

## Troubleshooting

### Error: "Invalid token"

- Verifica que `VERCEL_TOKEN` esté configurado correctamente
- Regenera el token en Vercel si es necesario

### Error: "Project not found"

- Verifica que `VERCEL_PROJECT_ID` y `VERCEL_ORG_ID` sean correctos
- Ejecuta `vercel link` localmente para obtener los valores actualizados

### El build falla

- Verifica que todas las variables de entorno necesarias estén configuradas en Vercel
- El workflow usa `vercel pull` para obtener las variables de entorno de Vercel

## Notas Importantes

- La carpeta `.vercel/` está en `.gitignore` - NO la commitees
- El archivo `vercel.json` tiene `deploymentEnabled: false` para deshabilitar los deployments automáticos de Vercel
- Todos los deployments ahora pasan por GitHub Actions
