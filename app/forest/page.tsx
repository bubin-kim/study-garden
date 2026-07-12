'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  Clock,
  Flame,
  Hourglass,
  Leaf,
  Sprout,
  Sun,
  Trees,
  type LucideIcon,
} from 'lucide-react'
import { GrowthJourney } from '@/components/ui/GrowthJourney'
import { getAchievements } from '@/lib/achievements'
import { getLevel } from '@/lib/level'
import { totalMinutes } from '@/lib/stats'
import { formatDuration } from '@/lib/time'
import { useSessionStore } from '@/stores/session-store'

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  'first-seed': Sprout,
  'streak-7': Flame,
  'hours-10': Clock,
  'hours-50': Hourglass,
  'hours-100': Award,
  'plants-30': Leaf,
  'plants-100': Trees,
  'four-seasons': Sun,
}

export default function ForestPage() {
  const sessions = useSessionStore((s) => s.sessions)

  const total = totalMinutes(sessions)
  const lv = getLevel(total)
  const achievements = useMemo(() => getAchievements(sessions), [sessions])
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  const first = sessions.length
    ? [...sessions].sort((a, b) => a.completedAt.localeCompare(b.completedAt))[0]
    : null
  const firstDate = first ? new Date(first.completedAt) : null

  return (
    <main className="pb-16">
      <section className="mt-2 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
          Forest
        </p>
        <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight">나의 숲</h1>
        <p className="mt-1 text-[13px] text-muted">
          {firstDate
            ? `${firstDate.getFullYear()}년 ${firstDate.getMonth() + 1}월부터 가꾸어 온 기록`
            : '오늘부터 가꾸기 시작하는 숲'}
        </p>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 rounded-card border border-line bg-surface p-7 text-center"
      >
        <p className="text-[13px] text-muted">총 공부 시간</p>
        <p className="mt-1 text-[40px] font-extralight tabular-nums tracking-tight">
          {formatDuration(total)}
        </p>
        <div className="mt-6 flex justify-center divide-x divide-line">
          <div className="px-8">
            <p className="text-[12px] text-muted">누적 식물</p>
            <p className="mt-0.5 text-[17px] font-semibold tabular-nums">
              {sessions.length}그루
            </p>
          </div>
          <div className="px-8">
            <p className="text-[12px] text-muted">현재 레벨</p>
            <p className="mt-0.5 text-[17px] font-semibold tabular-nums">
              Lv.{lv.level}
            </p>
          </div>
        </div>
      </motion.section>

      <section className="mt-4 rounded-card border border-line bg-surface px-6 py-5">
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="font-semibold">
            Lv.{lv.level} {lv.name}
          </span>
          <span className="text-muted">
            {lv.remainingMin != null
              ? `다음 레벨까지 ${formatDuration(lv.remainingMin)}`
              : '최고 레벨에 도달했어요'}
          </span>
        </div>
        <div className="mt-3.5">
          <GrowthJourney level={lv.level} progress={lv.progress} />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold">업적</h2>
          <p className="text-[12px] text-muted">
            {unlockedCount} / {achievements.length}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {achievements.map((a, i) => {
            const Icon = ACHIEVEMENT_ICONS[a.id] ?? Sprout
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className={`rounded-card border border-line bg-surface p-5 ${
                  a.unlocked ? '' : 'opacity-55 saturate-50'
                }`}
              >
                {a.unlocked ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 280,
                      damping: 13,
                      delay: 0.15 + i * 0.05,
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary"
                  >
                    <Icon size={17} />
                  </motion.span>
                ) : (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-line/60 text-muted blur-[1.5px]">
                    <Icon size={17} />
                  </span>
                )}
                <p className="mt-3 text-[14px] font-semibold">{a.name}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                  {a.desc}
                </p>
              </motion.div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
