export interface Session {
  id: string
  /** ISO datetime of when the focus session was completed */
  completedAt: string
  durationMin: number
}

export type PlantStage = 'sprout' | 'leaf' | 'flower' | 'tree'

export interface PlantData {
  id: string
  plantedAt: string
  stage: PlantStage
  /** 0..2 — deterministic visual variation (petal color 등) */
  variant: number
  /** 0..1 — horizontal position in the garden */
  x: number
  /** 0..1 — 0 = front(크게), 1 = back(작게) */
  depth: number
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
