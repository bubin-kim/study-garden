'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Garden } from '@/components/garden/Garden'
import { DemoGardenSheet } from '@/components/home/DemoGardenSheet'
import { LevelBar } from '@/components/home/LevelBar'
import { TodayGoals } from '@/components/home/TodayGoals'
import { SessionCompleteOverlay } from '@/components/timer/SessionCompleteOverlay'
import { TimerSection } from '@/components/timer/TimerSection'
import { getGardenPlants, getGoalFlowers } from '@/lib/garden'
import { achievedDates } from '@/lib/tasks'
import { ddayText, nextExam } from '@/lib/dday'
import { useExamStore } from '@/stores/exam-store'
import { useSessionStore } from '@/stores/session-store'
import { useSubjectStore } from '@/stores/subject-store'
import { speciesOf } from '@/lib/subjects'
import { useTaskStore } from '@/stores/task-store'
import { useTimerStore } from '@/stores/timer-store'

export default function HomePage() {
  const sessions = useSessionStore((s) => s.sessions)
  const subjects = useSubjectStore((s) => s.subjects)
  const hydrated = useSessionStore((s) => s.hydrated)
  const status = useTimerStore((s) => s.status)
  const tasks = useTaskStore((s) => s.tasks)
  const justAchieved = useTaskStore((s) => s.justAchieved)
  const clearJustAchieved = useTaskStore((s) => s.clearJustAchieved)
  const today = useTaskStore((s) => s.today)
  const exams = useExamStore((s) => s.exams)
  const dday = today ? nextExam(exams, today) : null
  const [demoOpen, setDemoOpen] = useState(false)
  // 예시 정원은 기록이 하나도 없는 첫 방문자에게만 (docs/04)
  const showDemo = hydrated && sessions.length === 0 && status === 'idle'

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const plants = useMemo(
    () => getGardenPlants(sessions, year, month, (id) => speciesOf(subjects, id)),
    [sessions, year, month, subjects],
  )
  const goalFlowers = useMemo(
    () => getGoalFlowers(achievedDates(tasks, year, month)),
    [tasks, year, month],
  )

  // 꽃이 핀 순간의 안내는 잠깐만 머문다
  useEffect(() => {
    if (!justAchieved) return
    const id = setTimeout(clearJustAchieved, 4200)
    return () => clearTimeout(id)
  }, [justAchieved, clearJustAchieved])

  return (
    <main className="flex flex-1 flex-col pb-14">
      <div
        aria-hidden
        className={`fixed inset-0 -z-10 bg-ink transition-opacity duration-[2000ms] ${
          status === 'running' ? 'opacity-[0.05]' : 'opacity-0'
        }`}
      />
      <section className="mt-2">
        {dday && (
          <p className="mb-1 text-center text-[13px] font-semibold tracking-wide text-ink">
            {ddayText(dday.exam.name, dday.days)}
          </p>
        )}
        <div className="mb-3 min-h-[1.5em] text-center text-[13px] font-medium tracking-wide text-muted">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={justAchieved ? 'bloom' : 'caption'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              aria-live="polite"
              className={justAchieved ? 'text-ink' : undefined}
            >
              {justAchieved
                ? '오늘의 목표를 모두 가꿨어요 · 꽃 한 송이가 피었어요'
                : `${month + 1}월의 정원${plants.length > 0 ? ` · ${plants.length}그루` : ''}${
                    goalFlowers.length > 0 ? ` · 꽃 ${goalFlowers.length}송이` : ''
                  }`}
            </motion.p>
          </AnimatePresence>
        </div>
        <Garden
          plants={plants}
          goalFlowers={goalFlowers}
          growing={status !== 'idle'}
          seedWaiting={hydrated}
          emptyText={hydrated ? '정원이 첫 씨앗을 기다리고 있어요' : undefined}
          emptySub={
            hydrated
              ? '30분만 집중해 보세요 · 타이머를 끝까지 마치면 씨앗이 심어져요'
              : undefined
          }
        />
        {showDemo && (
          <div className="mt-1 flex justify-center">
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-primary transition-colors hover:bg-primary-soft"
            >
              예시 정원 구경하기
            </button>
          </div>
        )}
      </section>

      <TimerSection />

      <div className="mt-6">
        <TodayGoals />
      </div>

      <div className="mt-auto pt-3">
        <LevelBar />
      </div>

      <SessionCompleteOverlay />
      <DemoGardenSheet open={demoOpen} onClose={() => setDemoOpen(false)} />
    </main>
  )
}
