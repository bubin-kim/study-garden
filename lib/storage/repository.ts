import type { Session } from '@/types'

/**
 * 모든 데이터 접근은 이 인터페이스를 거친다.
 * 추후 DB를 붙일 때 이 인터페이스의 구현체만 추가하면 된다.
 */
export interface SessionRepository {
  getAll(): Session[]
  add(session: Session): void
}
