import type { DateRange, Matcher } from 'react-day-picker'

import { CalendarIcon } from 'lucide-react'

import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { parseLocalDate } from '@/utils/dateUtils'

export default function FilterCalendar({
  options,
  selectedRange,
  onChange
}: {
  options: {
    label: string
    value: string | number | boolean
    description?: string
  }[]
  selectedRange: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
}) {
  const labeledMin = options.find((option) => option.label === 'Mínima')
    ?.value as string | undefined
  const labeledMax = options.find((option) => option.label === 'Máxima')
    ?.value as string | undefined

  const parsedOptions = options
    .map((o) => {
      const v = o.value as unknown
      if (typeof v === 'number') {
        const ts = v < 1e12 ? v * 1000 : v
        const dt = new Date(ts)
        return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
      }
      return parseLocalDate(String(o.value))
    })
    .filter((d): d is Date => !!d && !isNaN(d.getTime()))

  const computedMin = parsedOptions.length
    ? new Date(
        Math.min.apply(
          null as unknown as number[],
          parsedOptions.map((d) => d.getTime())
        )
      )
    : undefined
  const computedMax = parsedOptions.length
    ? new Date(
        Math.max.apply(
          null as unknown as number[],
          parsedOptions.map((d) => d.getTime())
        )
      )
    : undefined

  const minimumDate =
    labeledMin ??
    (computedMin ? computedMin.toISOString().slice(0, 10) : undefined)
  const maximumDate =
    labeledMax ??
    (computedMax ? computedMax.toISOString().slice(0, 10) : undefined)

  const disabledMatchers: Matcher[] = []

  if (minimumDate) {
    const min = parseLocalDate(minimumDate)
    if (min && !isNaN(min.getTime())) {
      disabledMatchers.push({ before: min })
    }
  }

  if (maximumDate) {
    const max = parseLocalDate(maximumDate)
    if (max && !isNaN(max.getTime())) {
      disabledMatchers.push({ after: max })
    }
  }

  const handleSelect = (range: DateRange | undefined) => {
    onChange(range)
  }

  const formatDateRange = () => {
    if (!selectedRange?.from) return <span>Seleccionar rango de fechas</span>

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date)
    }

    if (selectedRange.to) {
      return `${formatDate(selectedRange.from)} - ${formatDate(selectedRange.to)}`
    }
    return formatDate(selectedRange.from)
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            className="w-full"
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            disabled={disabledMatchers}
            required={false}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
