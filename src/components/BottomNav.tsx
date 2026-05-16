import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/cn'

const items: Array<{ href: string; label: string; icon: string }> = [
  { href: '/', label: 'Главная', icon: '◎' },
  { href: '/history', label: 'История', icon: '≡' },
  { href: '/stats', label: 'Статистика', icon: '◢' },
  { href: '/settings', label: 'Настройки', icon: '⚙' },
]

export function BottomNav() {
  const [location] = useLocation()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-border pb-safe">
      <ul className="grid grid-cols-4">
        {items.map((it) => {
          const active =
            it.href === '/' ? location === '/' : location.startsWith(it.href)
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-xs',
                  active ? 'text-accent' : 'text-muted',
                )}
              >
                <span className="text-xl leading-none">{it.icon}</span>
                <span>{it.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
