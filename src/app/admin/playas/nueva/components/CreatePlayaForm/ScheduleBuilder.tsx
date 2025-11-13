'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import { Plus, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const DAYS = [
  { key: 'LUN', label: 'Lun' },
  { key: 'MAR', label: 'Mar' },
  { key: 'MIE', label: 'Mié' },
  { key: 'JUE', label: 'Jue' },
  { key: 'VIE', label: 'Vie' },
  { key: 'SAB', label: 'Sáb' },
  { key: 'DOM', label: 'Dom' }
]

// usamos input type=time con step=900

// Helper: construir lista de tiempos cada `step` segundos
const buildTimes = (step = 900) => {
  const items: string[] = []
  for (let s = 0; s < 24 * 3600; s += step) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    items.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return items
}

function PopoverTimePicker({
  value,
  onChange,
  step = 900,
  label,
  minTime
}: {
  value: string
  onChange: (v: string) => void
  step?: number
  label?: string
  minTime?: string
}) {
  const times = buildTimes(step)
  const filteredTimes = minTime ? times.filter((t) => t > minTime) : times
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(() =>
    Math.max(0, filteredTimes.indexOf(value || '08:00'))
  )
  const ref = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.querySelectorAll('[role="option"]')[
        activeIdx
      ] as HTMLElement | undefined
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [open, activeIdx])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, times.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    }
    if (e.key === 'PageDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 4, times.length - 1))
    }
    if (e.key === 'PageUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 4, 0))
    }
    if (e.key === 'Home') setActiveIdx(0)
    if (e.key === 'End') setActiveIdx(times.length - 1)
    if (e.key === 'Enter') {
      e.preventDefault()
      onChange(times[activeIdx])
      setOpen(false)
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-36 rounded border bg-white p-2 text-left text-neutral-900"
      >
        {label ? (
          <span
            className={
              label === 'Cierre'
                ? 'mr-1 text-xs text-neutral-500'
                : 'mr-1 text-sm text-neutral-600'
            }
          >
            {label}:
          </span>
        ) : null}
        <span className="font-medium">{value}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label ?? 'Selector de hora'}
          onKeyDown={handleKey}
          className="absolute z-50 mt-2 max-h-60 w-40 overflow-auto rounded border bg-white shadow-lg"
        >
          <div ref={listRef}>
            {filteredTimes.map((t, i) => (
              <div
                key={t}
                role="option"
                aria-selected={i === activeIdx}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => {
                  onChange(t)
                  setOpen(false)
                }}
                className={`cursor-pointer px-3 py-2 text-sm ${i === activeIdx ? 'bg-black text-white' : 'text-neutral-800'}`}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ScheduleBuilder({
  name = 'horarios'
}: {
  name?: string
}) {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })

  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [apertura, setApertura] = useState('08:00')
  const [cierre, setCierre] = useState('20:00')
  const [is24hs, setIs24hs] = useState(false)
  const prevSnapshotRef = useRef<any[] | null>(null)

  const [error, setError] = useState<string | null>(null)

  // limpiar error cuando el usuario cambia selección o tiempos
  useEffect(() => {
    if (error) setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays, apertura, cierre])

  // contar cuántos turnos tiene cada día
  const turnsPerDay = useMemo(() => {
    const m: Record<string, number> = {}
    for (const f of fields) {
      const dias: string[] = (f as any).dias ?? []
      for (const d of dias) {
        m[d] = (m[d] ?? 0) + 1
      }
    }
    return m
  }, [fields])

  const toggleDay = (d: string) => {
    if (is24hs) return
    // permitir seleccionar mientras tenga menos de 2 turnos
    const cur = turnsPerDay[d] ?? 0
    if (cur >= 2) return
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )
  }

  const onAdd = () => {
    if (selectedDays.length === 0) {
      console.warn('Seleccione al menos un día')
      return
    }

    // validación: apertura < cierre (estrictamente menor)
    if (apertura >= cierre) {
      setError('La apertura debe ser menor que el cierre')
      return
    }

    // validación: máximo 2 turnos por día
    for (const d of selectedDays) {
      const existing = turnsPerDay[d] ?? 0
      if (existing >= 2) {
        setError('Solo se permiten dos horarios por día (mañana y tarde).')
        return
      }
    }

    // validación: evitar solapamientos por día
    for (const d of selectedDays) {
      for (const f of fields) {
        const fa = (f as any).apertura
        const fc = (f as any).cierre
        const overlaps = !(cierre <= fa || apertura >= fc)
        if ((f as any).dias?.includes(d) && overlaps) {
          setError('Horarios superpuestos.')
          return
        }
      }
    }

    // Appendar un registro que puede contener varios días
    append({ dias: selectedDays, apertura, cierre })
    setSelectedDays([])
    setError(null)
  }

  // 24 hs handler
  const toggle24hs = () => {
    if (!is24hs) {
      // snapshot
      prevSnapshotRef.current = JSON.parse(JSON.stringify(fields))
      // remove all
      for (let i = fields.length - 1; i >= 0; i--) remove(i)
      // append one registro por día
      const allDays = DAYS.map((d) => d.key)
      for (const d of allDays) {
        append({ dias: [d], apertura: '00:00', cierre: '23:59' })
      }
      setIs24hs(true)
      setSelectedDays([])
      setError(null)
    } else {
      // restore snapshot
      for (let i = fields.length - 1; i >= 0; i--) remove(i)
      if (prevSnapshotRef.current) {
        for (const f of prevSnapshotRef.current) append(f)
      }
      prevSnapshotRef.current = null
      setIs24hs(false)
      setSelectedDays([])
      setError(null)
    }
  }

  // eliminar todos los horarios de un día
  const removeDay = (day: string) => {
    for (let i = fields.length - 1; i >= 0; i--) {
      if ((fields[i] as any).dias?.includes(day)) remove(i)
    }
    setError(null)
  }

  // agrupar por día para visualización
  const groupedByDay = useMemo(() => {
    const map: Record<string, Array<{ apertura: string; cierre: string }>> = {}
    for (const f of fields) {
      const dias: string[] = (f as any).dias ?? []
      for (const d of dias) {
        if (!map[d]) map[d] = []
        map[d].push({
          apertura: (f as any).apertura,
          cierre: (f as any).cierre
        })
      }
    }
    return map
  }, [fields])

  // log para verificar lo que se envía al Fieldset

  return (
    <div className="space-y-5 pt-2">
      {/* Días */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => {
          const dayTurns = turnsPerDay[d.key] ?? 0
          const disabled = is24hs || dayTurns >= 2
          const selected = selectedDays.includes(d.key)
          return (
            <button
              type="button"
              key={d.key}
              onClick={() => toggleDay(d.key)}
              disabled={disabled}
              aria-disabled={disabled}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-150',
                disabled
                  ? 'cursor-not-allowed border-neutral-200 bg-white text-neutral-400 opacity-50'
                  : selected
                    ? 'border-black bg-black text-white shadow-sm'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
              )}
            >
              {d.label}
            </button>
          )
        })}

        <button
          type="button"
          onClick={toggle24hs}
          aria-pressed={is24hs}
          className={cn(
            'rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-150',
            is24hs
              ? 'border-black bg-black text-white shadow-sm'
              : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
          )}
        >
          24 hs
        </button>
      </div>

      {/* Horarios */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          {/* PopoverTimePicker de apertura */}
          <div className="relative flex items-center">
            <PopoverTimePicker
              value={apertura}
              onChange={(v) => {
                setApertura(v)
                if (cierre <= v) {
                  const times = buildTimes(900)
                  const next = times.find((t) => t > v)
                  if (next) setCierre(next)
                }
              }}
              step={900}
              label="Apertura"
            />
          </div>

          <span className="mx-1 font-medium text-neutral-500">–</span>

          {/* PopoverTimePicker de cierre */}
          <div className="relative flex items-center">
            <PopoverTimePicker
              value={cierre}
              onChange={setCierre}
              step={900}
              label="Cierre"
              minTime={apertura}
            />
          </div>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-900"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>

      {/* inline error */}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      {/* Lista de horarios agrupada por día */}
      <ul className="mt-3 divide-y divide-neutral-200">
        {DAYS.every((d) => !groupedByDay[d.key]) && (
          <p className="text-sm text-neutral-500 italic">
            Sin horarios agregados aún
          </p>
        )}

        {DAYS.map((d) => {
          const turns = groupedByDay[d.key]
          if (!turns) return null
          return (
            <li
              key={d.key}
              className="flex items-center justify-between rounded-md px-2 py-2 transition hover:bg-neutral-100"
            >
              <div>
                <span className="text-sm font-medium text-neutral-900">
                  {d.label} →
                </span>
                <span className="ml-2 text-sm text-neutral-600">
                  {turns.map((t) => `${t.apertura}–${t.cierre}`).join(' | ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeDay(d.key)}
                aria-label={`Eliminar horarios de ${d.label}`}
                className="rounded-md p-1 text-red-600 transition hover:text-red-800"
              >
                <Trash2 size={16} />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
