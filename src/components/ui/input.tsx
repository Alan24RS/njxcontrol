'use client'
import * as React from 'react'
import { KeyboardEvent, ReactNode, useState } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export const inputVariants = cva(
  cn(
    'border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
  ),
  {
    variants: {
      variant: {
        default: '',
        auth: 'bg-gray-700 border-gray-700 placeholder:text-gray-400 focus-visible:ring-gray-400 autofill:shadow-[inset_0_0_0px_1000px_rgb(161,161,170)]'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export interface InputProps
  extends React.ComponentProps<'input'>,
    VariantProps<typeof inputVariants> {
  icon?: ReactNode
  rightIcon?: ReactNode
  name: string
  onlyIntegers?: boolean
}

function Input({
  className,
  type,
  variant,
  icon,
  rightIcon,
  onlyIntegers,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const toggleVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (onlyIntegers && !/[0-9]/.test(event.key)) {
      event.preventDefault()
    }
  }

  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 top-[55%] left-3 -translate-y-[55%] transform">
          {icon}
        </div>
      )}
      <input
        type={showPassword ? 'text' : type}
        onKeyUp={handleKeyPress}
        data-slot="input"
        className={cn(
          inputVariants({ variant, className }),
          icon ? 'pl-8' : '',
          rightIcon || type === 'password' ? 'pr-8' : ''
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute inset-y-0 top-[50%] right-3 flex -translate-y-[50%] transform items-center justify-center">
          {rightIcon}
        </div>
      )}
      {type === 'password' && (
        <button
          type="button"
          className="hover:bg-accent absolute inset-y-0 top-[50%] right-3 flex h-6 w-6 -translate-y-[50%] transform items-center justify-center rounded-full border-none bg-transparent p-1 duration-100"
          onClick={toggleVisibility}
        >
          {showPassword ? (
            <EyeIcon className="h-4 w-4" />
          ) : (
            <EyeOffIcon className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  )
}

export { Input }
