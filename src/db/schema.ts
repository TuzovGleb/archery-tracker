import Dexie, { type Table } from 'dexie'
import type {
  ArrowSet,
  BackupRow,
  Bow,
  DistanceBlock,
  End,
  MetaRow,
  Shot,
  Training,
} from './types'

export const SCHEMA_VERSION = 1

class ArcheryDB extends Dexie {
  bows!: Table<Bow, string>
  arrowSets!: Table<ArrowSet, string>
  trainings!: Table<Training, string>
  blocks!: Table<DistanceBlock, string>
  ends!: Table<End, string>
  shots!: Table<Shot, string>
  meta!: Table<MetaRow, string>
  backups!: Table<BackupRow, number>

  constructor() {
    super('archery')
    this.version(1).stores({
      bows: 'id, type, createdAt',
      arrowSets: 'id',
      trainings: 'id, date, bowId, *tags',
      blocks: 'id, trainingId, [trainingId+orderIdx]',
      ends: 'id, blockId, [blockId+orderIdx]',
      shots: 'id, endId, [endId+orderIdx]',
      meta: 'key',
      backups: '++id, createdAt',
    })
  }
}

export const db = new ArcheryDB()
