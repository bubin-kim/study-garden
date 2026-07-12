'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Settings2, Sprout, TreePine } from 'lucide-react'
import { useTimerStore } from '@/stores/timer-store'
import { useUiStore } from '@/stores/ui-store'

export function AppHeader() {
  const pathname = usePathname()
  const running = useTimerStore((s) => s.status === 'running')
  const openSettings = useUiStore((s) => s.openSettings)

  const linkCls = (href: string) =>
    `rounded-full p-3 transition-colors duration-200 ${
      pathname === href
        ? 'bg-primary-soft text-ink'
        : 'text-muted hover:bg-primary-soft/60 hover:text-ink'
    }`

  return (
    <header
      className={`flex items-center justify-between py-6 transition-opacity duration-500 ${
        running ? 'pointer-events-none opacity-25' : ''
      }`}
    >
      <Link
        href="/"
        className="flex items-center gap-2 text-[17px] font-semibold tracking-tight"
      >
        <Sprout size={20} strokeWidth={2.2} className="text-primary" />
        Study Garden
      </Link>
      <nav className="flex items-center gap-0.5">
        <Link href="/records" aria-label="기록" className={linkCls('/records')}>
          <CalendarDays size={19} />
        </Link>
        <Link href="/forest" aria-label="Forest" className={linkCls('/forest')}>
          <TreePine size={19} />
        </Link>
        <button
          aria-label="설정"
          onClick={openSettings}
          className="rounded-full p-3 text-muted transition-colors duration-200 hover:bg-primary-soft/60 hover:text-ink"
        >
          <Settings2 size={19} />
        </button>
      </nav>
    </header>
  )
}
