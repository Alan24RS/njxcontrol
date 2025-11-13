'use client'

import { DataTable } from '@/components/ui/DataTable'
import { Role } from '@/constants/rol'

import type { TableData } from '..'
import getColumns from '../Columns'

export default function ColumnProvider({
  data,
  pagination,
  roles
}: TableData & { roles: Role[] }) {
  const columns = getColumns({ roles })
  return <DataTable data={data} pagination={pagination} columns={columns} />
}
