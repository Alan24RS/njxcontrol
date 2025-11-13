import { ReactNode } from 'react'

export interface StepProps {
  title: string
  children: ReactNode
  description?: string
  label?: string
}

export default function Step({ title, children, description }: StepProps) {
  return (
    <>
      <div>
        <h3 className="text-foreground mb-2 text-xl font-bold">{title}</h3>
        {description && (
          <p className="text-foreground mb-6 text-sm">{description}</p>
        )}
      </div>
      {children}
    </>
  )
}
