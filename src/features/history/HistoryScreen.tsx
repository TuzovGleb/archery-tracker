import { Link } from 'wouter'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/Card'
import { db } from '@/db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { formatDate } from '@/lib/format'

export function HistoryScreen() {
  const trainings = useLiveQuery(
    () => db.trainings.orderBy('date').reverse().toArray(),
    [],
  )
  const allEnds = useLiveQuery(() => db.ends.toArray(), [])
  const allBlocks = useLiveQuery(() => db.blocks.toArray(), [])

  const byTraining = new Map<string, { shots: number; sum: number; x: number }>()
  if (allEnds && allBlocks) {
    const blockToTraining = new Map(allBlocks.map((b) => [b.id, b.trainingId]))
    for (const e of allEnds) {
      const tid = blockToTraining.get(e.blockId)
      if (!tid) continue
      const cur = byTraining.get(tid) ?? { shots: 0, sum: 0, x: 0 }
      cur.shots += e.count
      cur.sum += e.sum
      cur.x += e.xCount
      byTraining.set(tid, cur)
    }
  }

  return (
    <AppShell title="История">
      <div className="p-4 space-y-2">
        {trainings && trainings.length === 0 && (
          <Card className="text-center text-muted">Пока пусто</Card>
        )}
        {trainings?.map((t) => {
          const agg = byTraining.get(t.id)
          return (
            <Link key={t.id} href={`/training/${t.id}`}>
              <Card className="active:bg-elev cursor-pointer">
                <div className="flex items-baseline justify-between">
                  <div className="font-medium">{formatDate(t.date)}</div>
                  <div className="text-sm text-muted tabular-nums">
                    {agg ? `${agg.shots} стр · ${agg.sum} очк` : '—'}
                  </div>
                </div>
                {t.goal && (
                  <div className="text-xs text-muted mt-1 truncate">{t.goal}</div>
                )}
              </Card>
            </Link>
          )
        })}
      </div>
    </AppShell>
  )
}
