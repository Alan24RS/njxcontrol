'use client'

import { useEffect, useState } from 'react'

type Playa = {
  playa_id: string
  nombre: string
  direccion?: string
  descripcion?: string
}

export default function CheckboxPlayasList({
  selected,
  onChange
}: {
  selected: any[]
  onChange: (items: any[]) => void
}) {
  const [playas, setPlayas] = useState<Playa[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch('/api/playas/usuario', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        setPlayas(json.data || [])
      })
      .catch((err) => {
        console.error('Error fetching user playas', err)
      })
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [])

  const toggle = (item: Playa) => {
    const exists = selected?.some(
      (s) => String(s.playa_id || s.value || s.id) === String(item.playa_id)
    )
    let next
    if (exists) {
      next = (selected || []).filter(
        (s) => String(s.playa_id || s.value || s.id) !== String(item.playa_id)
      )
    } else {
      next = (selected || []).concat({
        playa_id: item.playa_id,
        nombre: item.nombre
      })
    }
    onChange(next)
  }

  if (loading)
    return <p className="py-4 text-center text-sm">Cargando playas...</p>

  if (!playas || playas.length === 0) {
    return <p className="py-4 text-center text-sm">No hay playas disponibles</p>
  }

  return (
    <div className="space-y-2 px-2">
      {playas.map((p) => {
        const checked = (selected || []).some(
          (s) => String(s.playa_id || s.value || s.id) === String(p.playa_id)
        )
        return (
          <label key={p.playa_id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(p)}
            />
            <div className="text-sm">
              <div className="font-medium">{p.nombre}</div>
              {p.direccion && (
                <div className="text-muted-foreground text-xs">
                  {p.direccion}
                </div>
              )}
            </div>
          </label>
        )
      })}
    </div>
  )
}
