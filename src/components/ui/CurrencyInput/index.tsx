'use client'

import { forwardRef } from 'react'
import { NumericFormat } from 'react-number-format'

import { cn } from '@/lib/utils'

export interface CurrencyInputProps {
  value?: number | string
  onValueChange?: (value: number | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  name?: string
  id?: string
  'aria-invalid'?: boolean
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onValueChange,
      placeholder = '$ 0,00',
      disabled,
      className,
      name,
      id,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref
  ) => {
    const displayValue = value === 0 || value === undefined ? '' : value

    return (
      <NumericFormat
        getInputRef={ref}
        name={name}
        id={id}
        value={displayValue}
        onValueChange={(values) => {
          const numericValue = values.floatValue
          onValueChange?.(numericValue)
        }}
        thousandSeparator="."
        decimalSeparator=","
        decimalScale={2}
        fixedDecimalScale
        allowNegative={false}
        prefix="$ "
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className={cn(
          'border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          className
        )}
        {...props}
      />
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput }
