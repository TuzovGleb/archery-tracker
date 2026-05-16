import { useState } from 'react'
import { useLocation } from 'wouter'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { Field, NumberInput, Select, TextArea, TextInput } from '@/components/Field'
import { Card } from '@/components/Card'
import { createTraining } from '@/db/repo'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { todayIso } from '@/lib/ids'
import type { ArrowsPerEnd } from '@/db/types'

export function NewTrainingScreen() {
  const [, navigate] = useLocation()
  const bows = useLiveQuery(() => db.bows.toArray(), [])
  const arrowSets = useLiveQuery(() => db.arrowSets.toArray(), [])

  const [date, setDate] = useState(todayIso())
  const [bowId, setBowId] = useState<string>('')
  const [arrowSetId, setArrowSetId] = useState<string>('')
  const [distance, setDistance] = useState<string>('18')
  const [arrowsPerEnd, setArrowsPerEnd] = useState<ArrowsPerEnd>(3)
  const [goal, setGoal] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      const dist = Number(distance)
      const { training } = await createTraining({
        date,
        bowId: bowId || undefined,
        arrowSetId: arrowSetId || undefined,
        goal: goal.trim() || undefined,
        initialDistanceM: dist > 0 ? dist : undefined,
        initialArrowsPerEnd: arrowsPerEnd,
      })
      // store default arrowsPerEnd in meta for next end creation
      await db.meta.put({ key: 'lastArrowsPerEnd', value: arrowsPerEnd })
      navigate(`/training/${training.id}`, { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell title="Новая тренировка" back="/" hideNav>
      <div className="p-4 space-y-4">
        <Card className="space-y-3">
          <Field label="Дата">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>

          <Field label="Лук" hint={bows && bows.length === 0 ? 'Можно добавить позже в «Настройки → Снаряжение»' : undefined}>
            <Select value={bowId} onChange={(e) => setBowId(e.target.value)}>
              <option value="">— не выбран —</option>
              {bows?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.type === 'recurve' ? 'кл.' : b.type === 'compound' ? 'бл.' : 'тр.'})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Стрелы">
            <Select value={arrowSetId} onChange={(e) => setArrowSetId(e.target.value)}>
              <option value="">— не указан —</option>
              {arrowSets?.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Дистанция, м">
              <NumberInput value={distance} onChange={(e) => setDistance(e.target.value)} min={1} />
            </Field>
            <Field label="Стрел в серии">
              <Select value={arrowsPerEnd} onChange={(e) => setArrowsPerEnd(Number(e.target.value) as ArrowsPerEnd)}>
                <option value={3}>3</option>
                <option value={6}>6</option>
              </Select>
            </Field>
          </div>

          <Field label="Цель тренировки">
            <TextArea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Например: отработать прицеливание, разогнаться до 60 выстрелов" />
          </Field>
        </Card>

        <Button full size="lg" onClick={submit} disabled={busy}>
          Начать тренировку
        </Button>
      </div>
    </AppShell>
  )
}
