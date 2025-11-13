'use client'

import { createContext } from 'react'

interface PageScrollContextType {
  scrollToTop: () => void
}

export const PageScrollContext = createContext<PageScrollContextType>({
  scrollToTop: () => {}
})
