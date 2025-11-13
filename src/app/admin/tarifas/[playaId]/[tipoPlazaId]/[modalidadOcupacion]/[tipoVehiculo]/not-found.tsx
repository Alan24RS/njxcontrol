import { Link } from 'next-view-transitions'

import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Tarifa no encontrada</h2>
        <p className="text-muted-foreground mt-2">
          La tarifa que buscas no existe o ha sido eliminada.
        </p>
      </div>
      <Button asChild>
        <Link href="/admin/tarifas">Volver a Tarifas</Link>
      </Button>
    </div>
  )
}
