import type { Session, Subject } from '@/types'

/**
 * 예시 정원 (docs/04) — 빈 정원 첫 방문자가 구경하는 "한 달 가꾼 정원".
 * 사용자 데이터와 무관한 고정 시드이며, 오늘 날짜에 의존하지 않는다
 * (투표 기간 12/1~12/9에 "이번 달"로 만들면 거의 빈 정원이 되기 때문).
 * 시드 구성은 docs/04 측정 1의 후보 B — 2026-11-25 사용자 승인.
 */
export interface DemoGarden {
  /** 예시가 속한 달 — getGardenPlants에 그대로 넘긴다 */
  year: number
  /** 0-based */
  month: number
  sessions: Session[]
  subjects: Subject[]
  /** 달성 꽃 날짜 'YYYY-MM-DD' */
  achieved: string[]
}

const YEAR = 2026
const MONTH = 10 // 11월
const DAYS = 30

const SUBJECTS: Subject[] = [
  { id: 'demo-la', name: '선형대수', species: 0 },
  { id: 'demo-ec', name: '경제학', species: 1 },
  { id: 'demo-ph', name: '물리', species: 2 },
  { id: 'demo-en', name: '영어', species: 3 },
]
/** 날마다 돌아가며 붙는 과목 — undefined는 과목 없이 */
const ROTATION = ['demo-la', 'demo-en', 'demo-ph', 'demo-la', 'demo-ec', undefined, 'demo-en', 'demo-la', 'demo-ph', 'demo-ec']
const LENGTHS = [30, 45, 30, 60]
/** 핵심 목표를 모두 마친 날 — 모두 공부한 날 중에서 */
const ACHIEVED_DAYS = [2, 4, 8, 11, 16, 19, 22, 26]

const dateKey = (d: number) => `${YEAR}-${String(MONTH + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

/** 7일마다, 3일마다 쉬고 나머지 날은 30~60분 한 번 (측정 1 후보 B) */
const studies = (d: number) => d % 7 !== 0 && d % 3 !== 0

export function demoGarden(): DemoGarden {
  const sessions: Session[] = []
  for (let d = 1; d <= DAYS; d++) {
    if (!studies(d)) continue
    const subjectId = ROTATION[(d * 2) % ROTATION.length]
    sessions.push({
      id: `demo-${d}`,
      completedAt: new Date(YEAR, MONTH, d, 10).toISOString(),
      durationMin: LENGTHS[d % LENGTHS.length],
      ...(subjectId && { subjectId }),
    })
  }
  return {
    year: YEAR,
    month: MONTH,
    sessions,
    subjects: SUBJECTS.map((s) => ({ ...s })),
    achieved: ACHIEVED_DAYS.map(dateKey),
  }
}
