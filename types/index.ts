export interface Session {
  id: string
  /** ISO datetime of when the focus session was completed */
  completedAt: string
  durationMin: number
  /** docs/03 M3 — 없으면 기존 동작(variant 기반 식물) */
  subjectId?: string
  /** docs/03 M3 — 이 세션이 어떤 할 일을 위한 것이었는지 */
  taskId?: string
}

export type PlantStage = 'sprout' | 'leaf' | 'flower' | 'tree'

export interface PlantData {
  id: string
  plantedAt: string
  stage: PlantStage
  /** 0..2 — deterministic visual variation (petal color 등) */
  variant: number
  /** 과목 식물 종 — null이면 기존 모습 (docs/03 M3) */
  species: SpeciesId | null
  /** 0..1 — horizontal position in the garden */
  x: number
  /** 0..1 — 0 = front(크게), 1 = back(작게) */
  depth: number
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

/** 오늘의 목표 체크리스트 항목 (docs/03). 할 일은 `date` 하루에만 속한다. */
export interface Task {
  id: string
  /** 로컬 기준 'YYYY-MM-DD' — 할 일이 속한 날 */
  date: string
  title: string
  subjectId?: string
  /** 핵심 목표 여부 — 하루 최대 3개, 모두 완료하면 그날 달성 */
  core: boolean
  done: boolean
  /** ISO */
  doneAt?: string
  /** ISO — 목록 정렬용 */
  createdAt: string
  /** "어제 남은 할 일 가져오기"로 복사된 경우 원본 할 일 id (중복 가져오기 방지) */
  carriedFrom?: string
}

/** 목표를 달성한 날 정원 앞줄에 피는 꽃 (docs/03 M2) */
export interface GoalFlowerData {
  /** 달성한 날 'YYYY-MM-DD' — key 겸 위치 시드 */
  date: string
  /** 0..1 — 가로 위치 */
  x: number
  /** -1..1 — 살짝 기울기 (개체 차이) */
  tilt: number
}

/** 과목 식물 종 — 0..4 (docs/03 M3) */
export type SpeciesId = 0 | 1 | 2 | 3 | 4

export interface Subject {
  id: string
  name: string
  /** 활성 과목끼리는 고유. 보관된 과목의 지난 식물은 자기 종을 유지한다 */
  species: SpeciesId
  /** 삭제 대신 보관 — 과거 세션의 식물 종이 바뀌지 않게 */
  archived?: boolean
}

/** 시험 (docs/03 M4) — 남은 날만 보여준다 */
export interface Exam {
  id: string
  name: string
  /** 로컬 'YYYY-MM-DD' */
  date: string
}
