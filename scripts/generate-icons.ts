import fs from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'
const root = path.resolve(__dirname, '..')
const srcCandidates = [
  path.join(root, 'public', 'brand', 'logo.png'),
  path.join(root, 'public', 'brand', 'logo-base.png')
]

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function pickSource(): string {
  for (const p of srcCandidates) {
    if (fs.existsSync(p)) return p
  }
  throw new Error(
    `No se encontró el logo base. Coloca tu PNG en: \n - public/brand/logo.png (recomendado) \n o \n - public/brand/logo-base.png`
  )
}

async function generate() {
  const src = pickSource()
  const appDir = path.join(root, 'src', 'app')
  ensureDir(appDir)

  // 1) Next.js core icons
  await sharp(src)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(path.join(appDir, 'icon.png'))

  await sharp(src)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(path.join(appDir, 'apple-icon.png'))

  // 2) Android Chrome icons
  const publicDir = path.join(root, 'public')
  ensureDir(publicDir)

  await sharp(src)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(path.join(publicDir, 'android-chrome-192x192.png'))

  await sharp(src)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(path.join(publicDir, 'android-chrome-512x512.png'))

  // 3) Favicon .ico (16/32/48)
  const tmpDir = path.join(root, '.cache', 'icons')
  ensureDir(tmpDir)
  const faviconSizes = [16, 32, 48] as const
  const favPngs: string[] = []
  for (const s of faviconSizes) {
    const out = path.join(tmpDir, `favicon-${s}.png`)
    await sharp(src)
      .resize(s, s, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(out)
    favPngs.push(out)
  }
  // Intentar generar favicon.ico si está disponible la dependencia opcional
  try {
    const mod: { default: (files: string[]) => Promise<Buffer> } =
      (await import('png-to-ico')) as any
    const ico = await mod.default(favPngs)
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico)
  } catch {
    // Fallback: generar PNGs estándar; Next y la mayoría de navegadores aceptan PNG
    await sharp(src)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(publicDir, 'favicon-32x32.png'))

    await sharp(src)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(publicDir, 'favicon-16x16.png'))

    console.warn(
      'Aviso: png-to-ico no está instalado. Se crearon PNGs de favicon.'
    )
  }

  // 4) Open Graph image (1200x630)
  const ogW = 1200
  const ogH = 630
  const background = '#0d0d0d' // Ajusta si quieres otro fondo
  // Mantener el logo siempre más pequeño que el lienzo OG
  const maxLogoW = Math.floor(ogW * 0.7) // 70% del ancho
  const maxLogoH = Math.floor(ogH * 0.7) // 70% del alto
  const logoBuffer = await sharp(src)
    .resize({
      width: maxLogoW,
      height: maxLogoH,
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer()

  await sharp({
    create: {
      width: ogW,
      height: ogH,
      channels: 4,
      background
    }
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(appDir, 'opengraph-image.png'))

  console.log('✓ Iconos generados:')
  console.log(' - src/app/icon.png')
  console.log(' - src/app/apple-icon.png')
  console.log(' - public/favicon.ico')
  console.log(' - public/android-chrome-192x192.png')
  console.log(' - public/android-chrome-512x512.png')
  console.log(' - src/app/opengraph-image.png')
}

generate().catch((err) => {
  console.error('Error generando iconos:', err)
  process.exit(1)
})
