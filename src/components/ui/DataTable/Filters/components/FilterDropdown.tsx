'use client'

import { ComponentType, useEffect, useState } from 'react'

import { CheckIcon, PlusCircleIcon, RotateCw, SearchIcon } from 'lucide-react'

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  ScrollArea,
  SelectSeparator
} from '@/components/ui'
import useDebounce from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

type FilterDropdownProps = {
  title?: string
  options: {
    label: string
    value: string
    icon?: ComponentType<{ className?: string }>
  }[]
  values: Set<string>
  handleSearch: (value?: string) => void
  characterMinimum?: number
  loading?: boolean
}

export default function FilterDropdown({
  title,
  options,
  values,
  handleSearch = () => null,
  characterMinimum = 3,
  loading = false
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [searchedValue, setSearchedValue] = useState('')
  const debouncedSearchedValue = useDebounce(searchedValue, 500)
  const [selectedOptions, setSelectedOptions] = useState<
    {
      label: string
      value: string | number
    }[]
  >(options.filter((option) => values.has(option.value)))

  useEffect(() => {
    if (debouncedSearchedValue.length >= characterMinimum) {
      handleSearch(debouncedSearchedValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchedValue])

  const onReset = () => {
    values.clear()
    setSelectedOptions([])
  }

  useEffect(() => {
    if (!open) {
      setSearchedValue('')
    }
  }, [open, handleSearch])

  const onChange = (id: string) => {
    const isSelected = values.has(id)
    if (isSelected) {
      values.delete(id)
      setSelectedOptions((prev) => prev.filter((item) => item.value !== id))
    } else {
      values.add(id)
      const option = options.find((option) => option.value === id)
      if (!option) return
      setSelectedOptions((prev) => prev.concat(option))
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-start gap-1 border-dashed"
        >
          <PlusCircleIcon className="h-4 w-4" />
          {title}
          {selectedOptions.length > 0 && (
            <>
              <div className="flex flex-wrap space-x-1">
                {selectedOptions.map((item) => (
                  <Badge
                    variant="secondary"
                    key={item.value}
                    className="rounded-sm px-1 font-normal"
                  >
                    {item.label}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <div className="w-full">
          <div className="relative">
            <SearchIcon className="absolute top-3 left-3 h-4 w-4 shrink-0 opacity-50" />
            {loading && (
              <RotateCw className="absolute top-3 right-3 h-4 w-4 shrink-0 animate-spin opacity-50" />
            )}
            <input
              type="text"
              value={searchedValue}
              onChange={(e) => setSearchedValue(e.target.value)}
              className="h-10 w-full border-b px-2 pt-[9px] pb-2 pl-10 text-sm outline-hidden"
            />
          </div>
          <ScrollArea>
            <div className="max-h-[300px] w-full">
              {options.map((option) => {
                const isSelected = values.has(option.value)
                return (
                  <button
                    id={option.value}
                    onClick={() => onChange(option.value)}
                    className="hover:bg-accent flex w-full items-center gap-1 px-3 py-2 text-start text-sm duration-100"
                    key={option.value}
                  >
                    <div
                      className={cn(
                        'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon className={cn('h-4 w-4')} />
                    </div>
                    {option.icon && (
                      <option.icon className="text-muted-foreground mr-2 h-4 w-4" />
                    )}
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
          <SelectSeparator />
          <button
            onClick={() => onReset()}
            className="hover:bg-accent block w-full px-4 py-2 text-center text-sm duration-100"
          >
            Limpiar
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
