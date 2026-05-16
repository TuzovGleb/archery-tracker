import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { db } from '@/db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { createEnd, deleteEnd, setShots, type ShotInput } from '@/db/repo'
import type { ArrowsPerEnd } from '@/db/types'
import { cn } from '@/lib/cn'
import { tap } from '@/lib/haptic'
import { WakeLock } from './WakeLock'

interface Props {
  trainingId: string
  endId: string
}

interface DraftShot {
  score: number
  isX: boolean
  isM: boolean
}

const KEYS: Array<{ label: string; build: () => DraftShot | null }> = [
  { label: 'M', build: () => ({ score: 0, isX: false, isM: true }) },
  { label: '1', build: () => ({ score: 1, isX: false, isM: false }) },
  { label: '2', build: () => ({ score: 2, isX: false, isM: false }) },
  { label: '3', build: () => ({ score: 3, isX: false, isM: false }) },
  { label: '4', build: () => ({ score: 4, isX: false, isM: false }) },
  { label: '5', build: () => ({ score: 5, isX: false, isM: false }) },
  { label: '6', build: () => ({ score: 6, isX: false, isM: false }) },
  { label: '7', build: () => ({ score: 7, isX: false, isM: false }) },
  { label: '8', build: () => ({ score: 8, isX: false, isM: false }) },
  { label: '9', build: () => ({ score: 9, isX: false, isM: false }) },
  { label: '10', build: () => ({ score: 10, isX: false, isM: false }) },
  { label: 'X', build: () => ({ score: 10, isX: true, isM: false }) },
]

function shotLabel(s: DraftShot): string {
  if (s.isM) return 'M'
  if (s.isX) return 'X'
  return String(s.score)
}

function shotColor(s: DraftShot): string {
  if (s.isM) return 'bg-bad/15 text-bad border-bad/40'
  if (s.isX) return 'bg-good/20 text-good border-good/50'
  if (s.score >= 9) return 'bg-good/10 text-good border-good/30'
  if (s.score >= 6) return 'bg-warn/10 text-warn border-warn/30'
  if (s.score >= 1) return 'bg-elev text-fg border-border'
  return 'bg-elev text-muted border-border'
}

