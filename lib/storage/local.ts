import type { Session } from '@/types'
import type { SessionRepository } from './repository'

const KEY = 'study-garden:sessions'

export const localSessionRepository: SessionRepository = {
  getAll(): Session[] {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Session[]
    } catch {
      return []
    }
  },
  add(session: Session) {
    const all = this.getAll()
    all.push(session)
    localStorage.setItem(KEY, JSON.stringify(all))
  },
}
