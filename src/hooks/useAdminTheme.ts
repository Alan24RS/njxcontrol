'use client'

import { useTheme } from 'next-themes'

export function useAdminTheme() {
  const { setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const isDark = resolvedTheme === 'dark'

  return {
    theme: resolvedTheme,
    setTheme,
    toggleTheme,
    isDark
  }
}
