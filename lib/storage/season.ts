import type { Season } from '@/types'

/**
 * 계절 고정 선호. "자동(날짜 기반)"은 키 없음으로 표현한다 —
 * 기존 사용자와 자동 선택 사용자가 같은 상태가 되도록 (docs/01).
 */
const KEY = 'study-garden:season'

const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter']

export function getSeasonPreference(): Season | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  return SEASONS.includes(raw as Season) ? (raw as Season) : null
}

export function setSeasonPreference(season: Season | null) {
  if (season === null) localStorage.removeItem(KEY)
  else localStorage.setItem(KEY, season)
}
