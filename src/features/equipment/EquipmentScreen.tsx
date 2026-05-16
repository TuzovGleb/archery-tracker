import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Field, NumberInput, Select, TextInput } from '@/components/Field'
import { db } from '@/db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  createArrowSet,
  createBow,
  deleteArrowSet,
  deleteBow,
} from '@/db/repo'
import type { BowType } from '@/db/types'

export function EquipmentScreen() {
  const bows = useLiveQuery(() => db.bows.toArray(), [])
  const sets = useLiveQuery(() => db.arrowSets.toArray(), [])

  const [bowName, setBowName] = useState('')
  const [bowType, setBowType] = useState<BowType>('recurve')
  const [bowWeight, setBowWeight] = useState('')

  const [setName, setSetName] = useState('')
  const [setSpine, setSetSpine] = useState('')
  const [setLength, setSetLength] = useState('')

  const addBow = async () => {
    if (!bowName.trim()) return
    await createBow({
      name: bowName,
      type: bowType,
      drawWeight: bowWeight ? Number(bowWeight) : undefined,
    })
    setBowName('')
    setBowWeight('')
  }

  const addSet = async () => {
    if (!setName.trim()) return
    await createArrowSet({
      name: setName,
      spine: setSpine || undefined,
      length: setLength ? Number(setLength) : undefined,
    })
    setSetName('')
    setSetSpine('')
    setSetLength('')
  }

  return (
    <AppShell title="Снаряжение" back="/settings" hideNav>
      <div className="p-4 space-y-4">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted px-1">Луки</h2>
          {bows?.map((b) => (
            <Card key={b.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{b.name}</div>
                <div className="text-xs text-muted">
                  {b.type === 'recurve' ? 'классика' : b.type === 'compound' ? 'блочный' : 'традиционный'}
                  {b.drawWeight ? ` · ${b.drawWeight} #` : ''}
                </div>
              </div>
              <button
                onClick={() => deleteBow(b.id)}
                className="text-muted active:text-bad px-2"
              >
                ✕
              </button>
            </Card>
          ))}
          <Card className="space-y-2">
            <Field label="Название">
              <TextInput value={bowName} onChange={(e) => setBowName(e.target.value)} placeholder="Например: WIN&WIN ATF-DX" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Тип">
                <Select value={bowType} onChange={(e) => setBowType(e.target.value as BowType)}>
                  <option value="recurve">Классика</option>
                  <option value="compound">Блочный</option>
                  <option value="traditional">Традиционный</option>
                </Select>
              </Field>
              <Field label="Сила, #">
                <NumberInput value={bowWeight} onChange={(e) => setBowWeight(e.target.value)} />
              </Field>
            </div>
            <Button onClick={addBow} full variant="secondary" disabled={!bowName.trim()}>
              + Добавить лук
            </Button>
          </Card>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted px-1">Наборы стрел</h2>
          {sets?.map((a) => (
            <Card key={a.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-muted">
                  {a.spine ? `spine ${a.spine}` : ''}
                  {a.length ? ` · ${a.length}″` : ''}
                </div>
              </div>
              <button
                onClick={() => deleteArrowSet(a.id)}
                className="text-muted active:text-bad px-2"
              >
                ✕
              </button>
            </Card>
          ))}
          <Card className="space-y-2">
            <Field label="Название">
              <TextInput value={setName} onChange={(e) => setSetName(e.target.value)} placeholder="Например: Easton X10" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Spine">
                <TextInput value={setSpine} onChange={(e) => setSetSpine(e.target.value)} placeholder="450" />
              </Field>
              <Field label="Длина, ″">
                <NumberInput value={setLength} onChange={(e) => setSetLength(e.target.value)} />
              </Field>
            </div>
            <Button onClick={addSet} full variant="secondary" disabled={!setName.trim()}>
              + Добавить набор
            </Button>
          </Card>
        </section>
      </div>
    </AppShell>
  )
}
