'use client'

import { useMemo } from 'react'
import { Garden } from '@/components/garden/Garden'
import { LevelBar } from '@/components/home/LevelBar'
import { SessionCompleteOverlay } from '@/components/timer/SessionCompleteOverlay'
import { TimerSection } from '@/components/timer/TimerSection'
import { getGardenPlants } from '@/lib/garden'
import { useSessionStore } from '@/stores/session-store'
import { useTimerStore } from '@/stores/timer-store'

export default function HomePage() {
  const sessions = useSessionStore((s) => s.sessions)
  const hydrated = useSessionStore((s) => s.hydrated)
  const status = useTimerStore((s) => s.status)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const plants = useMemo(
    () => getGardenPlants(sessions, year, month),
    [sessions, year, month],
  )

  return (
    <main className="flex flex-1 flex-col pb-14">
      <div
        aria-hidden
        className={`fixed inset-0 -z-10 bg-ink transition-opacity duration-[2000ms] ${
          status === 'running' ? 'opacity-[0.05]' : 'opacity-0'
        }`}
      />
      <section className="mt-2">
        <p className="mb-3 text-center text-[13px] font-medium tracking-wide text-muted">
          {month + 1}월의 정원
          {plants.length > 0 && ` · ${plants.length}그루`}
        </p>
        <Garden
          plants={plants}
          growing={status !== 'idle'}
          emptyText={hydrated ? '정원이 첫 씨앗을 기다리고 있어요' : undefined}
          emptySub={
            hydrated ? '오늘 30분만 집중하면 새싹이 자라기 시작해요' : undefined
          }
        />
      </section>

      <TimerSection />

      <div className="mt-auto pt-12">
        <LevelBar />
      </div>

      <SessionCompleteOverlay />
    </main>
  )
}
