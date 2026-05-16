import { db } from '@/db/schema'
import type { End, Shot, Training } from '@/db/types'

export interface TrainingAggregate {
  training: Training
  totalShots: number
  totalSum: number
  totalX: number
  totalM: number
  avgPerArrow: number
  distances: number[]
}

export async function aggregateTraining(trainingId: string): Promise<TrainingAggregate | null> {
  const training = await db.trainings.get(trainingId)
  if (!training) return null
  const blocks = await db.blocks.where('trainingId').equals(trainingId).toArray()
  const blockIds = blocks.map((b) => b.id)
  const ends = blockIds.length ? await db.ends.where('blockId').anyOf(blockIds).toArray() : []
  let totalShots = 0
  let totalSum = 0
  let totalX = 0
  let totalM = 0
  for (const e of ends) {
    totalShots += e.count
    totalSum += e.sum
    totalX += e.xCount
    totalM += e.mCount
  }
  const distances = [...new Set(blocks.map((b) => b.distanceM))].sort((a, b) => a - b)
  return {
    training,
    totalShots,
    totalSum,
    totalX,
    totalM,
    avgPerArrow: totalShots > 0 ? totalSum / totalShots : 0,
    distances,
  }
}

export interface DashboardStats {
  shotsLast7d: number
  shotsLast30d: number
  avgPerArrowLast30d: number
  trainingsLast7d: number
  totalTrainings: number
  lastTraining?: TrainingAggregate
}

export async function dashboardStats(): Promise<DashboardStats> {
  const all = await db.trainings.orderBy('date').reverse().toArray()
  const total = all.length
  const today = new Date()
  const d7 = new Date(today)
  d7.setDate(d7.getDate() - 7)
  const d30 = new Date(today)
  d30.setDate(d30.getDate() - 30)
  const trainings7 = all.filter((t) => new Date(t.date) >= d7)
  const trainings30 = all.filter((t) => new Date(t.date) >= d30)

  const sumStats = async (ts: Training[]) => {
    if (ts.length === 0) return { shots: 0, sum: 0 }
    const blocks = await db.blocks.where('trainingId').anyOf(ts.map((t) => t.id)).toArray()
    const ends = blocks.length ? await db.ends.where('blockId').anyOf(blocks.map((b) => b.id)).toArray() : []
    let shots = 0
    let sum = 0
    for (const e of ends) {
      shots += e.count
      sum += e.sum
    }
    return { shots, sum }
  }

  const s7 = await sumStats(trainings7)
  const s30 = await sumStats(trainings30)

  let last: TrainingAggregate | undefined
  if (all.length > 0) {
    const a = await aggregateTraining(all[0].id)
    if (a) last = a
  }

  return {
    shotsLast7d: s7.shots,
    shotsLast30d: s30.shots,
    avgPerArrowLast30d: s30.shots > 0 ? s30.sum / s30.shots : 0,
    trainingsLast7d: trainings7.length,
    totalTrainings: total,
    lastTraining: last,
  }
}

export interface ShotDistributionBucket {
  label: string
  count: number
}

export async function shotDistribution(limit = 50): Promise<ShotDistributionBucket[]> {
  const allEnds = await db.ends.toArray()
  allEnds.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
  const ends = allEnds.slice(0, limit * 10)
  const endIds = ends.map((e) => e.id)
  const shots: Shot[] = endIds.length ? await db.shots.where('endId').anyOf(endIds).toArray() : []
  const buckets: Record<string, number> = {
    M: 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0, X: 0,
  }
  for (const s of shots) {
    if (s.isM) buckets.M++
    else if (s.isX) buckets.X++
    else buckets[String(s.score)]++
  }
  return ['M', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'X'].map((label) => ({
    label,
    count: buckets[label] ?? 0,
  }))
}

export interface VolumeBucket {
  date: string
  shots: number
}

export async function shotVolumeLastDays(days: number): Promise<VolumeBucket[]> {
  const today = new Date()
  const result: VolumeBucket[] = []
  const map = new Map<string, number>()

  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (days - 1))
  const startStr = startDate.toISOString().slice(0, 10)
  const trainings = await db.trainings.where('date').aboveOrEqual(startStr).toArray()
  if (trainings.length === 0) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      result.push({ date: d.toISOString().slice(0, 10), shots: 0 })
    }
    return result
  }
  const blocks = await db.blocks.where('trainingId').anyOf(trainings.map((t) => t.id)).toArray()
  const blockToTraining = new Map(blocks.map((b) => [b.id, b.trainingId]))
  const ends: End[] = blocks.length ? await db.ends.where('blockId').anyOf(blocks.map((b) => b.id)).toArray() : []
  const trainingShots = new Map<string, number>()
  for (const e of ends) {
    const tid = blockToTraining.get(e.blockId)
    if (!tid) continue
    trainingShots.set(tid, (trainingShots.get(tid) ?? 0) + e.count)
  }
  for (const t of trainings) {
    map.set(t.date, (map.get(t.date) ?? 0) + (trainingShots.get(t.id) ?? 0))
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, shots: map.get(key) ?? 0 })
  }
  return result
}
