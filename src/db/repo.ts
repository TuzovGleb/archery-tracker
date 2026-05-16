import { db } from './schema'
import { newId, nowIso, todayIso } from '@/lib/ids'
import type {
  ArrowSet,
  ArrowsPerEnd,
  Bow,
  BowType,
  DistanceBlock,
  End,
  Shot,
  Training,
} from './types'

export async function createBow(input: Partial<Bow> & { type: BowType; name: string }): Promise<Bow> {
  const now = nowIso()
  const row: Bow = {
    id: input.id ?? newId(),
    type: input.type,
    name: input.name.trim(),
    drawWeight: input.drawWeight,
    notes: input.notes,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  }
  await db.bows.put(row)
  return row
}

export async function deleteBow(id: string): Promise<void> {
  await db.bows.delete(id)
}

export async function createArrowSet(input: Partial<ArrowSet> & { name: string }): Promise<ArrowSet> {
  const now = nowIso()
  const row: ArrowSet = {
    id: input.id ?? newId(),
    name: input.name.trim(),
    spine: input.spine,
    length: input.length,
    notes: input.notes,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  }
  await db.arrowSets.put(row)
  return row
}

export async function deleteArrowSet(id: string): Promise<void> {
  await db.arrowSets.delete(id)
}

export interface NewTrainingInput {
  date?: string
  bowId?: string
  arrowSetId?: string
  goal?: string
  initialDistanceM?: number
  initialArrowsPerEnd?: ArrowsPerEnd
}

export async function createTraining(input: NewTrainingInput = {}): Promise<{ training: Training; block: DistanceBlock | null }> {
  const now = nowIso()
  const training: Training = {
    id: newId(),
    date: input.date ?? todayIso(),
    startedAt: now,
    bowId: input.bowId,
    arrowSetId: input.arrowSetId,
    goal: input.goal,
    tags: [],
    updatedAt: now,
  }
  let block: DistanceBlock | null = null
  if (input.initialDistanceM) {
    block = {
      id: newId(),
      trainingId: training.id,
      distanceM: input.initialDistanceM,
      orderIdx: 0,
    }
  }
  await db.transaction('rw', db.trainings, db.blocks, async () => {
    await db.trainings.put(training)
    if (block) await db.blocks.put(block)
  })
  return { training, block }
}

export async function updateTraining(id: string, patch: Partial<Training>): Promise<void> {
  await db.trainings.update(id, { ...patch, updatedAt: nowIso() })
}

export async function deleteTraining(id: string): Promise<void> {
  await db.transaction('rw', db.trainings, db.blocks, db.ends, db.shots, async () => {
    const blocks = await db.blocks.where('trainingId').equals(id).toArray()
    const blockIds = blocks.map((b) => b.id)
    const ends = blockIds.length ? await db.ends.where('blockId').anyOf(blockIds).toArray() : []
    const endIds = ends.map((e) => e.id)
    if (endIds.length) await db.shots.where('endId').anyOf(endIds).delete()
    if (endIds.length) await db.ends.where('id').anyOf(endIds).delete()
    if (blockIds.length) await db.blocks.where('id').anyOf(blockIds).delete()
    await db.trainings.delete(id)
  })
}

export interface NewBlockInput {
  trainingId: string
  distanceM: number
  targetFace?: string
}

export async function createBlock(input: NewBlockInput): Promise<DistanceBlock> {
  const existing = await db.blocks.where('trainingId').equals(input.trainingId).count()
  const block: DistanceBlock = {
    id: newId(),
    trainingId: input.trainingId,
    distanceM: input.distanceM,
    targetFace: input.targetFace,
    orderIdx: existing,
  }
  await db.blocks.put(block)
  return block
}

export async function deleteBlock(id: string): Promise<void> {
  await db.transaction('rw', db.blocks, db.ends, db.shots, async () => {
    const ends = await db.ends.where('blockId').equals(id).toArray()
    const endIds = ends.map((e) => e.id)
    if (endIds.length) {
      await db.shots.where('endId').anyOf(endIds).delete()
      await db.ends.where('id').anyOf(endIds).delete()
    }
    await db.blocks.delete(id)
  })
}

export interface NewEndInput {
  blockId: string
  arrowsPerEnd: ArrowsPerEnd
}

export async function createEnd(input: NewEndInput): Promise<End> {
  const existing = await db.ends.where('blockId').equals(input.blockId).count()
  const end: End = {
    id: newId(),
    blockId: input.blockId,
    orderIdx: existing,
    arrowsPerEnd: input.arrowsPerEnd,
    sum: 0,
    count: 0,
    xCount: 0,
    mCount: 0,
    createdAt: nowIso(),
  }
  await db.ends.put(end)
  return end
}

export async function deleteEnd(id: string): Promise<void> {
  await db.transaction('rw', db.ends, db.shots, async () => {
    await db.shots.where('endId').equals(id).delete()
    await db.ends.delete(id)
  })
}

export interface ShotInput {
  score: number
  isX?: boolean
  isM?: boolean
}

export async function setShots(endId: string, shots: ShotInput[]): Promise<void> {
  await db.transaction('rw', db.ends, db.shots, async () => {
    const end = await db.ends.get(endId)
    if (!end) throw new Error(`end ${endId} not found`)
    await db.shots.where('endId').equals(endId).delete()
    let sum = 0
    let xCount = 0
    let mCount = 0
    const rows: Shot[] = shots.map((s, i) => {
      const score = s.isM ? 0 : s.score
      if (s.isX) xCount++
      if (s.isM) mCount++
      sum += score
      return {
        id: newId(),
        endId,
        orderIdx: i,
        score,
        isX: !!s.isX,
        isM: !!s.isM,
      }
    })
    if (rows.length) await db.shots.bulkPut(rows)
    await db.ends.update(endId, {
      sum,
      count: rows.length,
      xCount,
      mCount,
    })
  })
}
