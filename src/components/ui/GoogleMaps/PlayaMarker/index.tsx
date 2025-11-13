import { AdvancedMarker, AdvancedMarkerProps } from '@vis.gl/react-google-maps'

import LogoMarker from '@/assets/institutional/LogoMarker'

export default function PlayaMarker(props: AdvancedMarkerProps) {
  return (
    <AdvancedMarker {...props}>
      <LogoMarker className="size-12" />
    </AdvancedMarker>
  )
}
