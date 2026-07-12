'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface SheetProps {
  open: boolean
  onClose(): void
  title?: string
  children: React.ReactNode
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-[var(--scrim)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border-t border-line/60 bg-surface px-6 pb-[calc(2.25rem+env(safe-area-inset-bottom))] pt-3 shadow-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div aria-hidden className="mx-auto mb-4 h-1 w-9 rounded-full bg-line" />
            {title && (
              <h2 className="mb-4 text-[17px] font-semibold tracking-tight">
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
