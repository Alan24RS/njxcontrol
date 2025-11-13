'use client'

import { Checkbox } from '@/components/ui'

export default function FilterCheckbox({
  options,
  selected,
  onChange
}: {
  options: {
    label: string
    value: string | number | boolean
    description?: string
  }[]
  selected: Set<string>
  id: string
  onChange: (payload: { option: string; checked: boolean }) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <div key={option.value.toString()} className="items-top flex space-x-2">
          <Checkbox
            id={option.value.toString()}
            name={option.value.toString()}
            value={option.value.toString()}
            checked={selected.has(option.value.toString())}
            onCheckedChange={(value) => {
              onChange({
                option: option.value.toString(),
                checked: value === true
              })
            }}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor={option.value.toString()}
              className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {option.label}
            </label>
            {option.description && (
              <p className="text-muted-foreground text-sm">
                {option.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
