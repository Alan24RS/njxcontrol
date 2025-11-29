import type {
  Ciudad,
  DisponibilidadTipoPlaza,
  Playa,
  PlayaConDisponibilidad,
  PlayaPublica,
  RawCiudad,
  RawDisponibilidadTipoPlaza,
  RawPlaya,
  RawPlayaConDisponibilidad,
  RawPlayaPublica
} from './types'

export const transformListPlaya = (rawPlaya?: RawPlaya[] | null): Playa[] => {
  if (!rawPlaya) {
    return []
  }

  return rawPlaya.map((playa) => transformPlaya(playa))
}

export const transformPlaya = (rawPlaya: RawPlaya): Playa => {
  return {
    id: rawPlaya.playa_id,
    duenoId: rawPlaya.playa_dueno_id,
    nombre: rawPlaya.nombre,
    direccion: rawPlaya.direccion,
    descripcion: rawPlaya.descripcion,
    horario: rawPlaya.horario,
    latitud: rawPlaya.latitud,
    longitud: rawPlaya.longitud,
    ciudadId: rawPlaya.ciudad_id,
    ciudadNombre: rawPlaya.ciudad_nombre,
    ciudadProvincia: rawPlaya.ciudad_provincia,
    estado: rawPlaya.estado,
    fechaCreacion: new Date(rawPlaya.fecha_creacion),
    fechaModificacion: new Date(rawPlaya.fecha_modificacion),
    fechaEliminacion: new Date(rawPlaya.fecha_eliminacion)
  }
}

export const transformListPlayaPublica = (
  rawPlaya?: RawPlayaPublica[] | null
): PlayaPublica[] => {
  if (!rawPlaya) {
    return []
  }

  return rawPlaya.map((playa) => transformPlayaPublica(playa))
}

export const transformPlayaPublica = (
  rawPlaya: RawPlayaPublica
): PlayaPublica => {
  return {
    id: rawPlaya.playa_id,
    nombre: rawPlaya.nombre,
    direccion: rawPlaya.direccion,
    descripcion: rawPlaya.descripcion,
    horario: rawPlaya.horario,
    latitud: rawPlaya.latitud,
    longitud: rawPlaya.longitud,
    ciudadId: rawPlaya.ciudad_id,
    estado: rawPlaya.estado
  }
}

export const transformListCiudad = (
  rawCiudad?: RawCiudad[] | null
): Ciudad[] => {
  if (!rawCiudad) {
    return []
  }

  return rawCiudad.map((ciudad) => transformCiudad(ciudad))
}

export const transformCiudad = (rawCiudad: RawCiudad): Ciudad => {
  return {
    id: rawCiudad.ciudad_id,
    nombre: rawCiudad.nombre,
    provincia: rawCiudad.provincia,
    fechaCreacion: new Date(rawCiudad.fecha_creacion),
    fechaModificacion: new Date(rawCiudad.fecha_modificacion)
  }
}

export const transformDisponibilidadTipoPlaza = (
  raw: RawDisponibilidadTipoPlaza
): DisponibilidadTipoPlaza => {
  return {
    tipoPlazaId: raw.tipo_plaza_id,
    tipoPlazaNombre: raw.tipo_plaza_nombre,
    tipoPlazaDescripcion: raw.tipo_plaza_descripcion,
    totalPlazas: raw.total_plazas || 0,
    plazasDisponibles: raw.plazas_disponibles || 0
  }
}

export const transformPlayaConDisponibilidad = (
  rawData: RawPlayaConDisponibilidad[] | null | undefined
): PlayaConDisponibilidad[] => {
  if (!rawData || rawData.length === 0) return []

  // Agrupar por playa_id
  const playasMap = new Map<string, PlayaConDisponibilidad>()

  rawData.forEach((raw) => {
    const playaId = raw.playa_id

    if (!playasMap.has(playaId)) {
      playasMap.set(playaId, {
        id: raw.playa_id,
        nombre: raw.playa_nombre,
        direccion: raw.playa_direccion,
        descripcion: raw.playa_descripcion,
        horario: raw.playa_horario,
        latitud: raw.playa_latitud,
        longitud: raw.playa_longitud,
        ciudadId: raw.ciudad_id,
        ciudadNombre: raw.ciudad_nombre,
        ciudadProvincia: raw.ciudad_provincia,
        estado: raw.playa_estado,
        disponibilidadPorTipo: [],
        totalPlazas: 0,
        totalDisponibles: 0
      })
    }

    const playa = playasMap.get(playaId)!

    // Agregar disponibilidad por tipo
    playa.disponibilidadPorTipo.push({
      tipoPlazaId: raw.tipo_plaza_id,
      tipoPlazaNombre: raw.tipo_plaza_nombre,
      tipoPlazaDescripcion: raw.tipo_plaza_descripcion,
      totalPlazas: raw.total_plazas || 0,
      plazasDisponibles: raw.plazas_disponibles || 0
    })

    // Actualizar totales
    playa.totalPlazas += raw.total_plazas || 0
    playa.totalDisponibles += raw.plazas_disponibles || 0
  })

  return Array.from(playasMap.values())
}
