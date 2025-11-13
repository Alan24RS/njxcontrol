'use client'

import { createContext, useContext, useEffect, useState } from 'react'

import { usePathname } from 'next/navigation'

interface HiddenColumnsContextType {
  hiddenColumns: string[]
  toggleColumnVisibility: (column: string) => void
  isLoaded: boolean
}

const HiddenColumnsContext = createContext<
  HiddenColumnsContextType | undefined
>(undefined)

export function HiddenColumnsProvider({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedColumns = localStorage.getItem(`hiddenColumns-${pathname}`)
    if (savedColumns) {
      const parsedColumns = JSON.parse(savedColumns)
      setHiddenColumns(parsedColumns)
    }
    setIsLoaded(true)
  }, [pathname])

  const toggleColumnVisibility = (column: string) => {
    setHiddenColumns((prevColumns) => {
      const columnIsHidden = prevColumns.includes(column)
      let newColumns: string[]

      if (columnIsHidden) {
        newColumns = prevColumns.filter((col) => col !== column)
      } else {
        newColumns = [...prevColumns, column]
      }

      localStorage.setItem(
        `hiddenColumns-${pathname}`,
        JSON.stringify(newColumns)
      )

      return newColumns
    })
  }

  return (
    <HiddenColumnsContext.Provider
      value={{ hiddenColumns, toggleColumnVisibility, isLoaded }}
    >
      {children}
    </HiddenColumnsContext.Provider>
  )
}

export function useHiddenColumnsContext() {
  const context = useContext(HiddenColumnsContext)
  if (context === undefined) {
    throw new Error(
      'useHiddenColumnsContext must be used within a HiddenColumnsProvider'
    )
  }
  return context
}
