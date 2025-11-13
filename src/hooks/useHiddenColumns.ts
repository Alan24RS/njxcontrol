import { useEffect, useState } from 'react'

import { usePathname } from 'next/navigation'

const useHiddenColumns = () => {
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

  return { hiddenColumns, toggleColumnVisibility, isLoaded }
}

export default useHiddenColumns
