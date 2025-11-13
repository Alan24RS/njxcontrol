'use client'

import { DataTable } from '@/components/ui/DataTable'
import type { Playa } from '@/services/playas/types'
import type { Pagination } from '@/types/api'

import getColumns from './Columns'

interface ColumnsProviderProps {
  data: Playa[]
  pagination: Pagination
}

export default function ColumnsProvider({
  data,
  pagination
}: ColumnsProviderProps) {
  const columns = getColumns()

  return <DataTable data={data} pagination={pagination} columns={columns} />
}
