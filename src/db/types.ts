export type BowType = 'recurve' | 'compound' | 'traditional'

export interface Bow {
  id: string
  type: BowType
  name: string
  drawWeight?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ArrowSet {
  id: string
  name: string
  spine?: string
  length?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Training {
  id: string
  date: string // YYYY-MM-DD
  startedAt: string
  endedAt?: string
  bowId?: string
  arrowSetId?: string
  weather?: string
  tempC?: number
  windMs?: number
  goal?: string
  energy?: number // 1..5
  focus?: number // 1..5
  conclusion?: string
  tags: string[]
  updatedAt: string
}

export interface DistanceBlock {
  id: string
  trainingId: string
  distanceM: number
  targetFace?: string
  orderIdx: number
}

export type ArrowsPerEnd = 3 | 6

export interface End {
  id: string
  blockId: string
  orderIdx: number
  arrowsPerEnd: ArrowsPerEnd
  sum: number
  count: number
  xCount: number
  mCount: number
  createdAt: string
}

export interface Shot {
  id: string
  endId: string
  orderIdx: number
  score: number // 0..10, 0 if miss
  isX: boolean
  isM: boolean
}

export interface MetaRow {
  key: string
  value: unknown
}

export interface BackupRow {
  id?: number
  createdAt: string
  reason: string
  payload: string // JSON
}

export interface ExportPayload {
  version: number
  exportedAt: string
  data: {
    bows: Bow[]
    arrowSets: ArrowSet[]
    trainings: Training[]
    blocks: DistanceBlock[]
    ends: End[]
    shots: Shot[]
  }
}
