'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Garden } from '@/components/garden/Garden'
import { StatCard } from '@/components/records/StatCard'
import { StudyCalendar } from '@/components/records/StudyCalendar'
import { getGardenPlants } from '@/lib/garden'
import { getLevel } from '@/lib/level'
import {
  dailyRecords,
  minutesInMonth,
  minutesThisWeek,
  minutesToday,
  totalMinutes,
} from '@/lib/stats'
import { formatDuration } from '@/lib/time'
import { useSessionStore } from '@/stores/session-store'

export default function RecordsPage() {
  const sessions = useSessionStore((s) => s.sessions)
  const hydrated = useSessionStore((s) => s.hydrated)

  const now = new Date()
  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth()

  const [view, setView] = useState({ year: nowYear, month: nowMonth })
  const [selected, setSelected] = useState<string | null>(null)

  const plants = useMemo(
    () => getGardenPlants(sessions, view.year, view.month),
    [sessions, view],
  )
  const records = useMemo(() => dailyRecords(sessions), [sessions])

  const total = totalMinutes(sessions)
  const lv = getLevel(total)
  const isCurrent = view.year === nowYear && view.month === nowMonth

  const moveMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
    setSelected(null)
  }

  const selectedRecord = selected ? records.get(selected) : undefined
  const selectedLabel = selected
    ? `${Number(selected.slice(5, 7))}월 ${Number(selected.slice(8, 10))}일`
    : ''

  return (
    <main className="pb-16">
      <section className="grid grid-cols-2 gap-3">
        <StatCard label="오늘" value={formatDuration(minutesToday(sessions))} />
        <StatCard label="이번 주" value={formatDuration(minutesThisWeek(sessions))} />
        <StatCard
          label="이번 달"
          value={formatDuration(minutesInMonth(sessions, nowYear, nowMonth))}
        />
        <StatCard label="전체" value={formatDuration(total)} />
      </section>
      <Link
        href="/forest"
        className="mt-3 flex items-center justify-between rounded-card border border-line bg-surface px-5 py-4 transition-shadow duration-300 hover:shadow-card"
      >
        <span className="text-[12px] text-muted">현재 레벨</span>
        <span className="flex items-center gap-1 text-[14px] font-semibold">
          Lv.{lv.level} {lv.name}
          <ChevronRight size={15} className="text-muted" />
        </span>
      </Link>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => moveMonth(-1)}
            aria-label="이전 달"
            className="rounded-full p-2 text-muted transition-colors hover:bg-primary-soft hover:text-ink"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-[15px] font-semibold tabular-nums">
            {view.year}년 {view.month + 1}월
          </h2>
          <button
            onClick={() => moveMonth(1)}
            disabled={isCurrent}
            aria-label="다음 달"
            className="rounded-full p-2 text-muted transition-colors hover:bg-primary-soft hover:text-ink disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mt-4 rounded-card border border-line bg-surface px-4 pb-3 pt-5">
          <Garden
            plants={plants}
            seedWaiting={isCurrent && hydrated}
            ambient={isCurrent}
            emptyText={
              hydrated
                ? isCurrent
                  ? '아직 심긴 식물이 없는 달이에요'
                  : '이 달의 정원은 조용히 쉬었어요'
                : undefined
            }
          />
          <p className="mt-2 text-center text-[12px] text-muted">
            {isCurrent ? '이번 달' : `${view.month + 1}월`}의 정원
            {plants.length > 0 && ` · ${plants.length}그루`}
          </p>
        </div>

        <div className="mt-4 rounded-card border border-line bg-surface p-5">
          <StudyCalendar
            year={view.year}
            month={view.month}
            records={records}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className="mt-4 flex items-center justify-between rounded-card border border-line bg-surface px-5 py-4"
            >
              <span className="text-[14px] font-medium">{selectedLabel}</span>
              <span className="text-[13px] text-muted">
                {selectedRecord
                  ? `${formatDuration(selectedRecord.minutes)} · 타이머 ${selectedRecord.count}개 완료`
                  : '기록이 없어요'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  )
}
