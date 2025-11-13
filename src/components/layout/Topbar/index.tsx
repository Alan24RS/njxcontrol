import { Link } from 'next-view-transitions'

import { Isologo } from '@/assets/institutional/Isologo'
import { ThemeToggle } from '@/components/ui'

export function Topbar() {
  return (
    <header className="bg-background/70 border-border/20 supports-backdrop-filter:bg-background/60 fixed top-0 right-0 left-0 z-50 border-b shadow-sm backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-foreground hover:text-primary flex items-center gap-2 text-2xl font-bold transition-colors duration-200"
          >
            <Isologo className="size-6" />
            <span className="text-2xl font-bold">Valet</span>
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
