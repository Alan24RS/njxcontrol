'use client'

import { useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import { LeavingDialog } from './LeavingDialog'

type PreventNavigationProps = {
  isDirty: boolean
}

export default function PreventNavigation({ isDirty }: PreventNavigationProps) {
  const [leavingPage, setLeavingPage] = useState(false)
  const router = useRouter()

  /**
   * Function that will be called when the user selects `yes` in the confirmation modal,
   * redirected to the selected page.
   */
  const confirmationFn = useRef<() => void>(() => {})

  // Used to make popstate event trigger when back button is clicked.
  // Without this, the popstate event will not fire because it needs there to be a href to return.
  useEffect(() => {
    if (typeof window !== 'undefined' && isDirty) {
      window.history.pushState(null, document.title, window.location.href)
    }
  }, [isDirty])

  useEffect(() => {
    /**
     * Used to prevent navigation when use click in navigation `<Link />` or `<a />`.
     * @param e The triggered event.
     */
    const handleClick = (event: MouseEvent) => {
      const clickedElement = event.target as HTMLElement

      const anchorElement = clickedElement.closest('a') as HTMLAnchorElement

      if (!anchorElement) return

      if (isDirty) {
        event.preventDefault()

        confirmationFn.current = () => {
          router.push(anchorElement.href)
        }

        setLeavingPage(true)
      }
    }
    /* ********************************************************************* */

    /**
     * Used to prevent navigation when use `back` browser buttons.
     */
    const handlePopState = () => {
      if (isDirty) {
        confirmationFn.current = () => {
          window.history.go(-1) // Usar window.history.go(-1) para redirigir manualmente
        }

        setLeavingPage(true)
      } else {
        window.history.go(-1)
      }
    }
    /* ********************************************************************* */

    /**
     * Used to prevent navigation when reload page or navigate to another page, in different origin.
     * @param e The triggered event.
     */
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
      }
    }
    /* ********************************************************************* */

    /* *************************** Open listeners ************************** */
    document.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', handleClick)
    })
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleBeforeUnload)

    /* ************** Return from useEffect closing listeners ************** */
    return () => {
      document.querySelectorAll('a').forEach((link) => {
        link.removeEventListener('click', handleClick)
      })
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty])

  return (
    <LeavingDialog
      isOpen={leavingPage}
      noCallback={() => {
        setLeavingPage(false)
        confirmationFn.current = () => {}
      }}
      yesCallback={() => {
        confirmationFn.current()
        confirmationFn.current = () => {}
      }}
    />
  )
}
