import { AdvancedMarker, AdvancedMarkerProps } from '@vis.gl/react-google-maps'

import LogoMarker from '@/assets/institutional/LogoMarker'

interface PlayaMarkerProps extends AdvancedMarkerProps {
  children?: React.ReactNode
}

export default function PlayaMarker({ children, ...props }: PlayaMarkerProps) {
  return (
    <AdvancedMarker {...props}>
      <div className="relative">
        <LogoMarker className="size-12" />
        {children}
      </div>
    </AdvancedMarker>
  )
}
