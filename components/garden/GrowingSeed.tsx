'use client'

import { motion } from 'framer-motion'

/** 타이머가 도는 동안 정원 앞쪽에 심어져 있는 씨앗. 숨 쉬듯 천천히 맥동한다. */
export function GrowingSeed() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="14" ry="4" fill="var(--ground-2)" />
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ellipse cx="0" cy="-5" rx="4.5" ry="5.5" fill="var(--trunk)" />
        <path
          d="M0 -10 C1.5 -13 4 -14 6 -14"
          stroke="var(--stem)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
    </g>
  )
}
