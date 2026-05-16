import { useEffect, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Stat } from '@/components/Stat'
import { db } from '@/db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { dashboardStats, type DashboardStats } from '@/features/stats/aggregates'
import { formatShortDate, round1 } from '@/lib/format'

export function HomeScreen() {
  const [, navigate] = useLocation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const trainingsCount = useLiveQuery(() => db.trainings.count(), [])
  const lastTrainings = useLiveQuery(
    async () =>
      db.trainings.orderBy('date').reverse().limit(3).toArray(),
    [],
  )

  useEffect(() => {
    let cancelled = false
    dashboardStats().then((s) => {
      if (!cancelled) setStats(s)
    })
    return () => {
      cancelled = true
    }
  }, [trainingsCount])

  return (
    <AppShell title="Стрельба">
      <div className="p-4 space-y-4">
        <Button
          full
          size="lg"
          onClick={() => navigate('/training/new')}
          className="shadow-lg"
        >
          + Новая тренировка
        </Button>

        {stats && (
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="Выстрелов за 7д"
              value={String(stats.shotsLast7d)}
              sub={`${stats.trainingsLast7d} тренировок`}
            />
            <Stat
              label="Средний за 30д"
              value={stats.shotsLast30d > 0 ? round1(stats.avgPerArrowLast30d) : '—'}
              sub={`${stats.shotsLast30d} выстрелов`}
            />
          </div>
        )}

        <section>
          <h2 className="text-sm font-semibold text-muted mb-2 px-1">Последние</h2>
          <div className="space-y-2">
            {lastTrainings && lastTrainings.length === 0 && (
              <Card className="text-center text-muted">
                Ещё нет тренировок. Жми «+ Новая тренировка», чтобы начать.
              </Card>
            )}
            {lastTrainings?.map((t) => (
              <Link key={t.id} href={`/training/${t.id}`}>
                <Card className="active:bg-elev cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{formatShortDate(t.date)}</div>
                      {t.goal && (
                        <div className="text-xs text-muted truncate max-w-[200px]">
                          {t.goal}
                        </div>
                      )}
                    </div>
                    <div className="text-muted text-2xl">›</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
