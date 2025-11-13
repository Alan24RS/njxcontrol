'use client'

import { ReactElement, useEffect, useMemo, useState } from 'react'

import { usePathname, useRouter } from 'next/navigation'

import { FilterIcon } from 'lucide-react'

import {
  Accordion,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  ScrollArea,
  Spinner
} from '@/components/ui'
import {
  FilterCalendar,
  FilterCheckbox,
  FilterContainer
} from '@/components/ui/DataTable/Filters/components'
import useQueryParams from '@/hooks/useQueryParams'
import type { Filters } from '@/types/api'
import { getFiltersApplied } from '@/utils/filtersUtils'

const filterStrategies = {
  estado: FilterCheckbox,
  playero: FilterCheckbox,
  tipoPlaza: FilterCheckbox,
  ciudad: FilterCheckbox,
  caracteristicas: FilterCheckbox,
  modalidadOcupacion: FilterCheckbox,
  tipoVehiculo: FilterCheckbox,
  date: FilterCalendar
}

const Filters = ({
  filters,
  loading,
  extraContent
}: {
  filters?: Filters
  loading?: boolean
  extraContent?: ReactElement
}) => {
  const [open, setOpen] = useState(false)
  const [filterItemsOpen, setFilterItemsOpen] = useState<string[]>([])

  const { searchParams, handleParamsChange } = useQueryParams()
  const router = useRouter()
  const pathname = usePathname()

  const { filtersApplied, uniqueFiltersApplied } =
    getFiltersApplied(searchParams)

  const normalizedFilters = useMemo(() => filters ?? ({} as Filters), [filters])
  const filterKeys = useMemo(
    () => Object.keys(normalizedFilters),
    [normalizedFilters]
  )

  const initialPending = useMemo(() => {
    const map = new Map<string, Set<string>>()
    filterKeys.forEach((key) => {
      map.set(key, new Set(searchParams.getAll(key)))
    })
    return map
  }, [filterKeys, searchParams])

  const [pending, setPending] =
    useState<Map<string, Set<string>>>(initialPending)
  const [pendingDate, setPendingDate] = useState<{
    from?: string
    to?: string
  }>({
    from: searchParams.get('fromDate') ?? undefined,
    to: searchParams.get('toDate') ?? undefined
  })

  useEffect(() => {
    if (open) {
      setPending(initialPending)
      setPendingDate({
        from: searchParams.get('fromDate') ?? undefined,
        to: searchParams.get('toDate') ?? undefined
      })
    }
  }, [open, initialPending, searchParams])

  useEffect(() => {
    setPending((prev) => {
      const next = new Map(prev)
      let changed = false
      filterKeys.forEach((key) => {
        const allowed = new Set(
          normalizedFilters[key].options.map((o) => String(o.value))
        )
        const current = next.get(key) ?? new Set<string>()
        const filtered = new Set(
          Array.from(current).filter((v) => allowed.has(v))
        )
        if (
          filtered.size !== current.size ||
          Array.from(current).some((v) => !filtered.has(v))
        ) {
          next.set(key, filtered)
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [normalizedFilters, filterKeys])

  const pendingCount = useMemo(() => {
    let count = 0
    pending.forEach((set, key) => {
      const current = new Set(searchParams.getAll(key))
      const changed =
        set.size !== current.size ||
        Array.from(set).some((v) => !current.has(v))
      if (changed) count += 1
    })
    const fromNow = pendingDate.from
    const toNow = pendingDate.to
    const fromCur = searchParams.get('fromDate') ?? undefined
    const toCur = searchParams.get('toDate') ?? undefined
    if (fromNow !== fromCur || toNow !== toCur) count += 1
    return count
  }, [pending, pendingDate, searchParams])

  const handleReset = () => {
    router.replace(pathname, { scroll: false })
    setOpen(false)
  }

  const applyPending = () => {
    const payload: { name: string; value: string | string[] | undefined }[] = [
      { name: 'page', value: '1' }
    ]
    pending.forEach((set, key) => {
      payload.push({ name: key, value: Array.from(set) })
    })
    payload.push({ name: 'fromDate', value: pendingDate.from })
    payload.push({ name: 'toDate', value: pendingDate.to })
    handleParamsChange(payload)
    setOpen(false)
  }

  const handleResetSelection = () => {
    setPending(initialPending)
    setPendingDate({
      from: searchParams.get('fromDate') ?? undefined,
      to: searchParams.get('toDate') ?? undefined
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="hidden gap-2 sm:inline-flex"
          disabled={loading}
        >
          <span>Filtros</span>
          {loading ? <Spinner /> : <FilterIcon className="size-4" />}
          {uniqueFiltersApplied.length > 0 && (
            <span className="bg-foreground text-background flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-bold">
              <span
                className={`${uniqueFiltersApplied.length === 1 ? '-ml-[1px]' : ''}`}
              >
                {uniqueFiltersApplied.length}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="mx-4">
        <div className="flex w-72 flex-col">
          <div className="border-border bg-popover sticky top-0 z-10 flex h-10 w-full items-center">
            <div className="flex w-full items-baseline justify-between gap-2 border-b p-2">
              <span>Filtrar por:</span>
              <Button
                variant="outline"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  handleReset()
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
          {extraContent && <div className="border-b p-2">{extraContent}</div>}
          <ScrollArea className="h-[40vh]">
            <Accordion
              type="multiple"
              className="h-fit w-full"
              value={filterItemsOpen}
              onValueChange={setFilterItemsOpen}
            >
              {filterKeys.map((filterKey) => {
                const FilterComponent =
                  filterStrategies[filterKey as keyof typeof filterStrategies]

                if (!FilterComponent) {
                  return null
                }

                let valuesChecked: string[] = []
                if (filterKey === 'date') {
                  const from = searchParams.get('fromDate')
                  const to = searchParams.get('toDate')
                  if (from || to) {
                    const fmt = new Intl.DateTimeFormat('es-ES', {
                      day: '2-digit',
                      month: 'long'
                    })
                    const fromLabel = from
                      ? fmt.format(new Date(from))
                      : undefined
                    const toLabel = to ? fmt.format(new Date(to)) : undefined
                    if (fromLabel && toLabel) {
                      valuesChecked = [`del ${fromLabel} al ${toLabel}`]
                    } else if (fromLabel) {
                      valuesChecked = [`desde ${fromLabel}`]
                    } else if (toLabel) {
                      valuesChecked = [`hasta ${toLabel}`]
                    }
                  }
                } else {
                  const optionValuesSet = new Set(
                    normalizedFilters[filterKey].options.map((o) =>
                      String(o.value)
                    )
                  )
                  const selectedValues = filtersApplied
                    .filter((fa) => fa[0] === filterKey)
                    .map((fa) => String(fa[1]))
                  const validSelectedValues = selectedValues.filter((v) =>
                    optionValuesSet.has(v)
                  )
                  valuesChecked = validSelectedValues
                    .map(
                      (v) =>
                        normalizedFilters[filterKey].options.find(
                          (o) => String(o.value) === v
                        )?.label
                    )
                    .filter((v): v is string => Boolean(v))
                }

                const current = pending.get(filterKey) ?? new Set<string>()

                return (
                  <FilterContainer
                    key={filterKey}
                    title={normalizedFilters[filterKey].title}
                    checked={valuesChecked}
                    lastItem={filterKeys[filterKeys.length - 1] === filterKey}
                    open={filterItemsOpen.includes(filterKey)}
                  >
                    {filterKey === 'date' ? (
                      <FilterCalendar
                        options={normalizedFilters[filterKey].options}
                        selectedRange={{
                          from: pendingDate.from
                            ? new Date(pendingDate.from)
                            : undefined,
                          to: pendingDate.to
                            ? new Date(pendingDate.to)
                            : undefined
                        }}
                        onChange={(range) => {
                          setPendingDate({
                            from: range?.from
                              ? range.from.toISOString().slice(0, 10)
                              : undefined,
                            to: range?.to
                              ? range.to.toISOString().slice(0, 10)
                              : undefined
                          })
                        }}
                      />
                    ) : (
                      <FilterCheckbox
                        id={filterKey}
                        selected={current}
                        options={normalizedFilters[filterKey].options}
                        onChange={({ option, checked }) => {
                          setPending((prev) => {
                            const next = new Map(prev)
                            const setForKey = new Set(next.get(filterKey) ?? [])
                            if (checked) setForKey.add(option)
                            else setForKey.delete(option)
                            next.set(filterKey, setForKey)
                            return next
                          })
                        }}
                      />
                    )}
                  </FilterContainer>
                )
              })}
            </Accordion>
          </ScrollArea>
          {pendingCount > 0 && (
            <div className="border-border bg-popover sticky bottom-0 z-10 flex w-full items-center justify-between border-t p-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetSelection}
              >
                Borrar selección
              </Button>
              <Button size="sm" onClick={applyPending}>
                Aplicar {pendingCount} filtro{pendingCount > 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default Filters
