import { AdvancedMarker, AdvancedMarkerProps } from '@vis.gl/react-google-maps'

export default function UserMarker(props: AdvancedMarkerProps) {
  return (
    <AdvancedMarker {...props} title="Tu ubicación">
      <span className="relative flex size-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
        <span className="relative inline-flex size-3 rounded-full bg-sky-500" />
      </span>
    </AdvancedMarker>
  )
}
