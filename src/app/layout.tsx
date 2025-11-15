import { ViewTransitions } from 'next-view-transitions'

import { EnvironmentIndicator } from '@/components/EnvironmentIndicator'
import { Toaster } from '@/components/ui'
import {
  GoogleMapsProvider,
  PageScrollProvider,
  ThemeProvider
} from '@/contexts'
import QueryProvider from '@/contexts/QueryProvider'
import { geistMono, geistSans } from '@/fonts'
import { AuthStateHandler } from '@/lib/supabase/auth-state-handler'
import { cn } from '@/lib/utils'
import { generateSyncMetadata } from '@/utils/metadata'

import './globals.css'

export const metadata = generateSyncMetadata({
  title: 'NJXControl',
  description:
    'NJXControl es una plataforma de gestión de playas de estacionamiento',
  pageRoute: '/'
})

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ViewTransitions>
      <html lang="es" suppressHydrationWarning>
        <head>
          <meta name="apple-mobile-web-app-title" content="NJXControl" />
        </head>
        <body
          className={cn(
            'flex min-h-screen flex-col items-center overflow-auto font-sans antialiased',
            `${geistSans.variable} ${geistMono.variable}`
          )}
        >
          <EnvironmentIndicator />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthStateHandler />
            <PageScrollProvider>
              <QueryProvider>
                <GoogleMapsProvider>{children}</GoogleMapsProvider>
              </QueryProvider>
            </PageScrollProvider>
            <Toaster richColors />
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  )
}
