'use client'

import { useEffect, useState } from 'react'

import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAdminTheme } from '@/hooks/useAdminTheme'

interface ThemeToggleProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ThemeToggle({
  variant = 'ghost',
  size = 'icon'
}: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const { isDark, toggleTheme } = useAdminTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant={variant} size={size} disabled aria-label="Cambiar tema">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
