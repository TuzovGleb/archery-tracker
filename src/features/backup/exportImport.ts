import { z } from 'zod'
import { db, SCHEMA_VERSION } from '@/db/schema'
import type { ExportPayload } from '@/db/types'
import { nowIso } from '@/lib/ids'

const ShotSchema = z.object({
  id: z.string(),
  endId: z.string(),
  orderIdx: z.number().int().nonnegative(),
  score: z.number().int().min(0).max(10),
  isX: z.boolean(),
  isM: z.boolean(),
})

const EndSchema = z.object({
  id: z.string(),
  blockId: z.string(),
  orderIdx: z.number().int().nonnegative(),
  arrowsPerEnd: z.union([z.literal(3), z.literal(6)]),
  sum: z.number(),
  count: z.number().int().nonnegative(),
  xCount: z.number().int().nonnegative(),
  mCount: z.number().int().nonnegative(),
  createdAt: z.string(),
})

const BlockSchema = z.object({
  id: z.string(),
  trainingId: z.string(),
  distanceM: z.number(),
  targetFace: z.string().optional(),
  orderIdx: z.number().int().nonnegative(),
})

const TrainingSchema = z.object({
  id: z.string(),
  date: z.string(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  bowId: z.string().optional(),
  arrowSetId: z.string().optional(),
  weather: z.string().optional(),
  tempC: z.number().optional(),
  windMs: z.number().optional(),
  goal: z.string().optional(),
  energy: z.number().optional(),
  focus: z.number().optional(),
  conclusion: z.string().optional(),
  tags: z.array(z.string()).default([]),
  updatedAt: z.string(),
})

const BowSchema = z.object({
  id: z.string(),
  type: z.enum(['recurve', 'compound', 'traditional']),
  name: z.string(),
  drawWeight: z.number().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const ArrowSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  spine: z.string().optional(),
  length: z.number().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const PayloadSchema = z.object({
  version: z.number().int().positive(),
  exportedAt: z.string(),
  data: z.object({
    bows: z.array(BowSchema),
    arrowSets: z.array(ArrowSetSchema),
    trainings: z.array(TrainingSchema),
    blocks: z.array(BlockSchema),
    ends: z.array(EndSchema),
    shots: z.array(ShotSchema),
  }),
})

export async function exportAll(): Promise<ExportPayload> {
  const [bows, arrowSets, trainings, blocks, ends, shots] = await Promise.all([
    db.bows.toArray(),
    db.arrowSets.toArray(),
    db.trainings.toArray(),
    db.blocks.toArray(),
    db.ends.toArray(),
    db.shots.toArray(),
  ])
  return {
    version: SCHEMA_VERSION,
    exportedAt: nowIso(),
    data: { bows, arrowSets, trainings, blocks, ends, shots },
  }
}

export async function downloadExport(): Promise<void> {
  const payload = await exportAll()
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `archery-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
    a.remove()
  }, 0)
  await db.meta.put({ key: 'lastExportAt', value: nowIso() })
}

interface ImportOptions {
  mode: 'replace' | 'merge'
}

export async function importJson(text: string, opts: ImportOptions = { mode: 'replace' }): Promise<{ counts: Record<string, number> }> {
  const parsed = JSON.parse(text)
  const payload = PayloadSchema.parse(parsed)
  if (payload.version > SCHEMA_VERSION) {
    throw new Error(`Файл из более новой версии (v${payload.version}). Обновите приложение.`)
  }

  // pre-import backup
  const current = await exportAll()
  await db.backups.add({
    createdAt: nowIso(),
    reason: `pre-import-${opts.mode}`,
    payload: JSON.stringify(current),
  })

  await db.transaction('rw', [db.bows, db.arrowSets, db.trainings, db.blocks, db.ends, db.shots], async () => {
    if (opts.mode === 'replace') {
      await Promise.all([
        db.bows.clear(),
        db.arrowSets.clear(),
        db.trainings.clear(),
        db.blocks.clear(),
        db.ends.clear(),
        db.shots.clear(),
      ])
    }
    await db.bows.bulkPut(payload.data.bows)
    await db.arrowSets.bulkPut(payload.data.arrowSets)
    await db.trainings.bulkPut(payload.data.trainings.map((t) => ({ ...t, tags: t.tags ?? [] })))
    await db.blocks.bulkPut(payload.data.blocks)
    await db.ends.bulkPut(payload.data.ends)
    await db.shots.bulkPut(payload.data.shots)
  })

  return {
    counts: {
      bows: payload.data.bows.length,
      arrowSets: payload.data.arrowSets.length,
      trainings: payload.data.trainings.length,
      blocks: payload.data.blocks.length,
      ends: payload.data.ends.length,
      shots: payload.data.shots.length,
    },
  }
}

const EXPORT_REMINDER_DAYS = 14

export async function shouldRemindExport(): Promise<boolean> {
  const trainings = await db.trainings.count()
  if (trainings === 0) return false
  const last = await db.meta.get('lastExportAt')
  if (!last) return true
  const lastDate = new Date(last.value as string)
  const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  return daysSince >= EXPORT_REMINDER_DAYS
}
