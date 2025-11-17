'use client'

import AbonadosTableContainer from '@/app/admin/abonados/components/shared/AbonadosTableContainer'
import getColumns from '@/app/admin/abonados/components/TableContainer/Columns'
import { DataTable } from '@/components/ui'

import { PageParams } from '../../page'
import ToolbarContainer from '../ToolbarContainer'

export { type TableData } from '@/app/admin/abonados/components/shared/AbonadosTableContainer'

export default function TableContainer({
  params
}: {
  params: Partial<PageParams>
}) {
  const columns = getColumns()

  return (
    <AbonadosTableContainer params={params} filterByPlaya={true}>
      {({ abonados, pagination }) => (
        <>
          <ToolbarContainer params={params} />
          <DataTable
            data={abonados}
            columns={columns}
            pagination={pagination}
          />
        </>
      )}
    </AbonadosTableContainer>
  )
}
