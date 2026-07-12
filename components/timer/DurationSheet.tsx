'use client'

import { Check } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { DURATION_OPTIONS, useTimerStore } from '@/stores/timer-store'
import { useUiStore } from '@/stores/ui-store'

export function DurationSheet() {
  const open = useUiStore((s) => s.settingsOpen)
  const close = useUiStore((s) => s.closeSettings)
  const durationMin = useTimerStore((s) => s.durationMin)
  const setDuration = useTimerStore((s) => s.setDuration)
  const idle = useTimerStore((s) => s.status === 'idle')

  return (
    <Sheet open={open} onClose={close} title="집중 시간">
      <ul>
        {DURATION_OPTIONS.map((min) => (
          <li key={min} className="border-b border-line last:border-b-0">
            <button
              onClick={() => {
                setDuration(min)
                close()
              }}
              className="-mx-3 flex w-[calc(100%+1.5rem)] items-center justify-between rounded-[14px] px-3 py-4 text-[15px] transition-colors duration-200 hover:bg-primary-soft/50"
            >
              <span className={min === durationMin ? 'font-semibold' : ''}>
                {min}분
              </span>
              {min === durationMin && (
                <Check size={18} className="text-primary" />
              )}
            </button>
          </li>
        ))}
      </ul>
      {!idle && (
        <p className="mt-4 text-[13px] text-muted">
          진행 중인 타이머에는 다음 세션부터 적용돼요.
        </p>
      )}
    </Sheet>
  )
}
