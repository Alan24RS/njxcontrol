import type {
  Ciudad,
  Playa,
  PlayaPublica,
  RawCiudad,
  RawPlaya,
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
