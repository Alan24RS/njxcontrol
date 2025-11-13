import { getPlayas } from '@/services/playas'
import type { Playa } from '@/services/playas/types'
import type { Pagination } from '@/types/api'

import { PageParams } from '../../page'

import ColumnsProvider from './ColumnsProvider'

export type TableData = {
  data: Playa[]
  pagination: Pagination
}

export default async function TableContainer({
  params
}: {
  params: Partial<PageParams>
}) {
  const { data, error, pagination } = await getPlayas(params)

  if (error || !data || !pagination) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Hubo un problema</h3>
          <p className="text-muted-foreground">
            {error ||
              'Intente nuevamente o comuníquese con el area de sistemas'}
          </p>
        </div>
      </div>
    )
  }

  return <ColumnsProvider data={data} pagination={pagination} />
}
