export interface LevelInfo {
  level: number
  name: string
  /** 이 레벨 시작 누적 분 */
  minMinutes: number
  /** 다음 레벨 시작 누적 분 (최고 레벨이면 null) */
  nextMinutes: number | null
  /** 다음 레벨까지의 진행률 0..1 */
  progress: number
  /** 다음 레벨까지 남은 분 (최고 레벨이면 null) */
  remainingMin: number | null
}

const LEVELS: { name: string; min: number }[] = [
  { name: 'Seed', min: 0 },
  { name: 'Sprout', min: 300 }, // 5시간
  { name: 'Leaf', min: 900 }, // 15시간
  { name: 'Flower', min: 1800 }, // 30시간
  { name: 'Tree', min: 3600 }, // 60시간
  { name: 'Forest Keeper', min: 7200 }, // 120시간
  { name: 'Nature Master', min: 15000 }, // 250시간
  { name: 'Ancient Forest', min: 30000 }, // 500시간
]

export function getLevel(totalMin: number): LevelInfo {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalMin >= LEVELS[i].min) idx = i
  }
  const cur = LEVELS[idx]
  const next = LEVELS[idx + 1] ?? null
  return {
    level: idx + 1,
    name: cur.name,
    minMinutes: cur.min,
    nextMinutes: next ? next.min : null,
    progress: next ? (totalMin - cur.min) / (next.min - cur.min) : 1,
    remainingMin: next ? next.min - totalMin : null,
  }
}
