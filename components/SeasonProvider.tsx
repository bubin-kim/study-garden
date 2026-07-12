'use client'

import { useEffect } from 'react'
import { seasonOf } from '@/lib/season'
import { useSessionStore } from '@/stores/session-store'
import { useTimerStore } from '@/stores/timer-store'

/** 계절 테마 적용 + Local Storage 데이터 하이드레이션 */
export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const hydrateSessions = useSessionStore((s) => s.hydrate)
  const hydrateTimer = useTimerStore((s) => s.hydrate)

  useEffect(() => {
    document.documentElement.dataset.season = seasonOf(new Date())
    hydrateSessions()
    hydrateTimer()
  }, [hydrateSessions, hydrateTimer])

  return <>{children}</>
}
