import type { Session } from '@/types'
import { dailyRecords, totalMinutes, type DayRecord } from './stats'
import { seasonOf } from './season'

export interface Achievement {
  id: string
  name: string
  desc: string
  unlocked: boolean
}

function hasStreak(days: Map<string, DayRecord>, target: number): boolean {
  const keys = [...days.keys()].sort()
  if (keys.length === 0) return false
  if (target <= 1) return true
  let streak = 1
  for (let i = 1; i < keys.length; i++) {
    const prev = new Date(keys[i - 1]).getTime()
    const cur = new Date(keys[i]).getTime()
    streak = Math.round((cur - prev) / 86400000) === 1 ? streak + 1 : 1
    if (streak >= target) return true
  }
  return false
}

export function getAchievements(sessions: Session[]): Achievement[] {
  const total = totalMinutes(sessions)
  const count = sessions.length
  const days = dailyRecords(sessions)
  const seasons = new Set(sessions.map((s) => seasonOf(new Date(s.completedAt))))

  return [
    { id: 'first-seed', name: '첫 씨앗', desc: '첫 세션을 완료했어요', unlocked: count >= 1 },
    { id: 'streak-7', name: '꾸준한 손길', desc: '7일 연속으로 공부했어요', unlocked: hasStreak(days, 7) },
    { id: 'hours-10', name: '10시간의 기록', desc: '누적 10시간을 채웠어요', unlocked: total >= 600 },
    { id: 'hours-50', name: '50시간의 기록', desc: '누적 50시간을 채웠어요', unlocked: total >= 3000 },
    { id: 'hours-100', name: '100시간의 기록', desc: '누적 100시간을 채웠어요', unlocked: total >= 6000 },
    { id: 'plants-30', name: '작은 숲', desc: '식물 30그루를 심었어요', unlocked: count >= 30 },
    { id: 'plants-100', name: '무성한 숲', desc: '식물 100그루를 심었어요', unlocked: count >= 100 },
    { id: 'four-seasons', name: '사계절의 정원사', desc: '봄·여름·가을·겨울 모두 공부했어요', unlocked: seasons.size === 4 },
  ]
}
