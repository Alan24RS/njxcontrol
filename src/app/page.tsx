import { redirect } from 'next/navigation'

import { Link } from 'next-view-transitions'

import {
  ArrowRight,
  BarChart3,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react'

import { Topbar } from '@/components/layout'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator
} from '@/components/ui'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { getCurrentYear } from '@/utils/dateUtils'
import { generateSyncMetadata } from '@/utils/metadata'

export const metadata = generateSyncMetadata({
  title: 'Valet - Plataforma de Gestión de Playas de Estacionamiento',
  description:
    'Encontrá playas de estacionamiento cerca tuyo o digitalizá tu playa con nuestra plataforma. Gestión inteligente, tarifas optimizadas y mayor rentabilidad.',
  pageRoute: '/'
})

interface LandingPageProps {
  searchParams: SearchParamsType
}

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const params = await searchParams

  const hasAuthParams = Boolean(
    params.code || params.access_token || params.error_code
  )

  if (hasAuthParams) {
    const callbackUrl = new URL('/api/auth/callback', 'http://localhost:3000')

    Object.entries(params).forEach(([key, value]) => {
      if (
        value &&
        typeof value === 'string' &&
        [
          'code',
          'access_token',
          'refresh_token',
          'error_code',
          'error_description',
          'type'
        ].includes(key)
      ) {
        callbackUrl.searchParams.set(key, value)
      }
    })
    redirect(callbackUrl.toString().replace('http://localhost:3000', ''))
  }

  const user = await getAuthenticatedUser()

  if (user) {
    redirect('/admin')
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Topbar />
      <section className="from-primary/10 via-primary/5 to-background relative bg-linear-to-br px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6">
              ✨ Plataforma líder en gestión de playas
            </Badge>
            <h1 className="text-foreground mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Revolucionamos el{' '}
              <span className="from-primary to-primary/70 bg-linear-to-r bg-clip-text text-transparent">
                estacionamiento
              </span>{' '}
              urbano
            </h1>
            <p className="text-muted-foreground mb-10 text-xl sm:text-2xl">
              Para conductores que buscan donde estacionar y dueños que quieren
              optimizar sus playas
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
              <Link
                href="/mapa"
                className={cn(
                  buttonVariants({ variant: 'default', size: 'lg' }),
                  'bg-primary hover:bg-primary/90 text-primary-foreground w-full shadow-lg sm:w-auto'
                )}
              >
                <MapPin className="mr-2 h-5 w-5" />
                Ver playas cercanas
              </Link>

              <Link
                href="/auth/login"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'shadow-lg sm:w-auto'
                )}
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                Gestionar mis playas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
            <div>
              <div className="text-primary text-3xl font-bold">2,500+</div>
              <div className="text-muted-foreground text-sm">
                Playas registradas
              </div>
            </div>
            <div>
              <div className="text-primary text-3xl font-bold">50K+</div>
              <div className="text-muted-foreground text-sm">
                Conductores activos
              </div>
            </div>
            <div>
              <div className="text-primary text-3xl font-bold">95%</div>
              <div className="text-muted-foreground text-sm">
                Satisfacción promedio
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4">
              <Car className="mr-1 h-4 w-4" />
              Para Conductores
            </Badge>
            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Encontrá estacionamiento en 3 pasos
            </h2>
            <p className="text-muted-foreground text-lg">
              Sin registros ni complicaciones. Información en tiempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Card className="group transition-all hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <MapPin className="text-primary h-8 w-8" />
                </div>
                <CardTitle>1. Activá tu ubicación</CardTitle>
                <CardDescription>
                  Hacé clic en &quot;Ver playas cercanas&quot; y permitinos
                  acceder a tu ubicación para mostrarte las opciones más
                  próximas.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <Clock className="text-primary h-8 w-8" />
                </div>
                <CardTitle>2. Compará opciones</CardTitle>
                <CardDescription>
                  Visualizá disponibilidad, tarifas, horarios y características
                  de cada playa en un mapa interactivo.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <CheckCircle className="text-primary h-8 w-8" />
                </div>
                <CardTitle>3. Elegí y andá</CardTitle>
                <CardDescription>
                  Seleccioná la playa que más te convenga y navegá directamente
                  usando tu app de mapas favorita.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/mapa"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              <MapPin className="mr-2 h-5 w-5" />
              Probá ahora gratis
            </Link>
          </div>
        </div>
      </section>

      <Separator />

      <section className="bg-muted/30 w-full">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4">
              <TrendingUp className="mr-1 h-4 w-4" />
              Para Dueños
            </Badge>
            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Transformá tu playa en un negocio inteligente
            </h2>
            <p className="text-muted-foreground text-lg">
              Más ingresos, mejor gestión, menos trabajo manual.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Card className="group border-primary/20 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                  <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-emerald-700 dark:text-emerald-300">
                  Mayor rentabilidad
                </CardTitle>
                <CardDescription>
                  Optimización automática de tarifas según demanda, ocupación y
                  horarios pico. Incrementá tus ingresos hasta un 40%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Tarifas dinámicas inteligentes
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Análisis de demanda en tiempo real
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Predicción de ingresos
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group border-primary/20 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                  <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-blue-700 dark:text-blue-300">
                  Control total
                </CardTitle>
                <CardDescription>
                  Dashboard completo con métricas, reportes y alertas. Gestioná
                  todo desde tu celular o computadora.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Reportes detallados y exportables
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Monitoreo de ocupación
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Alertas personalizadas
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group border-primary/20 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
                  <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-purple-700 dark:text-purple-300">
                  Gestión eficiente
                </CardTitle>
                <CardDescription>
                  Automatización de procesos, reducción de trabajo manual y
                  mejor experiencia para tus clientes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Sistema de turnos automático
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Gestión digital de tickets
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Soporte 24/7
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/auth/login"
              className={cn(buttonVariants({ size: 'lg' }))}
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Comenzá a digitalizar tu playa
            </Link>
            <p className="text-muted-foreground mt-4 text-sm">
              Sin costos iniciales • Configuración en 48hs • Soporte incluido
            </p>
          </div>
        </div>
      </section>

      <Separator />

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
              Preguntas frecuentes
            </h2>
            <p className="text-muted-foreground text-lg">
              Resolvemos las dudas más comunes sobre Valet
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="drivers">
              <AccordionTrigger>¿Es gratis para conductores?</AccordionTrigger>
              <AccordionContent>
                Sí, completamente gratis. Los conductores pueden buscar,
                comparar y ver información de playas sin registrarse ni pagar
                nada. No hay costos ocultos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="owners-cost">
              <AccordionTrigger>
                ¿Cuánto cuesta para dueños de playas?
              </AccordionTrigger>
              <AccordionContent>
                Ofrecemos diferentes planes según el tamaño de tu playa.
                Comenzás sin costo inicial y pagás un pequeño porcentaje sobre
                los ingresos adicionales generados. Contactanos para una
                cotización personalizada.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="setup">
              <AccordionTrigger>
                ¿Qué tan rápido puedo empezar?
              </AccordionTrigger>
              <AccordionContent>
                Para conductores es inmediato. Para dueños, después del registro
                configuramos tu playa en 24-48 horas. Incluye capacitación del
                equipo y soporte durante la primera semana.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="technology">
              <AccordionTrigger>
                ¿Necesito instalar algún hardware especial?
              </AccordionTrigger>
              <AccordionContent>
                No necesariamente. Comenzamos con la configuración digital
                básica. Para funciones avanzadas (sensores de ocupación,
                cámaras), evaluamos cada caso y ofrecemos soluciones acordes a
                tu presupuesto.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="support">
              <AccordionTrigger>¿Qué tipo de soporte ofrecen?</AccordionTrigger>
              <AccordionContent>
                Soporte completo 24/7 por chat, email y teléfono. Incluimos
                capacitación inicial, manuales digitales, y un gestor de cuenta
                dedicado para playas medianas y grandes.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Separator />

      <section className="from-primary to-primary/80 text-primary-foreground bg-linear-to-r px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
            ¿Listo para revolucionar el estacionamiento?
          </h2>
          <p className="mb-8 text-lg opacity-90">
            Unite a miles de conductores y cientos de dueños que ya confían en
            Valet
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <Link
              href="/mapa"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'secondary' }),
                'w-full sm:w-auto'
              )}
            >
              <MapPin className="mr-2 h-5 w-5" />
              Buscar playas ahora
            </Link>

            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'bg-foreground/20'
              )}
            >
              Registrar mi playa
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex flex-col items-center justify-center">
          <div className="grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-semibold">Valet</h3>
              <p className="text-muted-foreground text-sm">
                La plataforma líder en gestión inteligente de playas de
                estacionamiento.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold">Conductores</h4>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <Link href="/mapa" className="hover:text-foreground">
                    Buscar playas
                  </Link>
                </li>
                <li>Cómo funciona</li>
                <li>Soporte</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold">Dueños</h4>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <Link href="/auth/login" className="hover:text-foreground">
                    Registrar playa
                  </Link>
                </li>
                <li>Beneficios</li>
                <li>Precios</li>
                <li>Casos de éxito</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold">Empresa</h4>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>Sobre nosotros</li>
                <li>Contacto</li>
                <li>Términos</li>
                <li>Privacidad</li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex w-full max-w-7xl flex-col items-center justify-between sm:flex-row">
            <p className="text-muted-foreground text-sm">
              © {getCurrentYear()} Valet. Todos los derechos reservados.
            </p>
            <div className="mt-4 flex items-center space-x-4 sm:mt-0">
              <Badge variant="secondary" className="text-xs">
                <Users className="mr-1 h-3 w-3" />
                +50K usuarios activos
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
