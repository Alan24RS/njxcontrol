'use client'

import { ReactNode, useState } from 'react'

import { CheckIcon, ChevronsUpDown, X } from 'lucide-react'

import {
  Button,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui'
import { cn } from '@/lib/utils'

export type Combobox = {
  options: { value: any; label: string; custom?: ReactNode }[]
  placeholder?: string
  value: any
  onChange: (value: any) => void
  loading?: boolean
  disabled?: boolean
  error?: boolean
  name: string
  multiple?: boolean
  className?: string
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export function ComboboxComponent({
  options,
  placeholder,
  value,
  loading = false,
  error,
  disabled = false,
  onChange = () => null,
  name,
  multiple,
  className,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid
}: Combobox) {
  const [open, setOpen] = useState(false)
  const controlId = id ?? name

  const handleSelect = (selectedValue: string) => {
    if (multiple) {
      const newValue =
        value?.includes(selectedValue) && Array.isArray(value)
          ? value.filter((v) => v !== selectedValue)
          : [...(value ?? []), selectedValue]
      onChange?.(newValue)
    } else {
      onChange?.(selectedValue)
      setOpen(false)
    }
  }

  const handleClear = () => {
    onChange?.(multiple ? [] : '')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          loading={loading}
          disabled={disabled}
          aria-expanded={open}
          id={controlId}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          className={cn(
            'data-[state=open]:border-ring flex min-h-[36px] w-full cursor-pointer items-center justify-between rounded-md border px-3',
            loading
              ? 'center'
              : 'justify-between' + (error ? ' border-destructive border' : ''),
            multiple ? 'py-[2px]' : 'py-1',
            multiple && value !== undefined && value.length > 0 ? 'pl-2' : '',
            className
          )}
        >
          <div
            className={cn(
              'w-full items-center gap-1 overflow-hidden text-sm',
              multiple ? 'flex grow flex-wrap' : 'inline-flex whitespace-nowrap'
            )}
          >
            {value !== undefined ? (
              multiple ? (
                value.length > 0 ? (
                  options
                    .filter(
                      (option) =>
                        Array.isArray(value) && value.includes(option.value)
                    )
                    .map((option) => (
                      <span
                        key={option.value}
                        className={`bg-background text-foreground focus:ring-ring inline-flex items-center gap-1 rounded-md border py-[2px] pl-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-hidden ${disabled ? 'pr-2' : 'pr-1'}`}
                      >
                        {option.custom || <span>{option.label}</span>}
                        {!disabled && (
                          <span
                            onClick={(e) => {
                              e.preventDefault()
                              handleSelect(option.value)
                            }}
                            className="text-muted-foreground/60 hover:bg-accent hover:text-destructive flex items-center rounded-sm px-[1px]"
                          >
                            <X className="size-4" />
                          </span>
                        )}
                      </span>
                    ))
                ) : (
                  <span className="text-muted-foreground mr-auto">
                    {placeholder}
                  </span>
                )
              ) : (
                options.find((option) => option.value === value)?.custom ||
                options.find((option) => option.value === value)?.label || (
                  <span className="text-muted-foreground mr-auto">
                    {placeholder}
                  </span>
                )
              )
            ) : (
              <span className="text-muted-foreground mr-auto">
                {placeholder}
              </span>
            )}
          </div>
          {!disabled && (
            <div className="text-muted-foreground/60 hover:text-foreground flex items-center self-stretch pl-1 [&>div]:flex [&>div]:items-center [&>div]:self-stretch">
              {multiple && value !== undefined && value.length > 0 ? (
                <div
                  onClick={(e) => {
                    e.preventDefault()
                    handleClear()
                  }}
                >
                  Limpiar
                </div>
              ) : (
                <div>
                  <ChevronsUpDown className="size-4" />
                </div>
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Buscar" />
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <CommandList>
            {options.map((option) => {
              const isSelected =
                Array.isArray(value) && value.includes(option.value)
              return (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  className="rounded-none"
                >
                  {multiple && (
                    <div
                      className={cn(
                        'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon className="size-4" />
                    </div>
                  )}
                  {option.custom || <span>{option.label}</span>}
                  {!multiple && option.value === value && (
                    <CheckIcon
                      className={cn(
                        'ml-auto size-4',
                        option.value === value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  )}
                </CommandItem>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
