import Image from 'next/image'

import { AdvancedMarker, AdvancedMarkerProps } from '@vis.gl/react-google-maps'

interface PlayaMarkerProps extends AdvancedMarkerProps {
  children?: React.ReactNode
}

export default function PlayaMarker({ children, ...props }: PlayaMarkerProps) {
  return (
    <AdvancedMarker {...props}>
      <div className="relative inline-block">
        {/* Badge de disponibilidad - centrado arriba de la gota */}
        {children && (
          <div className="absolute -top-5 left-1/2 z-20 -translate-x-1/2 scale-75">
            {children}
          </div>
        )}
        {/* Contenedor con forma de gota */}
        <div className="relative flex items-center justify-center">
          {/* SVG de fondo con forma de gota */}
          <svg
            width="36"
            height="48"
            viewBox="0 0 48 64"
            className="block"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}
          >
            <path
              d="M24 0C10.745 0 0 10.745 0 24c0 13.255 24 40 24 40s24-26.745 24-40C48 10.745 37.255 0 24 0z"
              fill="currentColor"
              className="text-primary"
            />
          </svg>
          {/* Ícono dentro de la gota */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2">
            <Image
              src="/favicon.ico"
              alt="Playa"
              width={20}
              height={20}
              className="rounded-sm"
            />
          </div>
        </div>
      </div>
    </AdvancedMarker>
  )
}
