import type { Task } from '@/types'

/**
 * 오늘의 목표 체크리스트 규칙 (docs/03). 순수 함수만.
 *
 * 주의: 이 파일은 `node --test`로 직접 실행되므로 **런타임 import를 두지 않는다**
 * (`import type`만 허용). 확장자 없는 상대 import는 Node에서 ERR_MODULE_NOT_FOUND —
 * docs/03 "테스트 · 골든 케이스" 실측 참조. 날짜 키 생성은 호출 쪽에서
 * `lib/time.ts`의 `dateKey`로 만든다.
 */

export const MAX_CORE = 3

export function tasksOn(tasks: Task[], date: string): Task[] {
  return tasks.filter((t) => t.date === date)
}

/** 그날 핵심 목표가 1개 이상 있고 전부 완료했으면 달성. 일반 할 일은 판정에 영향 없음. */
export function isDayAchieved(tasks: Task[], date: string): boolean {
  const core = tasksOn(tasks, date).filter((t) => t.core)
  return core.length > 0 && core.every((t) => t.done)
}

/** 오늘 할 일만 수정할 수 있다 — 지난 날을 나중에 체크해 달성을 만드는 것을 막는다. */
export function isEditable(task: Task, today: string): boolean {
  return task.date === today
}

export function canMarkCore(tasks: Task[], today: string): boolean {
  return tasksOn(tasks, today).filter((t) => t.core).length < MAX_CORE
}

/** 'YYYY-MM-DD'의 달력상 전날 */
export function previousDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const prev = new Date(y, m - 1, d - 1)
  return [
    prev.getFullYear(),
    String(prev.getMonth() + 1).padStart(2, '0'),
    String(prev.getDate()).padStart(2, '0'),
  ].join('-')
}

/**
 * 어제 남은(미완료) 할 일을 오늘로 복사한 새 항목들. 원본은 그대로 둔다.
 * 핵심 지정은 가져오지 않고(오늘 다시 고른다), 이미 가져온 항목은 제외한다.
 * id·시각은 주입받아 결정적으로 테스트할 수 있게 한다.
 */
export function carryOver(
  tasks: Task[],
  today: string,
  newId: () => string,
  nowIso: string,
): Task[] {
  const yesterday = previousDay(today)
  const alreadyCarried = new Set(
    tasksOn(tasks, today)
      .map((t) => t.carriedFrom)
      .filter((id): id is string => id != null),
  )
  return tasksOn(tasks, yesterday)
    .filter((t) => !t.done && !alreadyCarried.has(t.id))
    .map((t) => ({
      id: newId(),
      date: today,
      title: t.title,
      ...(t.subjectId != null && { subjectId: t.subjectId }),
      core: false,
      done: false,
      createdAt: nowIso,
      carriedFrom: t.id,
    }))
}

/** 해당 연/월(0-based)에 목표를 달성한 날들, 오름차순. */
export function achievedDates(tasks: Task[], year: number, month: number): string[] {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`
  const dates = new Set(tasks.filter((t) => t.date.startsWith(prefix)).map((t) => t.date))
  return [...dates].filter((d) => isDayAchieved(tasks, d)).sort()
}
