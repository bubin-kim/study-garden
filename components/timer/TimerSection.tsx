'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatClock } from '@/lib/time'
import { useTimerStore } from '@/stores/timer-store'
import { useUiStore } from '@/stores/ui-store'

export function TimerSection() {
  const status = useTimerStore((s) => s.status)
  const remainingSec = useTimerStore((s) => s.remainingSec)
  const activeDurationMin = useTimerStore((s) => s.activeDurationMin)
  const durationMin = useTimerStore((s) => s.durationMin)
  const start = useTimerStore((s) => s.start)
  const pause = useTimerStore((s) => s.pause)
  const reset = useTimerStore((s) => s.reset)
  const openSettings = useUiStore((s) => s.openSettings)

  const [confirmReset, setConfirmReset] = useState(false)
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => useTimerStore.getState().tick(), 500)
    return () => clearInterval(id)
  }, [status])

  useEffect(() => {
    return () => {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
    }
  }, [])

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      confirmTimeout.current = setTimeout(() => setConfirmReset(false), 3000)
      return
    }
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
    setConfirmReset(false)
    reset()
  }

  const idle = status === 'idle'

  return (
    <section className="flex flex-col items-center pt-8">
      <button
        onClick={openSettings}
        disabled={!idle}
        className="flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-primary-soft hover:text-ink disabled:pointer-events-none"
      >
        {idle ? durationMin : activeDurationMin}분 집중
        {idle && <ChevronDown size={14} />}
      </button>

      <p className="mt-3 text-[76px] font-extralight leading-none tracking-[-0.03em] tabular-nums">
        {formatClock(remainingSec)}
      </p>

      <div className="mt-9 flex items-center gap-3">
        {idle && (
          <Button size="lg" className="glow-breathe" onClick={start}>
            집중 시작
          </Button>
        )}
        {status === 'running' && (
          <Button size="lg" variant="soft" onClick={pause}>
            일시정지
          </Button>
        )}
        {status === 'paused' && (
          <Button size="lg" onClick={start}>
            계속하기
          </Button>
        )}
        {!idle && (
          <Button variant="ghost" onClick={handleReset}>
            {confirmReset ? '씨앗이 사라져요 · 한 번 더 누르면 초기화' : '그만하기'}
          </Button>
        )}
      </div>
    </section>
  )
}
