import { create } from 'zustand'
import type { Season } from '@/types'
import { seasonOf } from '@/lib/season'
import { getSeasonPreference, setSeasonPreference } from '@/lib/storage/season'

interface SeasonState {
  /** 고정된 계절. null이면 자동(날짜 기반) */
  preference: Season | null
  /** 날짜 기반 계절 — 렌더 중 Date를 만들지 않도록 hydrate 시점에 한 번 계산 */
  autoSeason: Season | null
  hydrated: boolean
  hydrate(): void
  setPreference(season: Season | null): void
}

export const useSeasonStore = create<SeasonState>((set) => ({
  preference: null,
  autoSeason: null,
  hydrated: false,
  hydrate: () =>
    set({
      preference: getSeasonPreference(),
      autoSeason: seasonOf(new Date()),
      hydrated: true,
    }),
  setPreference: (season) => {
    setSeasonPreference(season)
    set({ preference: season })
  },
}))
