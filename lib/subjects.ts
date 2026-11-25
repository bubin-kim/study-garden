import type { SpeciesId, Subject } from '@/types'

/**
 * 과목 규칙 (docs/03 M3). 순수 함수만 — `node --test`로 직접 실행되므로
 * 런타임 import 금지 (`import type`만).
 */

export const MAX_SUBJECTS = 5
export const SPECIES: readonly SpeciesId[] = [0, 1, 2, 3, 4]

export function activeSubjects(subjects: Subject[]): Subject[] {
  return subjects.filter((s) => !s.archived)
}

/** 활성 과목이 쓰지 않는 첫 종. 다 쓰였으면 null */
export function freeSpecies(subjects: Subject[]): SpeciesId | null {
  const used = new Set(activeSubjects(subjects).map((s) => s.species))
  return SPECIES.find((sp) => !used.has(sp)) ?? null
}

/** subjectId → 종. 보관된 과목도 찾는다(지난 식물 유지). 모르는 id면 null */
export function speciesOf(subjects: Subject[], subjectId: string | undefined): SpeciesId | null {
  if (subjectId == null) return null
  return subjects.find((s) => s.id === subjectId)?.species ?? null
}
