'use client'

import { useEffect } from 'react'
import { seasonOf } from '@/lib/season'
import { useExamStore } from '@/stores/exam-store'
import { useSeasonStore } from '@/stores/season-store'
import { useSessionStore } from '@/stores/session-store'
import { useSubjectStore } from '@/stores/subject-store'
import { useTaskStore } from '@/stores/task-store'
import { useTimerStore } from '@/stores/timer-store'

/** 계절 테마 적용 + Local Storage 데이터 하이드레이션 */
export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const hydrateSeason = useSeasonStore((s) => s.hydrate)
  const hydrateSessions = useSessionStore((s) => s.hydrate)
  const hydrateTimer = useTimerStore((s) => s.hydrate)
  const hydrateTasks = useTaskStore((s) => s.hydrate)
  const hydrateSubjects = useSubjectStore((s) => s.hydrate)
  const hydrateExams = useExamStore((s) => s.hydrate)
  const preference = useSeasonStore((s) => s.preference)

  useEffect(() => {
    hydrateSeason()
    hydrateSessions()
    hydrateTimer()
    hydrateTasks()
    hydrateSubjects()
    hydrateExams()
  }, [hydrateSeason, hydrateSessions, hydrateTimer, hydrateTasks, hydrateSubjects, hydrateExams])

  // 자정을 넘겨 탭으로 돌아오면 "오늘"을 갱신한다 (오늘의 목표가 새 날로 넘어가도록)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') useTaskStore.getState().refreshToday()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // 고정된 계절이 있으면 그 계절에 머물고, 없으면 접속한 날짜가 계절을 정한다
  useEffect(() => {
    document.documentElement.dataset.season = preference ?? seasonOf(new Date())
  }, [preference])

  return <>{children}</>
}
