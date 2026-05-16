import { cn } from '@/lib/cn'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface BaseProps {
  label?: string
  hint?: string
  children?: ReactNode
}

export function Field({ label, hint, children }: BaseProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="text-muted font-medium">{label}</span>}
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return (
    <input
      {...rest}
      className={cn(
        'h-11 rounded-xl bg-elev border border-border px-3 text-base text-fg placeholder:text-muted focus:outline-none focus:border-accent',
        className,
      )}
    />
  )
}

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput type="number" inputMode="decimal" {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props
  return (
    <select
      {...rest}
      className={cn(
        'h-11 rounded-xl bg-elev border border-border px-3 text-base text-fg focus:outline-none focus:border-accent',
        className,
      )}
    >
      {children}
    </select>
  )
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props
  return (
    <textarea
      {...rest}
      className={cn(
        'min-h-[80px] rounded-xl bg-elev border border-border p-3 text-base text-fg placeholder:text-muted focus:outline-none focus:border-accent',
        className,
      )}
    />
  )
}
