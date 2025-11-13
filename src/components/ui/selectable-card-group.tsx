'use client'

import * as React from 'react'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const POSITIONS = {
  left: {
    indicator: 'left-3 top-1/2 -translate-y-1/2',
    container: 'pl-6'
  },
  right: {
    indicator: 'right-3 top-1/2 -translate-y-1/2',
    container: 'pr-6'
  },
  leftTop: {
    indicator: 'left-3 top-3',
    container: 'pl-6'
  },
  rightTop: {
    indicator: 'right-3 top-3',
    container: 'pr-6'
  },
  leftBottom: {
    indicator: 'left-3 bottom-3',
    container: 'pl-6'
  },
  rightBottom: {
    indicator: 'right-3 bottom-3',
    container: 'pr-6'
  }
} as const

type PositionKey = keyof typeof POSITIONS
type SelectionMode = 'single' | 'multiple'
type ValueType = string | number
type SingleValue = ValueType
type MultipleValue = ValueType[]

const toStringValue = (value: ValueType): string => String(value)

const RadioIndicator = ({ position }: { position: string }) => (
  <div
    className={cn(
      'border-muted-foreground absolute h-3 w-3 rounded-full border bg-transparent',
      'group-data-[state=checked]:border-primary group-data-[state=checked]:ring-primary group-data-[state=checked]:bg-white group-data-[state=checked]:ring-[0.5px]',
      position
    )}
  >
    <div className="bg-primary absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-data-[state=checked]:opacity-100" />
  </div>
)

const CheckboxIndicator = ({
  position,
  checked
}: {
  position: string
  checked: boolean
}) => (
  <div
    className={cn(
      'border-input pointer-events-none absolute size-4 shrink-0 rounded-[4px] border shadow-xs transition-colors',
      checked && 'bg-primary text-primary-foreground border-primary',
      position
    )}
  >
    {checked && (
      <div className="flex h-full w-full items-center justify-center text-current">
        <CheckIcon className="size-3.5" />
      </div>
    )}
  </div>
)

interface SelectableCardGroupContextValue {
  mode: SelectionMode
  value?: SingleValue | MultipleValue
  onValueChange?: (value: SingleValue | MultipleValue) => void
}

const SelectableCardGroupContext =
  React.createContext<SelectableCardGroupContextValue>({
    mode: 'single'
  })

interface SelectableCardGroupProps {
  mode?: SelectionMode
  value?: SingleValue | MultipleValue
  onValueChange?: (value: SingleValue | MultipleValue) => void
  className?: string
  children: React.ReactNode
}

const SelectableCardGroup = React.forwardRef<
  HTMLDivElement,
  SelectableCardGroupProps
>(
  (
    { className, mode = 'single', value, onValueChange, children, ...props },
    ref
  ) => {
    if (mode === 'single') {
      const stringValue =
        value != null ? toStringValue(value as SingleValue) : undefined

      const handleChange = (newValue: string) => {
        if (!onValueChange) return
        const originalValue = value
        if (typeof originalValue === 'number') {
          onValueChange(Number(newValue))
        } else {
          onValueChange(newValue)
        }
      }

      return (
        <SelectableCardGroupContext.Provider
          value={{ mode, value: value as SingleValue, onValueChange }}
        >
          <RadioGroupPrimitive.Root
            className={cn('flex gap-4', className)}
            value={stringValue}
            onValueChange={handleChange}
            ref={ref as React.Ref<HTMLDivElement>}
            {...props}
          >
            {children}
          </RadioGroupPrimitive.Root>
        </SelectableCardGroupContext.Provider>
      )
    }

    return (
      <SelectableCardGroupContext.Provider
        value={{ mode, value: value as MultipleValue, onValueChange }}
      >
        <div className={cn('flex gap-5', className)} ref={ref} {...props}>
          {children}
        </div>
      </SelectableCardGroupContext.Provider>
    )
  }
)
SelectableCardGroup.displayName = 'SelectableCardGroup'

interface SelectableCardItemProps {
  value: ValueType
  position?: PositionKey
  className?: string
  disabled?: boolean
  children: React.ReactNode
}

const SelectableCardItem = React.forwardRef<
  HTMLButtonElement | HTMLDivElement,
  SelectableCardItemProps
>(
  (
    { className, position = 'left', children, value, disabled, ...props },
    ref
  ) => {
    const context = React.useContext(SelectableCardGroupContext)
    const { mode } = context
    const stringValue = toStringValue(value)

    if (mode === 'single') {
      return (
        <RadioGroupPrimitive.Item
          ref={ref as React.Ref<HTMLButtonElement>}
          value={stringValue}
          disabled={disabled}
          className={cn(
            'group',
            'focus-visible:ring-ring data-[state=checked]:bg-background data-[state=checked]:border-primary relative rounded-md border px-3 py-2 text-left focus:outline-none focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          <RadioIndicator position={POSITIONS[position].indicator} />
          <div
            className={cn(
              'flex flex-col justify-center',
              POSITIONS[position].container
            )}
          >
            {children}
          </div>
        </RadioGroupPrimitive.Item>
      )
    }

    const currentValue = (context.value as MultipleValue) || []
    const isChecked = currentValue.some((v) => toStringValue(v) === stringValue)

    const handleClick = () => {
      if (disabled) return

      const newValue = isChecked
        ? currentValue.filter((v) => toStringValue(v) !== stringValue)
        : [...currentValue, value]

      context.onValueChange?.(newValue)
    }

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        onClick={handleClick}
        role="checkbox"
        aria-checked={isChecked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        className={cn(
          'group cursor-pointer',
          'focus-visible:ring-ring relative rounded-md border px-3 py-2 text-left focus:outline-none focus-visible:ring-offset-2',
          isChecked && 'bg-background border-primary',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        {...props}
      >
        <CheckboxIndicator
          position={POSITIONS[position].indicator}
          checked={isChecked}
        />
        <div
          className={cn(
            'flex flex-col justify-center',
            POSITIONS[position].container
          )}
        >
          {children}
        </div>
      </div>
    )
  }
)
SelectableCardItem.displayName = 'SelectableCardItem'

export { SelectableCardGroup, SelectableCardItem }
export type {
  MultipleValue,
  PositionKey,
  SelectionMode,
  SingleValue,
  ValueType
}
