import type { ReactNode } from 'react'
import { Link } from 'wouter'
import { cn } from '@/lib/cn'
import { BottomNav } from './BottomNav'

interface Props {
  title?: string
  back?: string
  right?: ReactNode
  hideNav?: boolean
  children: ReactNode
}

export function AppShell({ title, back, right, hideNav, children }: Props) {
  return (
    <div className="min-h-dvh flex flex-col">
      {(title || back || right) && (
        <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-border pt-safe">
          <div className="h-12 px-3 flex items-center gap-2">
            {back ? (
              <Link href={back} className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted active:bg-elev">
                <span className="text-2xl leading-none">‹</span>
              </Link>
            ) : (
              <span className="w-9" />
            )}
            <h1 className="flex-1 text-base font-semibold truncate">{title}</h1>
            <div className="min-w-9 flex items-center justify-end">{right}</div>
          </div>
        </header>
      )}
      <main className={cn('flex-1', !hideNav && 'pb-20')}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
