'use client'

import { EyeIcon } from 'lucide-react'

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui'
import { useHiddenColumnsContext } from '@/contexts'
import type { Filters as FiltersType } from '@/types/api'

import Filters from './Filters'
//functionality temporarily disabled
// import SearchFilter from './Search'

interface IDataTableToolbar {
  availableColumns: { id: string; label: string }[]
  search: {
    loading: boolean
    placeholder?: string
    minLength?: number
    suggestions?: string[]
  }
  filters?: {
    loading: boolean
    data?: FiltersType
  }
}

export default function DataTableToolbar({
  filters,
  // search,
  availableColumns
}: IDataTableToolbar) {
  const { hiddenColumns, toggleColumnVisibility } = useHiddenColumnsContext()

  return (
    <>
      <div className="hidden w-full flex-col gap-4 sm:flex">
        <div className="flex w-full flex-col items-center justify-end gap-4 sm:flex-row sm:items-start">
          {/* <SearchFilter
            placeholder={search.placeholder}
            minSearchLength={search.minLength}
            suggestions={search.suggestions}
          /> */}
          <Filters filters={filters?.data} loading={filters?.loading} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="hidden sm:inline-flex">
                Columnas <EyeIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {availableColumns.map((column) => {
                const isVisible = !hiddenColumns.includes(column.id)
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={isVisible}
                    onCheckedChange={() => {
                      toggleColumnVisibility(column.id)
                    }}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}
