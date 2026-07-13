import { create } from 'zustand'
import { useSessionStore } from './session-store'

const DURATION_KEY = 'study-garden:duration'
const TIMER_KEY = 'study-garden:timer'
export const DURATION_OPTIONS = [30, 45, 60, 90] as const

type TimerStatus = 'idle' | 'running' | 'paused'

/** 새로고침·브라우저 종료에도 진행 중인 씨앗을 잃지 않도록 저장하는 스냅샷 */
interface SavedTimer {
  status: 'running' | 'paused'
  endAt: number | null
  remainingSec: number
  activeDurationMin: number
}

function saveTimer(t: SavedTimer) {
  localStorage.setItem(TIMER_KEY, JSON.stringify(t))
}

function clearSavedTimer() {
  localStorage.removeItem(TIMER_KEY)
}

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

    // 진행 중이던 세션 복원 — 자리를 비운 사이 끝났으면 완주로 인정하고 심는다
    try {
      const raw = localStorage.getItem(TIMER_KEY)
      if (!raw) return
      const t = JSON.parse(raw) as SavedTimer
      if (t.status === 'running' && t.endAt != null) {
        const remaining = Math.round((t.endAt - Date.now()) / 1000)
        if (remaining > 0) {
          set({
            status: 'running',
            endAt: t.endAt,
            remainingSec: remaining,
            activeDurationMin: t.activeDurationMin,
          })
        } else {
          useSessionStore.getState().add(t.activeDurationMin)
          clearSavedTimer()
          set({ justCompleted: true, lastCompletedMin: t.activeDurationMin })
        }
      } else if (t.status === 'paused' && t.remainingSec > 0) {
        set({
          status: 'paused',
          endAt: null,
          remainingSec: t.remainingSec,
          activeDurationMin: t.activeDurationMin,
        })
      }
    } catch {
      clearSavedTimer()
    }
  },

  start: () => {
    const { status, remainingSec, durationMin } = get()
    const secs = status === 'paused' ? remainingSec : durationMin * 60
    const endAt = Date.now() + secs * 1000
    set({
      status: 'running',
      endAt,
      remainingSec: secs,
      ...(status !== 'paused' && { activeDurationMin: durationMin }),
    })
    saveTimer({
      status: 'running',
      endAt,
      remainingSec: secs,
      activeDurationMin: get().activeDurationMin,
    })
  },

  pause: () => {
    const { endAt } = get()
    if (endAt == null) return
    const remainingSec = Math.max(0, Math.round((endAt - Date.now()) / 1000))
    set({ status: 'paused', endAt: null, remainingSec })
    saveTimer({
      status: 'paused',
      endAt: null,
      remainingSec,
      activeDurationMin: get().activeDurationMin,
    })
  },

  reset: () => {
    clearSavedTimer()
    set((s) => ({
      status: 'idle',
      endAt: null,
      remainingSec: s.durationMin * 60,
    }))
  },

  tick: () => {
    const { status, endAt, activeDurationMin, durationMin } = get()
    if (status !== 'running' || endAt == null) return
    const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000))
    if (remaining <= 0) {
      useSessionStore.getState().add(activeDurationMin)
      clearSavedTimer()
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
