'use client'

import { useEffect } from 'react'
import { seasonOf } from '@/lib/season'
import { useSeasonStore } from '@/stores/season-store'
import { useSessionStore } from '@/stores/session-store'
import { useTimerStore } from '@/stores/timer-store'

/** 계절 테마 적용 + Local Storage 데이터 하이드레이션 */
export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const hydrateSeason = useSeasonStore((s) => s.hydrate)
  const hydrateSessions = useSessionStore((s) => s.hydrate)
  const hydrateTimer = useTimerStore((s) => s.hydrate)
  const preference = useSeasonStore((s) => s.preference)

  useEffect(() => {
    hydrateSeason()
    hydrateSessions()
    hydrateTimer()
  }, [hydrateSeason, hydrateSessions, hydrateTimer])

  // 고정된 계절이 있으면 그 계절에 머물고, 없으면 접속한 날짜가 계절을 정한다
  useEffect(() => {
    document.documentElement.dataset.season = preference ?? seasonOf(new Date())
  }, [preference])

  return <>{children}</>
}
