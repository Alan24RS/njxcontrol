import { ReactNode } from 'react'

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui'

export default function FilterContainer({
  title,
  lastItem,
  children,
  checked,
  open = false
}: {
  title: string
  lastItem?: boolean
  children: ReactNode
  checked?: string[]
  open?: boolean
}) {
  return (
    <AccordionItem
      value={title}
      className={`w-full px-2 ${lastItem ? 'border-none' : ''}`}
    >
      <AccordionTrigger
        className={`group flex h-full items-center text-sm hover:no-underline ${lastItem ? 'min-h-[50px] pt-1 pb-0' : 'min-h-[54px] py-2'}`}
      >
        <div className="flex flex-col items-start">
          <span className="group-hover:underline">{title}</span>
          {!open && checked && checked.length > 0 && (
            <span className="text-primary text-xs">{checked.join(', ')}</span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="w-full px-0">{children}</AccordionContent>
    </AccordionItem>
  )
}
