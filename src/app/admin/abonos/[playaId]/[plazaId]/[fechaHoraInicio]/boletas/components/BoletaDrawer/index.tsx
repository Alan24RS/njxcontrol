'use client'

import { useState } from 'react'

import { X } from 'lucide-react'

import {
  Button,
  Sheet,
  SheetContent,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui'
import type { Boleta } from '@/services/abonos/types'

import AbonadoTab from './tabs/AbonadoTab'
import AbonoTab from './tabs/AbonoTab'
import BoletaTab from './tabs/BoletaTab'
import PagosTab from './tabs/PagosTab'

interface BoletaDrawerProps {
  boleta: Boleta | null
  playaId: string
  plazaId: string
  fechaHoraInicio: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaymentRegistered?: () => void
}

export default function BoletaDrawer({
  boleta,
  playaId,
  plazaId,
  fechaHoraInicio,
  open,
  onOpenChange,
  onPaymentRegistered
}: BoletaDrawerProps) {
  const [activeTab, setActiveTab] = useState('boleta')

  if (!boleta) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold">Detalle de Boleta</h2>
            <p className="text-muted-foreground text-sm">
              Boleta #{boleta.boletaId.slice(0, 8)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="boleta">Boleta</TabsTrigger>
            <TabsTrigger value="abono">Abono</TabsTrigger>
            <TabsTrigger value="abonado">Abonado</TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="boleta" className="space-y-4">
            <BoletaTab boleta={boleta} />
          </TabsContent>

          <TabsContent value="abono" className="space-y-4">
            <AbonoTab
              playaId={playaId}
              plazaId={plazaId}
              fechaHoraInicio={fechaHoraInicio}
            />
          </TabsContent>

          <TabsContent value="abonado" className="space-y-4">
            <AbonadoTab
              playaId={playaId}
              plazaId={plazaId}
              fechaHoraInicio={fechaHoraInicio}
            />
          </TabsContent>

          <TabsContent value="pagos" className="space-y-4">
            <PagosTab
              boleta={boleta}
              playaId={playaId}
              _plazaId={plazaId}
              fechaHoraInicio={fechaHoraInicio}
              onPaymentRegistered={onPaymentRegistered}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
