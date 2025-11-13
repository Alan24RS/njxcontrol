import { Widget } from '@/app/admin/components/Widget'
import { PlayaStats } from '@/services/playas/getPlayaStats'

interface PlayaWidgetProps {
  stats: PlayaStats
  isVisible?: boolean
}

export function PlayaWidget({ stats, isVisible = true }: PlayaWidgetProps) {
  return (
    <Widget
      title="Playas activas"
      value={stats.active}
      action={{
        label: 'Ver todas las playas',
        href: '/admin/playas'
      }}
      isVisible={isVisible}
    >
      <div className="text-muted-foreground space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-medium">{stats.total}</span>
        </div>
        {stats.suspended > 0 && (
          <div className="flex justify-between">
            <span>Suspendidas:</span>
            <span className="font-medium text-yellow-600">
              {stats.suspended}
            </span>
          </div>
        )}
        {stats.draft > 0 && (
          <div className="flex justify-between">
            <span>Borradores:</span>
            <span className="font-medium text-gray-500">{stats.draft}</span>
          </div>
        )}
      </div>
    </Widget>
  )
}
