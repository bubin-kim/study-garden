import { create } from 'zustand'
import type { Task } from '@/types'
import { canMarkCore, carryOver, isDayAchieved, isEditable } from '@/lib/tasks'
import { getTasks, saveTasks } from '@/lib/storage/tasks'
import { dateKey } from '@/lib/time'

export const MAX_TITLE = 60

interface TaskState {
  tasks: Task[]
  /** 로컬 'YYYY-MM-DD'. 렌더 중 Date를 만들지 않도록 hydrate·포커스 복귀 시점에 계산 */
  today: string | null
  hydrated: boolean
  /** 이번 동작으로 오늘이 막 달성됐는지 — 꽃이 피는 순간의 안내용. 화면이 읽고 지운다 */
  justAchieved: boolean
  clearJustAchieved(): void
  hydrate(): void
  /** 자정을 넘겨 앱을 다시 볼 때 오늘을 갱신 */
  refreshToday(): void
  add(title: string, subjectId?: string): void
  setSubject(id: string, subjectId: string | undefined): void
  toggleDone(id: string): void
  toggleCore(id: string): void
  remove(id: string): void
  /** 어제 남은 할 일을 오늘로 복사. 가져온 개수 반환 */
  carryOverFromYesterday(): number
}

export const useTaskStore = create<TaskState>((set, get) => {
  /** 저장 + 상태 반영. 오늘이 미달성 → 달성으로 바뀌는 순간에만 justAchieved를 켠다 */
  const commit = (next: Task[], today: string) => {
    const was = isDayAchieved(get().tasks, today)
    saveTasks(next)
    const now = isDayAchieved(next, today)
    set({ tasks: next, today, ...(now !== was && { justAchieved: now }) })
  }

  /** 오늘 할 일만 바꿀 수 있다 — 지난 날은 읽기 전용 (docs/03) */
  const updateToday = (id: string, fn: (t: Task, all: Task[], today: string) => Task) => {
    const today = dateKey(new Date())
    const all = get().tasks
    commit(
      all.map((t) => (t.id === id && isEditable(t, today) ? fn(t, all, today) : t)),
      today,
    )
  }

  return {
    tasks: [],
    today: null,
    hydrated: false,
    justAchieved: false,
    clearJustAchieved: () => set({ justAchieved: false }),
    hydrate: () => set({ tasks: getTasks(), today: dateKey(new Date()), hydrated: true }),
    refreshToday: () => {
      const today = dateKey(new Date())
      if (today !== get().today) set({ today })
    },
    add: (title, subjectId) => {
      const trimmed = title.trim().slice(0, MAX_TITLE)
      if (!trimmed) return
      const task: Task = {
        id: crypto.randomUUID(),
        date: dateKey(new Date()),
        title: trimmed,
        ...(subjectId && { subjectId }),
        core: false,
        done: false,
        createdAt: new Date().toISOString(),
      }
      commit([...get().tasks, task], task.date)
    },
    setSubject: (id, subjectId) =>
      updateToday(id, (t) => {
        const { subjectId: _old, ...rest } = t
        void _old
        return subjectId ? { ...rest, subjectId } : rest
      }),
    toggleDone: (id) =>
      updateToday(id, (t) =>
        t.done
          ? { ...t, done: false, doneAt: undefined }
          : { ...t, done: true, doneAt: new Date().toISOString() },
      ),
    toggleCore: (id) =>
      updateToday(id, (t, all, today) =>
        t.core ? { ...t, core: false } : canMarkCore(all, today) ? { ...t, core: true } : t,
      ),
    remove: (id) => {
      const today = dateKey(new Date())
      commit(
        get().tasks.filter((t) => !(t.id === id && isEditable(t, today))),
        today,
      )
    },
    carryOverFromYesterday: () => {
      const today = dateKey(new Date())
      const added = carryOver(get().tasks, today, () => crypto.randomUUID(), new Date().toISOString())
      if (added.length === 0) return 0
      commit([...get().tasks, ...added], today)
      return added.length
    },
  }
})
