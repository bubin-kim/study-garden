'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Plant } from '@/components/garden/Plant'
import { formatDuration } from '@/lib/time'
import { useTaskStore } from '@/stores/task-store'
import { useTimerStore } from '@/stores/timer-store'

export function SessionCompleteOverlay() {
  const justCompleted = useTimerStore((s) => s.justCompleted)
  const lastCompletedMin = useTimerStore((s) => s.lastCompletedMin)
  const dismiss = useTimerStore((s) => s.dismissComplete)
  const lastTaskId = useTimerStore((s) => s.lastFocus.taskId)
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === lastTaskId))
  const today = useTaskStore((s) => s.today)
  const toggleDone = useTaskStore((s) => s.toggleDone)
  // 오늘 할 일이었을 때만 묻는다 — 지난 날은 읽기 전용
  const askTask = task && task.date === today ? task : undefined

  return (
    <AnimatePresence>
      {justCompleted && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] px-6 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-full max-w-xs rounded-[24px] border border-line/60 bg-surface p-8 text-center shadow-float"
            initial={{ scale: 0.92, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          >
            <svg viewBox="-24 -32 48 40" className="mx-auto h-24 w-24">
              <Plant stage="sprout" delay={0.25} />
            </svg>
            <h2 className="mt-2 text-[18px] font-semibold">새싹이 심어졌어요</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
              {formatDuration(lastCompletedMin)} 집중 완료.
              <br />
              잠시 쉬었다가 돌아와요.
            </p>
            {askTask && (
              <div className="mt-5 rounded-[16px] bg-primary-soft px-4 py-3 text-left">
                <p className="truncate text-[13px] text-muted">{askTask.title}</p>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={askTask.done}
                  onClick={() => toggleDone(askTask.id)}
                  className="mt-1.5 flex items-center gap-2 text-[14px] font-medium"
                >
                  <span
                    className={`grid size-5 place-items-center rounded-full border-2 transition-colors ${
                      askTask.done ? 'border-primary bg-primary text-on-primary' : 'border-muted/40'
                    }`}
                  >
                    {askTask.done && <Check size={11} strokeWidth={3} />}
                  </span>
                  이 할 일도 마쳤어요
                </button>
              </div>
            )}
            <Button className="mt-6 w-full" onClick={dismiss}>
              정원으로
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
