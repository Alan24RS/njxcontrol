'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { MouseEvent } from 'react'

export interface IQueryParams {
  name: string
  value?: string | string[]
}

export default function useQueryParams() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const actualParams = new URLSearchParams(searchParams.toString())
  const actualPath = `${pathname}?${actualParams.toString()}`
  const { push } = router

  const setParams = ({
    name,
    value,
    newParams
  }: IQueryParams & { newParams: URLSearchParams }) => {
    newParams.delete(name)
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((item) => newParams.append(name, item))
      } else {
        newParams.set(name, value)
      }
    } else {
      newParams.delete(name)
    }
  }

  const generateURLParams = (queryParams: IQueryParams | IQueryParams[]) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (Array.isArray(queryParams)) {
      queryParams.forEach((parameter) => {
        setParams({ ...parameter, newParams })
      })
    } else {
      setParams({ ...queryParams, newParams })
    }

    return `${pathname}?${newParams.toString()}`
  }

  const handleParamsChange = (
    queryParams: IQueryParams | IQueryParams[],
    method: 'push' | 'replace' | undefined = 'push'
  ) => {
    const newURL = generateURLParams(queryParams)

    if (method === 'replace') {
      router.replace(newURL, { scroll: false })
    } else {
      router[method](newURL)
    }
  }

  const parseSortEntry = (
    sortEntry: string
  ): {
    column: string
    direction: 'asc' | 'desc' | undefined
  } => {
    const [column, direction] = sortEntry
      .split(' ')
      .map((s) => s.trim())
      .filter(Boolean)

    return {
      column,
      direction:
        direction === 'asc' || direction === 'desc' ? direction : undefined
    }
  }

  const nextSortDirection = (
    currentDirection: 'asc' | 'desc' | undefined,
    defaultDirection: 'asc' | 'desc'
  ): 'asc' | 'desc' | null => {
    if (!currentDirection) {
      return defaultDirection
    }

    if (currentDirection === defaultDirection) {
      return defaultDirection === 'asc' ? 'desc' : 'asc'
    }

    return null
  }

  const handleSortParams = (
    sortName: string,
    event?: Pick<MouseEvent, 'shiftKey' | 'metaKey' | 'ctrlKey'>
  ) => {
    const allowMultiSort = Boolean(
      event?.shiftKey || event?.metaKey || event?.ctrlKey
    )

    const currentSorts = searchParams.getAll('sortBy')
    const existingIndex = currentSorts.findIndex((item) => {
      const { column } = parseSortEntry(item)
      return column === sortName
    })
    const existingEntry =
      existingIndex >= 0 ? currentSorts[existingIndex] : undefined
    const { direction: currentDirection } = existingEntry
      ? parseSortEntry(existingEntry)
      : { direction: undefined }

    const defaultDir: 'asc' | 'desc' =
      sortName === 'fecha_creacion' ? 'desc' : 'asc'
    const nextDirection = nextSortDirection(currentDirection, defaultDir)

    const updatedSorts = allowMultiSort ? [...currentSorts] : []

    if (existingIndex >= 0) {
      updatedSorts.splice(existingIndex, 1)
    }

    if (nextDirection) {
      updatedSorts.push(`${sortName} ${nextDirection}`)
    }

    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete('sortBy')
    updatedSorts.forEach((value) => {
      newParams.append('sortBy', value)
    })

    setParams({ name: 'page', value: '1', newParams })

    push(`${pathname}?${newParams.toString()}`)
  }

  return {
    searchParams,
    handleParamsChange,
    handleSortParams,
    actualPath,
    generateURLParams
  }
}
