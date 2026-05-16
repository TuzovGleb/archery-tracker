import { cn } from '@/lib/cn'
import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className, children, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={cn(
        'rounded-2xl bg-surface border border-border p-4 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}
