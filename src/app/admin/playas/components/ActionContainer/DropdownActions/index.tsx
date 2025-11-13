import { MoreHorizontal, Pencil } from 'lucide-react'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui'

export default function DropdownActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="hidden size-9 p-0 sm:flex">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem className="flex cursor-pointer items-center gap-2">
          <Pencil className="h-4 w-4 text-gray-500" />
          Cargar lote
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
