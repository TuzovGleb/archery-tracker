import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/Card'
import type { ShotDistributionBucket, VolumeBucket } from './aggregates'

interface Props {
  volume: VolumeBucket[]
  distribution: ShotDistributionBucket[]
}

export default function Charts({ volume, distribution }: Props) {
  const accent = 'rgb(var(--accent))'
  const muted = 'rgb(var(--muted))'
  const border = 'rgb(var(--border))'

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-xs text-muted mb-2 uppercase tracking-wide">Объём за 30 дней</div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={volume} margin={{ left: -20, right: 5, top: 5, bottom: 0 }}>
              <CartesianGrid stroke={border} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(5)}
                stroke={muted}
                fontSize={10}
                interval={3}
              />
              <YAxis stroke={muted} fontSize={10} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'rgb(var(--surface))', border: `1px solid ${border}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: muted }}
              />
              <Line dataKey="shots" stroke={accent} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="text-xs text-muted mb-2 uppercase tracking-wide">
          Распределение очков (последние ~500 стрел)
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} margin={{ left: -20, right: 5, top: 5, bottom: 0 }}>
              <CartesianGrid stroke={border} strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke={muted} fontSize={10} />
              <YAxis stroke={muted} fontSize={10} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'rgb(var(--surface))', border: `1px solid ${border}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: muted }}
              />
              <Bar dataKey="count" fill={accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
