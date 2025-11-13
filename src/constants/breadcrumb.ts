import { general, playaActual } from '@/components/layout/Sidebar/data'

export const customBreadcrumbPaths: Record<string, string> = {
  'tipos-plaza': 'Tipos de plaza',
  'metodos-pago': 'Métodos de pago',
  'modalidades-ocupacion': 'Modalidades de ocupación',
  'tipos-vehiculo': 'Tipos de vehículo'
}

const sidebarPaths = [...general, ...playaActual]

export const breadcrumbPaths: Record<string, string> = {
  ...sidebarPaths.reduce(
    (acc, item) => {
      const key = item.url.replace(/^\//, '').split('?')[0]
      acc[key] = item.title

      if (item.items) {
        item.items.forEach((subItem) => {
          const subKey = subItem.url.replace(/^\//, '').split('?')[0]
          acc[subKey] = subItem.title
        })
      }

      return acc
    },
    {} as Record<string, string>
  ),
  ...customBreadcrumbPaths
}
