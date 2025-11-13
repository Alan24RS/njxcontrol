import { Fragment, useMemo } from 'react'

import { CheckIcon, MoreHorizontal } from 'lucide-react'

import ProgressCircle from './ProgressCircle'

interface ProgressBarProps {
  steps: string[]
  activeStep: number
  goToStep: (step: number) => void
}

type VisibleItem =
  | { type: 'step'; step: string; index: number; hideLabel?: boolean }
  | { type: 'ellipsis'; key: string }

function generateVisibleItems(
  steps: string[],
  activeStep: number
): VisibleItem[] {
  const maxVisibleItems = 5

  if (steps.length <= maxVisibleItems) {
    return steps.map((step, index) => ({ type: 'step', step, index }))
  }

  const result: VisibleItem[] = []
  const lastIndex = steps.length - 1

  if (activeStep <= 1) {
    for (let i = 0; i <= 2; i++) {
      result.push({ type: 'step', step: steps[i], index: i })
    }
    result.push({ type: 'ellipsis', key: 'ellipsis-end' })
    result.push({ type: 'step', step: steps[lastIndex], index: lastIndex })
  } else if (activeStep >= lastIndex - 1) {
    result.push({ type: 'step', step: steps[0], index: 0, hideLabel: true })
    result.push({ type: 'ellipsis', key: 'ellipsis-start' })
    for (let i = lastIndex - 2; i <= lastIndex; i++) {
      result.push({ type: 'step', step: steps[i], index: i })
    }
  } else {
    result.push({ type: 'step', step: steps[0], index: 0, hideLabel: true })
    result.push({ type: 'ellipsis', key: 'ellipsis-start' })
    result.push({ type: 'step', step: steps[activeStep], index: activeStep })
    result.push({ type: 'ellipsis', key: 'ellipsis-end' })
    result.push({ type: 'step', step: steps[lastIndex], index: lastIndex })
  }

  return result
}

function StepComponent({
  step,
  index,
  activeStep,
  goToStep,
  hideLabel = false
}: {
  step: string
  index: number
  activeStep: number
  goToStep: (step: number) => void
  hideLabel?: boolean
}) {
  return (
    <button
      type="button"
      className="group flex flex-shrink-0 items-center gap-2"
      onClick={() => goToStep(index)}
    >
      <div
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
          activeStep === index
            ? 'bg-foreground text-background'
            : index < activeStep
              ? 'bg-green-500'
              : 'bg-muted'
        }`}
      >
        {activeStep > index ? (
          <CheckIcon className="h-3 w-3 text-white" />
        ) : (
          <span className="text-xs leading-none font-bold">{index + 1}</span>
        )}
      </div>
      {!hideLabel && (
        <span
          className={`truncate text-sm font-medium transition-colors duration-200 ${
            activeStep === index
              ? 'text-foreground'
              : index < activeStep
                ? 'text-foreground'
                : 'text-muted-foreground'
          } group-hover:text-foreground`}
        >
          {step}
        </span>
      )}
    </button>
  )
}

function EllipsisComponent() {
  return (
    <div className="text-muted-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center">
      <MoreHorizontal className="h-4 w-4" />
    </div>
  )
}

export default function ProgressBar({
  steps,
  activeStep,
  goToStep
}: ProgressBarProps) {
  const visibleItems = useMemo(
    () => generateVisibleItems(steps, activeStep),
    [steps, activeStep]
  )

  return (
    <>
      <div className="mb-6 hidden w-full items-center justify-start overflow-hidden sm:flex">
        <div className="flex min-w-0 flex-1 items-center">
          {visibleItems.map((item, index) => (
            <Fragment
              key={item.type === 'step' ? `step-${item.index}` : item.key}
            >
              <div className="flex-shrink-0">
                {item.type === 'step' ? (
                  <StepComponent
                    step={item.step}
                    index={item.index}
                    activeStep={activeStep}
                    goToStep={goToStep}
                    hideLabel={item.hideLabel}
                  />
                ) : (
                  <EllipsisComponent />
                )}
              </div>
              {index < visibleItems.length - 1 && (
                <div
                  key={`line-${index}`}
                  className="bg-border relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full"
                >
                  {(() => {
                    const nextItem = visibleItems[index + 1]
                    const shouldShowCompleted =
                      (item.type === 'step' && activeStep > item.index) ||
                      (item.type === 'ellipsis' &&
                        nextItem?.type === 'step' &&
                        activeStep > nextItem.index)

                    return (
                      shouldShowCompleted && (
                        <div
                          className="bg-foreground absolute top-0 bottom-0 left-0 h-full w-full scale-x-100 rounded-full transition-transform duration-200"
                          style={{ transformOrigin: 'left' }}
                        />
                      )
                    )
                  })()}
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="mb-1 flex items-center justify-between gap-2 sm:hidden">
        <ProgressCircle
          stepsCompleted={activeStep + 1}
          totalSteps={steps.length}
          stroke={4}
          radius={30}
        />
        <div className="flex flex-col justify-end gap-1 text-end">
          <span className="text-xl leading-none font-bold">
            {steps[activeStep]}
          </span>
          <span className="text-muted-foreground text-sm leading-none">
            {steps[activeStep + 1]
              ? 'Siguiente: ' + steps[activeStep + 1]
              : 'Finalizar'}
          </span>
        </div>
      </div>
    </>
  )
}
