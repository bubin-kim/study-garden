import type { PlantData, PlantStage, Session } from '@/types'

/**
 * 식물은 항상 새싹으로 심어지고, "심은 이후 누적된 공부 시간(분)"으로 자란다.
 * 세션 길이를 고를 때 유불리가 생기지 않도록 세션 자체의 길이는 단계에 쓰지 않는다.
 */
const LEAF_AT = 90
const FLOWER_AT = 270
const TREE_AT = 540

function stageFor(minutesAfterPlanting: number): PlantStage {
  if (minutesAfterPlanting >= TREE_AT) return 'tree'
  if (minutesAfterPlanting >= FLOWER_AT) return 'flower'
  if (minutesAfterPlanting >= LEAF_AT) return 'leaf'
  return 'sprout'
}

function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const GOLDEN = 0.6180339887

/** 해당 연/월(0-based)의 정원에 심긴 식물 목록. 세션 목록만으로 결정적으로 계산된다. */
export function getGardenPlants(
  sessions: Session[],
  year: number,
  month: number,
): PlantData[] {
  const sorted = [...sessions].sort((a, b) =>
    a.completedAt.localeCompare(b.completedAt),
  )

  // 각 세션 이후에 누적된 공부 분 (뒤에서부터 누적)
  const growth: number[] = new Array(sorted.length)
  let after = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    growth[i] = after
    after += sorted[i].durationMin
  }

  const plants: PlantData[] = []
  let idx = 0
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i].completedAt)
    if (d.getFullYear() !== year || d.getMonth() !== month) continue
    plants.push({
      id: sorted[i].id,
      plantedAt: sorted[i].completedAt,
      stage: stageFor(growth[i]),
      variant: hashCode(sorted[i].id) % 3,
      // 황금비 수열로 정원 전체에 고르게 흩뿌린다
      x: (0.11 + idx * GOLDEN) % 1,
      depth: (hashCode(sorted[i].id + 'd') % 100) / 100,
    })
    idx++
  }
  return plants
}
