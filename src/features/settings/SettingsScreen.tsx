import { useRef, useState } from 'react'
import { Link } from 'wouter'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Field, Select } from '@/components/Field'
import { downloadExport, importJson } from '@/features/backup/exportImport'
import { db } from '@/db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { getStoredTheme, setStoredTheme, type Theme } from '@/lib/theme'

export function SettingsScreen() {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>(getStoredTheme())
  const lastExport = useLiveQuery(() => db.meta.get('lastExportAt'), [])

  const handleImport = async (file: File) => {
    setImportMsg('Импорт…')
    try {
      const text = await file.text()
      const ok = confirm(
        'Импорт заменит ВСЕ текущие данные (предварительно сохранится резервная копия в OPFS). Продолжить?',
      )
      if (!ok) {
        setImportMsg(null)
        return
      }
      const res = await importJson(text, { mode: 'replace' })
      setImportMsg(
        `Готово: ${res.counts.trainings} тренировок, ${res.counts.shots} выстрелов.`,
      )
    } catch (err) {
      setImportMsg(`Ошибка: ${(err as Error).message}`)
    }
  }

  const lastExportDate =
    lastExport && typeof lastExport.value === 'string'
      ? new Date(lastExport.value).toLocaleString('ru-RU')
      : 'никогда'

  return (
    <AppShell title="Настройки">
      <div className="p-4 space-y-4">
        <section>
          <h2 className="text-sm font-semibold text-muted px-1 mb-2">Внешний вид</h2>
          <Card>
            <Field label="Тема">
              <Select
                value={theme}
                onChange={(e) => {
                  const t = e.target.value as Theme
                  setTheme(t)
                  setStoredTheme(t)
                }}
              >
                <option value="system">Системная</option>
                <option value="light">Светлая</option>
                <option value="dark">Тёмная</option>
              </Select>
            </Field>
          </Card>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted px-1 mb-2">Снаряжение</h2>
          <Link href="/equipment">
            <Card className="flex items-center justify-between active:bg-elev cursor-pointer">
              <span>Луки и стрелы</span>
              <span className="text-muted">›</span>
            </Card>
          </Link>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted px-1 mb-2">Резервные копии</h2>
          <Card className="space-y-3">
            <div className="text-xs text-muted">
              Последний экспорт: <span className="text-fg">{lastExportDate}</span>
            </div>
            <Button full variant="secondary" onClick={() => downloadExport()}>
              Экспорт в JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleImport(f)
                e.target.value = ''
              }}
            />
            <Button full variant="secondary" onClick={() => fileRef.current?.click()}>
              Импорт из JSON
            </Button>
            {importMsg && <div className="text-xs text-muted">{importMsg}</div>}
            <div className="text-xs text-muted leading-snug">
              На iPhone Safari может очистить данные сайта в любой момент. Экспортируй раз в пару недель и присылай файл себе на почту.
            </div>
          </Card>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted px-1 mb-2">О приложении</h2>
          <Card>
            <div className="text-xs text-muted">
              Archery Tracker · локально · без аккаунтов и серверов.
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  )
}
