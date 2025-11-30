import {
  BarChart3,
  CalendarIcon,
  CarFront,
  ChartBar,
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
    title: 'Analytics',
    url: '/admin/analytics',
    icon: BarChart3,
    isActive: false,
    roles: [ROL.DUENO],
    items: [
      {
        title: 'Informe de Recaudación',
        url: '/admin/analytics/recaudacion'
      },
      {
        title: 'Performance de Playeros',
        url: '/admin/analytics/performance-playero'
      },
      {
        title: 'Abonos Vigentes',
        url: '/admin/reportes'
      },
      {
        title: 'Ocupaciones por Turno',
        url: '/admin/reportes/ocupaciones'
      },
      {
        title: 'Pagos Mensuales',
        url: '/admin/reportes/pagos-mensuales'
      }
    ]
  },
  {
    title: 'Reportes',
    url: '/admin/reportes',
    icon: ChartBar,
    isActive: false,
    roles: [ROL.DUENO],
    items: []
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
    title: 'Reportes',
    url: '/admin/reportes',
    icon: ChartBar,
    isActive: false,
    roles: [ROL.PLAYERO],
    items: [
      {
        title: 'Turno Actual',
        url: '/admin/reportes/turno-actual'
      },
      {
        title: 'Pagos Mensuales',
        url: '/admin/reportes/pagos-mensuales'
      }
    ]
  },
  {
    title: 'Abonos',
    url: '/admin/abonos/playa-actual',
    icon: CalendarIcon,
    isActive: false,
    roles: [ROL.PLAYERO]
  },
  {
    title: 'Abonados',
    url: '/admin/abonados/playa-actual',
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
