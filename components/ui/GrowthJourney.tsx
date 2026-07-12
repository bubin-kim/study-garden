'use client'

import { motion } from 'framer-motion'

/* 씨앗 → 새싹 → 잎 → 꽃 → 나무. 레벨 진행을 성장 여정으로 보여준다. */

function SeedIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden>
      <ellipse cx="10" cy="11.5" rx="3.2" ry="4.2" fill="var(--trunk)" />
      <path
        d="M10 6.5 C11 5 12.8 4.4 14 4.4"
        stroke="var(--stem)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function SproutIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M10 17 C10 13 10 10 10 7.5"
        stroke="var(--stem)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse
        cx="6.9"
        cy="6.9"
        rx="3.3"
        ry="1.9"
        fill="var(--leaf)"
        transform="rotate(-32 6.9 6.9)"
      />
      <ellipse
        cx="13.1"
        cy="6.9"
        rx="3.3"
        ry="1.9"
        fill="var(--stem)"
        transform="rotate(32 13.1 6.9)"
      />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M10 18 C10 13 10 8 10 4"
        stroke="var(--stem)"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse
        cx="6.6"
        cy="11.5"
        rx="3.1"
        ry="1.7"
        fill="var(--leaf)"
        transform="rotate(-30 6.6 11.5)"
      />
      <ellipse
        cx="13.4"
        cy="8.5"
        rx="3.1"
        ry="1.7"
        fill="var(--stem)"
        transform="rotate(30 13.4 8.5)"
      />
      <ellipse cx="10" cy="3.6" rx="1.7" ry="2.4" fill="var(--leaf)" />
    </svg>
  )
}

function FlowerIcon() {
  const angles = [0, 72, 144, 216, 288]
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M10 18 C10 15 10 13 10 11"
        stroke="var(--stem)"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <g transform="translate(10 7.5)">
        {angles.map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-3"
            rx="1.9"
            ry="3"
            fill="var(--petal)"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle cx="0" cy="0" r="2" fill="var(--core)" />
      </g>
    </svg>
  )
}

function TreeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M10 18 C9.8 15 9.8 13 10 10"
        stroke="var(--trunk)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="6.5" cy="8.5" rx="3.6" ry="3" fill="var(--canopy-2)" />
      <ellipse cx="13.5" cy="8" rx="3.4" ry="2.9" fill="var(--canopy-2)" />
      <ellipse cx="10" cy="5.8" rx="5" ry="4" fill="var(--canopy)" />
    </svg>
  )
}

const STAGES = [
  { name: '씨앗', Icon: SeedIcon },
  { name: '새싹', Icon: SproutIcon },
  { name: '잎', Icon: LeafIcon },
  { name: '꽃', Icon: FlowerIcon },
  { name: '나무', Icon: TreeIcon },
]

interface GrowthJourneyProps {
  /** 현재 레벨 (1부터) */
  level: number
  /** 다음 레벨까지의 진행률 0..1 */
  progress: number
}

export function GrowthJourney({ level, progress }: GrowthJourneyProps) {
  const nodeIdx = Math.min(level, STAGES.length) - 1
  const beyond = level > STAGES.length - 1

  return (
    <div
      className="flex items-center"
      role="img"
      aria-label={`성장 여정 ${nodeIdx + 1}/${STAGES.length} 단계`}
    >
      {STAGES.map(({ name, Icon }, i) => {
        const passed = i < nodeIdx
        const current = i === nodeIdx
        return (
          <div key={name} className="contents">
            {i > 0 && (
              <div className="mx-1 h-[3px] flex-1 overflow-hidden rounded-full bg-line/70">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={false}
                  animate={{
                    width: `${i - 1 < nodeIdx ? 100 : i - 1 === nodeIdx && !beyond ? Math.round(progress * 100) : 0}%`,
                  }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              </div>
            )}
            <motion.span
              title={name}
              initial={false}
              animate={current ? { scale: 1.12 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                current
                  ? 'bg-primary-soft ring-2 ring-primary/45'
                  : passed
                    ? 'bg-primary-soft/70'
                    : 'border border-line bg-transparent opacity-45 saturate-50'
              }`}
            >
              <Icon />
            </motion.span>
          </div>
        )
      })}
    </div>
  )
}
