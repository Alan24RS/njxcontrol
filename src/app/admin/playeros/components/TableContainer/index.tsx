'use client'

import { DataTable, DataTableToolbar, Spinner } from '@/components/ui'
import type { PlayeroPlaya } from '@/services/playeros/types'
import type { ApiResponse, Pagination } from '@/types/api'
import type { User } from '@/types/auth'

import { PageParams } from '../../page'

import getColumns from './Columns'

export type TableData = {
  data: PlayeroPlaya[]
  pagination: Pagination
}

interface TableContainerProps {
  params: Partial<PageParams>
  user: User
  response?: ApiResponse<PlayeroPlaya[]>
  error?: any
  isLoading: boolean
  isError: boolean
}

export default function TableContainer({
  params: _params,
  user: _user,
  response,
  error,
  isLoading,
  isError
}: TableContainerProps) {
  if (isLoading) {
    return (
      <div className="flex w-full grow items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (isError || error || !response?.data || !response?.pagination) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Hubo un problema</h3>
          <p className="text-muted-foreground">
            {response?.error ||
              'Intente nuevamente o comuníquese con el area de sistemas'}
          </p>
        </div>
      </div>
    )
  }

  const columns = getColumns()

  const availableColumns = columns
    .filter((column) => column.enableHiding !== false)
    .map((column) => ({
      id: column.id || '',
      label: (column.meta || '').toString()
    }))

  return (
    <>
      <DataTableToolbar
        filters={{
          loading: isLoading,
          data: undefined // No filters for now
        }}
        availableColumns={availableColumns}
        search={{
          loading: isLoading,
          placeholder: 'Buscar por nombre o email',
          minLength: 1
        }}
      />
      <DataTable
        data={response.data}
        pagination={response.pagination}
        columns={columns}
      />
    </>
  )
}
