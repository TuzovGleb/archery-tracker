import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Field, NumberInput, Select, TextArea } from '@/components/Field'
import { db } from '@/db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  createBlock,
  createEnd,
  deleteBlock,
  deleteEnd,
  deleteTraining,
  updateTraining,
} from '@/db/repo'
import type { ArrowsPerEnd, End } from '@/db/types'
import { formatDate, round1 } from '@/lib/format'

interface Props {
  trainingId: string
}

export function TrainingScreen({ trainingId }: Props) {
  const [, navigate] = useLocation()
  const training = useLiveQuery(() => db.trainings.get(trainingId), [trainingId])
  const blocks = useLiveQuery(
    () =>
      db.blocks
        .where('trainingId')
        .equals(trainingId)
        .sortBy('orderIdx'),
    [trainingId],
  )
  const blockIds = blocks?.map((b) => b.id) ?? []
  const ends = useLiveQuery(
    async () => {
      if (blockIds.length === 0) return []
      return db.ends.where('blockId').anyOf(blockIds).toArray()
    },
    [blockIds.join(',')],
  )

  const [newDist, setNewDist] = useState('')
  const [showConditions, setShowConditions] = useState(false)
  const lastArrowsRow = useLiveQuery(() => db.meta.get('lastArrowsPerEnd'), [])
  const lastArrowsPerEnd = (lastArrowsRow?.value as ArrowsPerEnd | undefined) ?? 3

  if (!training) {
    return (
      <AppShell title="…" back="/" hideNav>
        <div className="p-4 text-muted">Загрузка…</div>
      </AppShell>
    )
  }

  const endsByBlock = new Map<string, End[]>()
  for (const e of ends ?? []) {
    const arr = endsByBlock.get(e.blockId) ?? []
    arr.push(e)
    endsByBlock.set(e.blockId, arr)
  }
  for (const arr of endsByBlock.values()) {
    arr.sort((a, b) => a.orderIdx - b.orderIdx)
  }

  const totalShots = (ends ?? []).reduce((a, e) => a + e.count, 0)
  const totalSum = (ends ?? []).reduce((a, e) => a + e.sum, 0)
  const totalX = (ends ?? []).reduce((a, e) => a + e.xCount, 0)

  const addBlock = async () => {
    const dist = Number(newDist)
    if (!Number.isFinite(dist) || dist <= 0) return
    await createBlock({ trainingId, distanceM: dist })
    setNewDist('')
  }

  const addEnd = async (blockId: string) => {
    const end = await createEnd({ blockId, arrowsPerEnd: lastArrowsPerEnd })
    navigate(`/training/${trainingId}/end/${end.id}`)
  }

  const handleDeleteEnd = async (endId: string) => {
    if (!confirm('Удалить эту серию?')) return
    await deleteEnd(endId)
  }

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Удалить блок дистанции со всеми сериями?')) return
    await deleteBlock(blockId)
  }

  const handleDeleteTraining = async () => {
    if (!confirm('Удалить всю тренировку?')) return
    await deleteTraining(trainingId)
    navigate('/', { replace: true })
  }

  return (
    <AppShell title={formatDate(training.date)} back="/" hideNav>
      <div className="p-4 space-y-4">
        {totalShots > 0 && (
          <Card className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl font-semibold tabular-nums">{totalShots}</div>
              <div className="text-xs text-muted">выстрелов</div>
            </div>
            <div>
              <div className="text-2xl font-semibold tabular-nums">{totalSum}</div>
              <div className="text-xs text-muted">очков</div>
            </div>
            <div>
              <div className="text-2xl font-semibold tabular-nums">
                {totalShots > 0 ? round1(totalSum / totalShots) : '—'}
              </div>
              <div className="text-xs text-muted">средний · {totalX}X</div>
            </div>
          </Card>
        )}

        {(blocks ?? []).map((b) => {
          const blockEnds = endsByBlock.get(b.id) ?? []
          const blockShots = blockEnds.reduce((a, e) => a + e.count, 0)
          const blockSum = blockEnds.reduce((a, e) => a + e.sum, 0)
          return (
            <Card key={b.id} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xl font-semibold">{b.distanceM} м</div>
                  <div className="text-xs text-muted">
                    {blockEnds.length} серий · {blockShots} стрел · {blockSum} очк.
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBlock(b.id)}
                  className="text-xs text-muted active:text-bad"
                  aria-label="Удалить блок"
                >
                  ⋯
                </button>
              </div>

              <div className="space-y-1">
                {blockEnds.map((e) => (
                  <Link key={e.id} href={`/training/${trainingId}/end/${e.id}`}>
                    <div className="flex items-center justify-between rounded-lg bg-elev px-3 py-2 active:opacity-70">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted w-6">#{e.orderIdx + 1}</span>
                        <span className="font-medium tabular-nums">
                          {e.count > 0 ? `${e.sum}` : '—'}
                        </span>
                        <span className="text-xs text-muted">
                          {e.count}/{e.arrowsPerEnd} · {e.xCount}X
                        </span>
                      </div>
                      <button
                        onClick={(ev) => {
                          ev.preventDefault()
                          ev.stopPropagation()
                          handleDeleteEnd(e.id)
                        }}
                        className="text-muted text-xs px-2 py-1"
                      >
                        ✕
                      </button>
                    </div>
                  </Link>
                ))}
              </div>

              <Button full variant="secondary" onClick={() => addEnd(b.id)}>
                + Серия
              </Button>
            </Card>
          )
        })}

        <Card className="space-y-3">
          <div className="text-sm font-medium text-muted">Добавить дистанцию</div>
          <div className="flex gap-2">
            <NumberInput
              placeholder="метры"
              value={newDist}
              onChange={(e) => setNewDist(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addBlock} disabled={!newDist}>Добавить</Button>
          </div>
        </Card>

        <Card className="space-y-3">
          <button
            onClick={() => setShowConditions((s) => !s)}
            className="w-full flex items-center justify-between text-left text-sm font-medium text-muted"
          >
            <span>Условия и заметки</span>
            <span className="text-xl">{showConditions ? '−' : '+'}</span>
          </button>
          {showConditions && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Темп., °C">
                  <NumberInput
                    value={training.tempC ?? ''}
                    onChange={(e) =>
                      updateTraining(trainingId, {
                        tempC: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Ветер, м/с">
                  <NumberInput
                    value={training.windMs ?? ''}
                    onChange={(e) =>
                      updateTraining(trainingId, {
                        windMs: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Энергия 1–5">
                  <Select
                    value={training.energy ?? ''}
                    onChange={(e) =>
                      updateTraining(trainingId, {
                        energy: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Фокус 1–5">
                  <Select
                    value={training.focus ?? ''}
                    onChange={(e) =>
                      updateTraining(trainingId, {
                        focus: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Цель">
                <TextArea
                  value={training.goal ?? ''}
                  onChange={(e) => updateTraining(trainingId, { goal: e.target.value })}
                />
              </Field>
              <Field label="Выводы">
                <TextArea
                  value={training.conclusion ?? ''}
                  onChange={(e) => updateTraining(trainingId, { conclusion: e.target.value })}
                  placeholder="Что получилось, что нужно отработать дальше"
                />
              </Field>
            </div>
          )}
        </Card>

        <Button variant="ghost" full onClick={handleDeleteTraining} className="text-bad">
          Удалить тренировку
        </Button>
      </div>
    </AppShell>
  )
}
