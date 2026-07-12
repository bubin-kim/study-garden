import { create } from 'zustand'
import type { Session } from '@/types'
import { localSessionRepository } from '@/lib/storage/local'

interface SessionState {
  sessions: Session[]
  hydrated: boolean
  hydrate(): void
  add(durationMin: number): void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  hydrated: false,
  hydrate: () => set({ sessions: localSessionRepository.getAll(), hydrated: true }),
  add: (durationMin) => {
    const session: Session = {
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
      durationMin,
    }
    localSessionRepository.add(session)
    set({ sessions: [...get().sessions, session] })
  },
}))
