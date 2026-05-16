interface Props {
  label: string
  value: string
  sub?: string
}

export function Stat({ label, value, sub }: Props) {
  return (
    <div className="rounded-2xl bg-surface border border-border px-4 py-3">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  )
}
