'use client'

import { useContext } from 'react'

import { PageScrollContext } from './context'

export const usePageScroll = () => {
  const context = useContext(PageScrollContext)
  if (!context) {
    throw new Error(
      'usePageScroll debe ser usado dentro de un PageScrollProvider'
    )
  }
  return context
}