export function EndLoggerScreen({ trainingId, endId }: Props) {
  const [, navigate] = useLocation()
  const end = useLiveQuery(() => db.ends.get(endId), [endId])
  const block = useLiveQuery(async () => {
    if (!end) return undefined
    return db.blocks.get(end.blockId)
  }, [end?.blockId])
  const existingShots = useLiveQuery(
    () =>
      db.shots
        .where('endId')
        .equals(endId)
        .sortBy('orderIdx'),
    [endId],
  )

  const [draft, setDraft] = useState<DraftShot[]>([])
  const [cursor, setCursor] = useState(0)
  const [autoNext, setAutoNext] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const draftRef = useRef(draft)
  draftRef.current = draft

  // Cleanup: if user navigates away with an empty end, drop it.
  useEffect(() => {
    return () => {
      if (draftRef.current.length === 0) {
        deleteEnd(endId).catch(() => {})
      }
    }
  }, [endId])

  useEffect(() => {
    if (existingShots && !hydrated) {
      setDraft(
        existingShots.map((s) => ({
          score: s.score,
          isX: s.isX,
          isM: s.isM,
        })),
      )
      setCursor(existingShots.length)
      setHydrated(true)
    }
  }, [existingShots, hydrated])

  const persist = useMemo(
    () =>
      async (shots: DraftShot[]) => {
        const rows: ShotInput[] = shots.map((s) => ({
          score: s.score,
          isX: s.isX,
          isM: s.isM,
        }))
        await setShots(endId, rows)
      },
    [endId],
  )

  if (!end || !block) {
    return (
      <AppShell title="…" back={`/training/${trainingId}`} hideNav>
        <div className="p-4 text-muted">Загрузка…</div>
      </AppShell>
    )
  }

  const arrowsPerEnd = end.arrowsPerEnd as ArrowsPerEnd
  const isFull = draft.length >= arrowsPerEnd
  const sum = draft.reduce((a, s) => a + s.score, 0)
  const xCount = draft.filter((s) => s.isX).length

  const handleKey = async (i: number) => {
    const built = KEYS[i].build()
    if (!built) return
    const insertAt = Math.min(cursor, arrowsPerEnd - 1)
    const next = draft.slice()
    if (insertAt < next.length) {
      next[insertAt] = built
    } else {
      while (next.length < insertAt) {
        next.push({ score: 0, isX: false, isM: true })
      }
      next.push(built)
    }
    if (next.length > arrowsPerEnd) next.length = arrowsPerEnd
    setDraft(next)
    const newCursor = Math.min(insertAt + 1, arrowsPerEnd)
    setCursor(newCursor)
    tap(8)
    await persist(next)
  }

  const removeShotAt = async (idx: number) => {
    if (idx >= draft.length) return
    const next = draft.slice(0, idx).concat(draft.slice(idx + 1))
    setDraft(next)
    setCursor(Math.min(idx, next.length))
    tap(15)
    await persist(next)
  }

  const handleSaveAndNext = async () => {
    await persist(draft)
    if (autoNext) {
      const newEnd = await createEnd({ blockId: block.id, arrowsPerEnd })
      navigate(`/training/${trainingId}/end/${newEnd.id}`, { replace: true })
    } else {
      navigate(`/training/${trainingId}`)
    }
  }

  return (
    <AppShell
      title={`${block.distanceM} м · серия ${end.orderIdx + 1}`}
      back={`/training/${trainingId}`}
      hideNav
    >
      <WakeLock />

      <div className="px-4 pt-3 pb-2 sticky top-12 bg-bg z-10">
        <div className="flex items-baseline justify-between">
          <div className="text-sm text-muted">
            Стрела {Math.min(cursor + 1, arrowsPerEnd)}/{arrowsPerEnd}
          </div>
          <div className="text-sm tabular-nums">
            <span className="font-semibold text-fg">{sum}</span>
            <span className="text-muted"> · {xCount}X</span>
          </div>
        </div>

        <div
          className={cn(
            'mt-2 grid gap-1.5',
            arrowsPerEnd === 6 ? 'grid-cols-6' : 'grid-cols-3',
          )}
        >
          {Array.from({ length: arrowsPerEnd }).map((_, i) => {
            const s = draft[i]
            const isCursor = i === cursor
            return (
              <button
                key={i}
                onClick={() => setCursor(i)}
                onDoubleClick={() => removeShotAt(i)}
                className={cn(
                  'h-12 rounded-xl border-2 text-base font-semibold tabular-nums flex items-center justify-center',
                  s ? shotColor(s) : 'bg-elev/40 text-muted border-dashed border-border',
                  isCursor && 'ring-2 ring-accent ring-offset-2 ring-offset-bg',
                )}
              >
                {s ? shotLabel(s) : '·'}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="grid grid-cols-3 gap-2">
          {KEYS.map((k, i) => (
            <button
              key={k.label}
              onClick={() => handleKey(i)}
              disabled={isFull && cursor >= arrowsPerEnd}
              className={cn(
                'h-16 rounded-2xl bg-elev border border-border text-2xl font-semibold tabular-nums active:opacity-70 disabled:opacity-30',
                k.label === 'X' && 'bg-accent/10 text-accent border-accent/30',
                k.label === 'M' && 'bg-bad/10 text-bad border-bad/30',
              )}
            >
              {k.label}
            </button>
          ))}
        </div>

        <label className="flex items-center justify-center gap-2 mt-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={autoNext}
            onChange={(e) => setAutoNext(e.target.checked)}
            className="accent-accent"
          />
          Сразу новая серия после сохранения
        </label>

        <Button
          full
          size="lg"
          className="mt-2"
          onClick={handleSaveAndNext}
          disabled={draft.length === 0}
        >
          {autoNext ? 'Сохранить и далее' : 'Сохранить'}
        </Button>

        <div className="text-center text-xs text-muted mt-3 pb-safe">
          Двойной тап по чипу — удалить выстрел
        </div>
      </div>
    </AppShell>
  )
}
