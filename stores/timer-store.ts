import { create } from 'zustand'
import { useSessionStore } from './session-store'

const DURATION_KEY = 'study-garden:duration'
export const DURATION_OPTIONS = [30, 45, 60, 90] as const

type TimerStatus = 'idle' | 'running' | 'paused'

interface TimerState {
  /** 설정된 집중 시간 (다음 세션부터 적용) */
  durationMin: number
  /** 진행 중인 세션의 집중 시간 */
  activeDurationMin: number
  status: TimerStatus
  /** running일 때의 종료 시각 (epoch ms) */
  endAt: number | null
  remainingSec: number
  justCompleted: boolean
  lastCompletedMin: number
  hydrate(): void
  start(): void
  pause(): void
  reset(): void
  tick(): void
  setDuration(min: number): void
  dismissComplete(): void
}

export const useTimerStore = create<TimerState>((set, get) => ({
  durationMin: 30,
  activeDurationMin: 30,
  status: 'idle',
  endAt: null,
  remainingSec: 30 * 60,
  justCompleted: false,
  lastCompletedMin: 30,

  hydrate: () => {
    const saved = Number(localStorage.getItem(DURATION_KEY))
    if (
      (DURATION_OPTIONS as readonly number[]).includes(saved) &&
      get().status === 'idle'
    ) {
      set({ durationMin: saved, remainingSec: saved * 60 })
    }
  },

  start: () => {
    const { status, remainingSec, durationMin } = get()
    const secs = status === 'paused' ? remainingSec : durationMin * 60
    set({
      status: 'running',
      endAt: Date.now() + secs * 1000,
      remainingSec: secs,
      ...(status !== 'paused' && { activeDurationMin: durationMin }),
    })
  },

  pause: () => {
    const { endAt } = get()
    if (endAt == null) return
    set({
      status: 'paused',
      endAt: null,
      remainingSec: Math.max(0, Math.round((endAt - Date.now()) / 1000)),
    })
  },

  reset: () =>
    set((s) => ({
      status: 'idle',
      endAt: null,
      remainingSec: s.durationMin * 60,
    })),

  tick: () => {
    const { status, endAt, activeDurationMin, durationMin } = get()
    if (status !== 'running' || endAt == null) return
    const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000))
    if (remaining <= 0) {
      useSessionStore.getState().add(activeDurationMin)
      set({
        status: 'idle',
        endAt: null,
        remainingSec: durationMin * 60,
        justCompleted: true,
        lastCompletedMin: activeDurationMin,
      })
    } else {
      set({ remainingSec: remaining })
    }
  },

  setDuration: (min) => {
    localStorage.setItem(DURATION_KEY, String(min))
    set((s) =>
      s.status === 'idle'
        ? { durationMin: min, remainingSec: min * 60 }
        : { durationMin: min },
    )
  },

  dismissComplete: () => set({ justCompleted: false }),
}))
