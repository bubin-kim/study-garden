'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Plant } from '@/components/garden/Plant'
import { formatDuration } from '@/lib/time'
import { useTimerStore } from '@/stores/timer-store'

export function SessionCompleteOverlay() {
  const justCompleted = useTimerStore((s) => s.justCompleted)
  const lastCompletedMin = useTimerStore((s) => s.lastCompletedMin)
  const dismiss = useTimerStore((s) => s.dismissComplete)

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
            <Button className="mt-6 w-full" onClick={dismiss}>
              정원으로
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
