'use client'

import Link from 'next/link'
import { GrowthJourney } from '@/components/ui/GrowthJourney'
import { getLevel } from '@/lib/level'
import { totalMinutes } from '@/lib/stats'
import { formatDuration } from '@/lib/time'
import { useSessionStore } from '@/stores/session-store'

export function LevelBar() {
  const sessions = useSessionStore((s) => s.sessions)
  const lv = getLevel(totalMinutes(sessions))

  return (
    <Link
      href="/forest"
      className="block rounded-card border border-line bg-surface px-5 py-4 transition-shadow duration-300 hover:shadow-card"
    >
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-semibold">
          Lv.{lv.level} {lv.name}
        </span>
        <span className="text-muted">
          {lv.remainingMin != null
            ? `다음 레벨까지 ${formatDuration(lv.remainingMin)}`
            : '최고 레벨'}
        </span>
      </div>
      <div className="mt-3.5">
        <GrowthJourney level={lv.level} progress={lv.progress} />
      </div>
    </Link>
  )
}
