import { lazy, Suspense, useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/Card'
import { Stat } from '@/components/Stat'
import {
  dashboardStats,
  shotDistribution,
  shotVolumeLastDays,
  type DashboardStats,
  type ShotDistributionBucket,
  type VolumeBucket,
} from './aggregates'
import { round1 } from '@/lib/format'
import { db } from '@/db/schema'
import { useLiveQuery } from 'dexie-react-hooks'

const Charts = lazy(() => import('./Charts'))

export function StatsScreen() {
  const trainingsCount = useLiveQuery(() => db.trainings.count(), [])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [dist, setDist] = useState<ShotDistributionBucket[]>([])
  const [vol, setVol] = useState<VolumeBucket[]>([])

  useEffect(() => {
    let cancel = false
    Promise.all([dashboardStats(), shotDistribution(50), shotVolumeLastDays(30)]).then(
      ([s, d, v]) => {
        if (cancel) return
        setStats(s)
        setDist(d)
        setVol(v)
      },
    )
    return () => {
      cancel = true
    }
  }, [trainingsCount])

  return (
    <AppShell title="Статистика">
      <div className="p-4 space-y-4">
        {!stats || stats.totalTrainings === 0 ? (
          <Card className="text-center text-muted">
            Накопите хотя бы одну тренировку — и здесь появятся графики.
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Тренировок" value={String(stats.totalTrainings)} />
              <Stat label="Стрел / 7д" value={String(stats.shotsLast7d)} />
              <Stat label="Стрел / 30д" value={String(stats.shotsLast30d)} />
              <Stat
                label="Средний / 30д"
                value={stats.shotsLast30d > 0 ? round1(stats.avgPerArrowLast30d) : '—'}
              />
            </div>

            <Suspense fallback={<Card className="text-center text-muted">Графики загружаются…</Card>}>
              <Charts volume={vol} distribution={dist} />
            </Suspense>
          </>
        )}
      </div>
    </AppShell>
  )
}
