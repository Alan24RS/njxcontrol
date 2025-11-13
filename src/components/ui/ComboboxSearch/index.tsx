import { useEffect, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import {
  CheckIcon,
  ChevronsUpDown,
  RotateCw,
  SearchIcon,
  X
} from 'lucide-react'

import {
  Button,
  ComboboxProps,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui'
import useDebounce from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { ApiResponse } from '@/types/api'

export interface IOption {
  label: string
  value: string | number
}

interface ComboboxWithSearch extends Omit<ComboboxProps, 'options'> {
  queryFn: (value: { query?: string }) => Promise<ApiResponse<any>>
  debounce?: number
  fields?: {
    label: string
    value: string
  }
  initialData?: any[]
}

export default function ComboboxWithSearch(props: ComboboxWithSearch) {
  const {
    queryFn,
    debounce = 300,
    name,
    loading = false,
    disabled = false,
    error = false,
    multiple = false,
    className,
    value,
    placeholder = 'Selecciona una opción',
    fields = { label: 'label', value: 'value' },
    onChange,
    id,
    initialData = [],
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid
  } = props
  const [searchValue, setSearchValue] = useState('')
  const [open, setOpen] = useState(false)
  const controlId = id || name

  const debouncedSearchValue = useDebounce(searchValue, debounce)

  const { data, refetch, isLoading } = useQuery({
    queryKey: [name, debouncedSearchValue],
    queryFn: async (): Promise<ApiResponse<any>> =>
      queryFn({
        ...(debouncedSearchValue && {
          query: debouncedSearchValue
        })
      }),
    enabled: false
  })

  useEffect(() => {
    if (debouncedSearchValue) {
      refetch()
    }
  }, [debouncedSearchValue, refetch])

  const handleSelect = (selectedValue: IOption) => {
    if (multiple && Array.isArray(value)) {
      const isAlreadySelected = value.some(
        (v) => String(v[fields.value]) === String(selectedValue.value)
      )

      const newValue = isAlreadySelected
        ? value.filter(
            (v) => String(v[fields.value]) !== String(selectedValue.value)
          )
        : value.concat({
            [fields.label]: selectedValue.label,
            [fields.value]: selectedValue.value
          })

      onChange(newValue)
      // En modo múltiple, no cerrar el dropdown
    } else {
      onChange({
        [fields.label]: selectedValue.label,
        [fields.value]: selectedValue.value
      })
      // Solo cerrar en modo single
      setOpen(false)
      setSearchValue('') // Reset search when closing
    }
  }

  const handleClear = () => {
    onChange(multiple ? [] : '')
  }

  // Si no hay búsqueda, usar datos iniciales. Si hay búsqueda, usar datos de la query
  const fetchOptions = debouncedSearchValue ? (data?.data ?? []) : initialData

  const options: IOption[] =
    fetchOptions?.map((option: any) => ({
      label: option[fields.label],
      value: option[fields.value]
    })) ?? []

  // Solo mostrar loading cuando hay búsqueda activa
  const isLoadingSearch = debouncedSearchValue && isLoading

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
            'data-[state=open]:border-ring flex h-fit min-h-[36px] w-full cursor-pointer items-center justify-between rounded-md border px-3',
            loading
              ? 'center'
              : 'justify-between' + (error ? ' border-destructive border' : ''),
            multiple ? 'py-[4px]' : 'py-1',
            multiple && Array.isArray(value) && value.length ? 'pl-2' : '',
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
              multiple && Array.isArray(value) ? (
                value.length ? (
                  value.map((option) => (
                    <span
                      key={option[fields.value]}
                      className={`bg-background text-foreground focus:ring-ring inline-flex items-center gap-1 rounded-md border py-[2px] pl-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-hidden ${disabled ? 'pr-2' : 'pr-1'}`}
                    >
                      {<span>{option[fields.label]}</span>}
                      {!disabled && (
                        <span
                          onClick={(e) => {
                            e.preventDefault()
                            handleSelect({
                              label: option[fields.label],
                              value: option[fields.value]
                            })
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
                value[fields.label] || (
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
              {multiple && Array.isArray(value) && value.length ? (
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
      <PopoverContent
        className="p-0"
        align="start"
        onBlur={(e) => {
          // Solo cerrar si el foco se va completamente fuera del popover
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setOpen(false)
            setSearchValue('')
          }
        }}
      >
        <div className="w-full">
          <div className="relative">
            <SearchIcon className="absolute top-3 left-3 h-4 w-4 shrink-0 opacity-50" />
            {isLoadingSearch && (
              <RotateCw className="absolute top-3 right-3 h-4 w-4 shrink-0 animate-spin opacity-50" />
            )}
            <input
              type="text"
              name={name}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-10 w-full rounded-t-md border-b px-2 pt-[9px] pb-2 pl-10 text-sm outline-hidden"
            />
          </div>
          <div className="w-full">
            {!isLoadingSearch && options.length > 0 ? (
              options.map((option) => {
                const isSelected = Array.isArray(value)
                  ? value.some(
                      (v) => String(v[fields.value]) === String(option.value)
                    )
                  : String(value?.[fields.value]) === String(option.value)

                return (
                  <button
                    id={option.value.toString()}
                    onClick={(e: any) => {
                      e.preventDefault()
                      const value = e.currentTarget.id

                      const optionSelected = options.find(
                        (option) => option.value.toString() === value
                      )

                      if (optionSelected) {
                        handleSelect(optionSelected)
                      }
                    }}
                    className={cn(
                      'hover:bg-accent flex h-10 w-full items-center px-4 py-2 text-start text-sm duration-100',
                      isSelected ? 'text-destructive' : 'text-foreground'
                    )}
                    key={option.value}
                  >
                    {option.label}
                    {isSelected && (
                      <CheckIcon className={cn('ml-auto size-4')} />
                    )}
                  </button>
                )
              })
            ) : (
              <div>
                <p className="py-4 text-center text-sm text-gray-600">
                  No se encontraron resultados
                </p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
