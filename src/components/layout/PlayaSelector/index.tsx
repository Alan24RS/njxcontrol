'use client'

import { useEffect, useState } from 'react'

import { Check, ChevronsUpDown, MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { Playa } from '@/services/playas/types'
import { useSelectedPlaya } from '@/stores'

interface PlayaSelectorProps {
  playas: Playa[]
}

export default function PlayaSelector({ playas }: PlayaSelectorProps) {
  const { selectedPlaya, isLoading, setSelectedPlaya } = useSelectedPlaya()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isLoading && playas.length > 0) {
      if (selectedPlaya) {
        const stillExists = playas.some((p) => p.id === selectedPlaya.id)
        if (!stillExists) {
          setSelectedPlaya(playas[0])
        }
      } else {
        setSelectedPlaya(playas[0])
      }
    } else if (!isLoading && playas.length === 0 && selectedPlaya) {
      setSelectedPlaya(null)
    }
  }, [isLoading, selectedPlaya, setSelectedPlaya, playas])

  if (isLoading) {
    return (
      <div className="w-full sm:w-auto">
        <Skeleton className="bg-primary text-background hover:bg-primary/90 hover:text-accent h-10 w-full justify-between p-2 font-normal" />
      </div>
    )
  }

  return (
    <div className="w-full sm:w-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={playas.length === 0}
            size="sm"
            className="bg-primary text-background hover:bg-primary/90 hover:text-accent h-10 w-full justify-between p-2 font-normal"
            aria-label="Cambiar playa actual"
          >
            <div className="flex min-w-0 items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <div className="truncate text-left">
                {playas.length === 0 ? (
                  <div className="text-muted-foreground">
                    No tiene playas asignadas
                  </div>
                ) : selectedPlaya ? (
                  <div className="truncate">
                    {selectedPlaya.nombre || selectedPlaya.direccion}
                  </div>
                ) : (
                  <div className="text-muted-foreground">Seleccionar playa</div>
                )}
              </div>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64 p-2">
          {/* Buscador interno */}
          {playas?.length > 5 && (
            <Input
              name="nombre"
              placeholder="Buscar playa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
          )}

          <div
            className={`overflow-y-auto ${
              playas.length > 5 ? 'max-h-60' : 'max-h-none'
            }`}
          >
            {playas.length > 0 ? (
              playas.map((playa) => (
                <DropdownMenuItem
                  key={playa.id}
                  onSelect={() => setSelectedPlaya(playa)}
                  className="cursor-pointer"
                >
                  <div className="flex w-full items-center justify-between">
                    <span>{playa.nombre || playa.direccion}</span>
                    {selectedPlaya?.id === playa.id && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                No se encontraron playas
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
