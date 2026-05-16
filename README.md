# Archery Tracker

Personal archery training log. Local-first PWA, mobile-first, без бэкенда.

## Стек

- Vite + React 19 + TypeScript
- Tailwind CSS (theme-aware tokens, dark mode через `.dark` класс)
- Dexie.js (IndexedDB) + dexie-react-hooks
- wouter (роутер)
- Recharts (lazy-loaded на /stats)
- Zod (валидация при импорте JSON)
- vite-plugin-pwa (manifest + Workbox SW)

## Запуск

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # production build → dist/
npm run preview # preview production build
```

## Деплой

`vite.config.ts` использует `base: './'`, dist раскладывается на любой статический хостинг без правок.

- **GitHub Pages**: `npm run build` → скопировать `dist/` в gh-pages-бранч.
- **Vercel/Netlify**: build `npm run build`, output `dist`.

## Архитектура

```
src/
  db/
    schema.ts         # Dexie + миграции (SCHEMA_VERSION = 1)
    repo.ts           # CRUD: тренировки, блоки, серии, выстрелы
    types.ts          # Domain-типы
  features/
    home/             # Главный экран с KPI
    training/         # Создание + просмотр тренировки
    end-logger/       # Numpad ввода серии + WakeLock
    history/          # Список тренировок
    stats/            # Aggregates + Recharts (lazy)
    equipment/        # Луки и стрелы
    settings/         # Тема + экспорт/импорт
    backup/           # Zod-схема и логика бэкапов
  components/         # AppShell, BottomNav, Button, Card, Field, Stat
  lib/                # cn, ids, format, haptic, theme
```

## Модель данных

```
Training → DistanceBlock[] → End[] → Shot[]
```

- **Training**: дата, лук, стрелы, погода/самочувствие/выводы.
- **DistanceBlock**: блок одной дистанции внутри тренировки.
- **End**: серия (3 или 6 стрел) с денормализованными `sum`, `count`, `xCount`, `mCount`.
- **Shot**: один выстрел (0..10, флаги `isX`, `isM`).

## iOS-специфика

- **Wake Lock**: на iPhone Safari нативный API не работает; используем скрытый silent-video элемент в `WakeLock.tsx` — экран не гаснет на стадионе.
- **File System Access API** недоступен на iOS → бэкапы только через ручной download JSON.
- **Add to Home Screen**: единственный способ установки PWA на iPhone (Поделиться → На экран Домой).
- **Очистка данных Safari** удалит IndexedDB → экспортируй каждые пару недель и шли себе на почту.

## Бэкапы и миграции

- Каждый ручной импорт автоматически делает снимок текущей БД в таблицу `backups` перед заменой.
- При изменении схемы (`SCHEMA_VERSION` → новый номер) добавляй `db.version(N).stores({...}).upgrade(tx => ...)` — никогда не редактируй прошлые версии.

## Открытые тикеты

- **Target-tap** (ввод по SVG-мишени) не реализован, только numpad.
- **File System Access**-бэкапы под Android не подключены.
- **Напоминания об экспорте**: функция `shouldRemindExport()` есть, UI-баннер не подключён.
