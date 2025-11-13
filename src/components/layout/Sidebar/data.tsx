import {
  CalendarIcon,
  CarFront,
  Clock,
  CreditCard,
  DollarSign,
  HomeIcon,
  LandPlot,
  ParkingCircle,
  Shapes,
  SquareParking,
  Users,
  UserStar
} from 'lucide-react'

import { ROL } from '@/constants/rol'

import { SidebarItem } from './Section'

export const general: SidebarItem[] = [
  {
    title: 'Inicio',
    url: '/admin',
    icon: HomeIcon,
    isActive: false,
    roles: [ROL.DUENO, ROL.PLAYERO]
  },
  {
    title: 'Playas',
    url: '/admin/playas',
    icon: SquareParking,
    isActive: false,
    roles: [ROL.DUENO]
  },
  {
    title: 'Playeros',
    url: '/admin/playeros',
    icon: Users,
    isActive: false,
    roles: [ROL.DUENO]
  },
  {
    title: 'Abonos',
    url: '/admin/abonos',
    icon: CalendarIcon,
    isActive: false,
    roles: [ROL.DUENO]
  },
  {
    title: 'Abonados',
    url: '/admin/abonados',
    icon: UserStar,
    isActive: false,
    roles: [ROL.DUENO]
  }
]

export const playaActual: SidebarItem[] = [
  {
    title: 'Turnos',
    url: '/admin/turnos',
    icon: Clock,
    isActive: false,
    roles: [ROL.PLAYERO]
  },
  {
    title: 'Ocupaciones',
    url: '/admin/ocupaciones',
    icon: ParkingCircle,
    isActive: false,
    roles: [ROL.PLAYERO]
  },
  {
    title: 'Abonos',
    url: '/admin/abonos',
    icon: CalendarIcon,
    isActive: false,
    roles: [ROL.PLAYERO]
  },
  {
    title: 'Abonados',
    url: '/admin/abonados',
    icon: UserStar,
    isActive: false,
    roles: [ROL.PLAYERO]
  },
  {
    title: 'Tipos de plaza',
    url: '/admin/tipos-plaza',
    icon: Shapes,
    isActive: false,
    roles: [ROL.DUENO, ROL.PLAYERO]
  },
  {
    title: 'Plazas',
    url: '/admin/plazas',
    icon: LandPlot,
    isActive: false,
    roles: [ROL.DUENO, ROL.PLAYERO]
  },
  {
    title: 'Modalidades',
    url: '/admin/modalidades-ocupacion',
    icon: Clock,
    isActive: false,
    roles: [ROL.DUENO, ROL.PLAYERO]
  },
  {
    title: 'Métodos de pago',
    url: '/admin/metodos-pago',
    icon: CreditCard,
    isActive: false,
    roles: [ROL.DUENO, ROL.PLAYERO]
  },
  {
    title: 'Tipos de vehículo',
    url: '/admin/tipos-vehiculo',
    icon: CarFront,
    isActive: false,
    roles: [ROL.DUENO, ROL.PLAYERO]
  },
  {
    title: 'Tarifas',
    url: '/admin/tarifas',
    icon: DollarSign,
    isActive: false,
    roles: [ROL.DUENO, ROL.PLAYERO]
  },
  {
    title: 'Plazas',
    url: '/admin/plazas/estado', // Esta es la nueva ruta
    icon: LandPlot,
    isActive: false,
    roles: [ROL.PLAYERO]
  }
]
