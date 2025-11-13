'use client'

import { PageScrollContext } from './context'

export const PageScrollProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PageScrollContext.Provider value={{ scrollToTop }}>
      {children}
    </PageScrollContext.Provider>
  )
}
