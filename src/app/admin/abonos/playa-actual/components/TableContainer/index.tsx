'use client'

import AbonosTableContainer from '@/app/admin/abonos/components/shared/AbonosTableContainer'
import { DataTable } from '@/components/ui'

import ToolbarContainer from '../ToolbarContainer'

import getColumns from './Columns'

export { type TableData } from '@/app/admin/abonos/components/shared/AbonosTableContainer'

export default function TableContainer() {
  const columns = getColumns()

  return (
    <AbonosTableContainer filterByPlaya={true}>
      {({ abonos }) => (
        <>
          <ToolbarContainer />
          <DataTable
            data={abonos}
            columns={columns}
            pagination={{
              total: abonos.length,
              lastPage: 1,
              currentPage: 1,
              pageSize: abonos.length
            }}
          />
        </>
      )}
    </AbonosTableContainer>
  )
}
