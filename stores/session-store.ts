import { create } from 'zustand'
import type { Session } from '@/types'
import { localSessionRepository } from '@/lib/storage/local'

interface SessionState {
  sessions: Session[]
  hydrated: boolean
  hydrate(): void
  add(durationMin: number, meta?: { subjectId?: string; taskId?: string }): void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  hydrated: false,
  hydrate: () => set({ sessions: localSessionRepository.getAll(), hydrated: true }),
  add: (durationMin, meta) => {
    const session: Session = {
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
      durationMin,
      ...(meta?.subjectId && { subjectId: meta.subjectId }),
      ...(meta?.taskId && { taskId: meta.taskId }),
    }
    localSessionRepository.add(session)
    set({ sessions: [...get().sessions, session] })
  },
}))
