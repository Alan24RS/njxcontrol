# 🚀 Optimizaciones de Rendimiento

## Problema: Filesystem Lento en OneDrive

Si ves esta advertencia al ejecutar `pnpm dev`:

```
Slow filesystem detected. The benchmark took 215ms...
```

Es porque OneDrive está sincronizando constantemente las carpetas de desarrollo, lo que ralentiza Next.js.

## ✅ Soluciones Implementadas

### 1. Optimización de OneDrive (✅ Aplicado)

Ya ejecutamos el script que marca las carpetas pesadas para que OneDrive no las sincronice activamente:

```bash
pnpm optimize:onedrive
```

Carpetas optimizadas:
- ✅ `.next` - Build cache de Next.js
- ✅ `node_modules` - Dependencias
- ✅ `.turbo` - Cache de Turbopack

### 2. Optimización de Next.js (✅ Aplicado)

Agregamos configuración en `next.config.ts` para:
- Optimizar importaciones de paquetes pesados (lucide-react, radix-ui)
- Reducir el número de archivos generados

### 3. Windows Defender (Opcional)

Si sigues teniendo lentitud, ejecuta como **Administrador**:

```bash
pnpm optimize:defender
```

Esto excluirá las carpetas de desarrollo del escaneo en tiempo real de Windows Defender.

## 📊 Mejoras Esperadas

Después de estas optimizaciones deberías ver:

| Antes | Después |
|-------|---------|
| Benchmark: ~215ms | Benchmark: <100ms |
| Hot reload: ~3-5s | Hot reload: ~1-2s |
| Build inicial: ~20s | Build inicial: ~10s |

## 🔄 Verificación

Reinicia el servidor de desarrollo:

```bash
# Detén el servidor actual (Ctrl+C)
pnpm dev
```

La advertencia de "Slow filesystem" debería desaparecer o el tiempo del benchmark debería ser menor.

## 🛠️ Opciones Adicionales

### Si los problemas persisten:

#### Opción A: Mover el proyecto fuera de OneDrive

```powershell
# Ejemplo: Mover a C:\Dev
mkdir C:\Dev
Move-Item -Path "C:\Users\juanc\OneDrive\Escritorio\njxControl" -Destination "C:\Dev\njxControl"
```

#### Opción B: Usar WSL2 (Recomendado para desarrollo profesional)

WSL2 tiene mejor rendimiento para desarrollo:

```bash
# En PowerShell (Administrador)
wsl --install

# Luego clona el proyecto en WSL
cd ~
git clone https://github.com/Alan24RS/njxcontrol.git
cd njxcontrol
pnpm install
pnpm dev
```

#### Opción C: Configurar exclusiones manuales en OneDrive

1. Haz clic derecho en la carpeta del proyecto
2. "Liberar espacio" para las carpetas `.next` y `node_modules`
3. OneDrive solo mantendrá los punteros, no los archivos completos

## 📝 Scripts Disponibles

```bash
# Optimizar OneDrive (ya ejecutado)
pnpm optimize:onedrive

# Optimizar Windows Defender (requiere Admin)
pnpm optimize:defender
```

## 💡 Consejos

1. **Commits frecuentes**: OneDrive sincroniza cambios, pero Git es tu respaldo principal
2. **Gitignore actualizado**: Las carpetas pesadas ya están en `.gitignore`
3. **Cache limpia**: Si tienes problemas, ejecuta:
   ```bash
   rm -rf .next node_modules
   pnpm install
   ```

## ⚠️ Notas Importantes

- Las optimizaciones son **locales** y no afectan a otros colaboradores
- Los scripts son **seguros** y reversibles
- OneDrive seguirá sincronizando tu código fuente (solo excluye las carpetas de build)
