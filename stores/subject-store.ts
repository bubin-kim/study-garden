import { create } from 'zustand'
import type { Subject } from '@/types'
import { activeSubjects, freeSpecies, MAX_SUBJECTS } from '@/lib/subjects'
import { getSubjects, saveSubjects } from '@/lib/storage/subjects'

export const MAX_SUBJECT_NAME = 12

interface SubjectState {
  subjects: Subject[]
  hydrated: boolean
  hydrate(): void
  add(name: string): void
  rename(id: string, name: string): void
  /** 삭제 대신 보관 — 지난 식물의 종을 지킨다 */
  archive(id: string): void
}

export const useSubjectStore = create<SubjectState>((set, get) => {
  const commit = (next: Subject[]) => {
    saveSubjects(next)
    set({ subjects: next })
  }
  return {
    subjects: [],
    hydrated: false,
    hydrate: () => set({ subjects: getSubjects(), hydrated: true }),
    add: (name) => {
      const trimmed = name.trim().slice(0, MAX_SUBJECT_NAME)
      const all = get().subjects
      const species = freeSpecies(all)
      if (!trimmed || species == null || activeSubjects(all).length >= MAX_SUBJECTS) return
      commit([...all, { id: crypto.randomUUID(), name: trimmed, species }])
    },
    rename: (id, name) => {
      const trimmed = name.trim().slice(0, MAX_SUBJECT_NAME)
      if (!trimmed) return
      commit(get().subjects.map((s) => (s.id === id ? { ...s, name: trimmed } : s)))
    },
    archive: (id) => commit(get().subjects.map((s) => (s.id === id ? { ...s, archived: true } : s))),
  }
})
