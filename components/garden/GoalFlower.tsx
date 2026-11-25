'use client'

import { motion, useReducedMotion } from 'framer-motion'

const PETAL = 'M0 0 C-3.8 -3 -3.6 -8.4 0 -11 C3.6 -8.4 3.8 -3 0 0 Z'
const ANGLES = [0, 72, 144, 216, 288]

/**
 * 목표를 달성한 날 피는 꽃 (docs/03 M2). 기준점 (0,0)이 뿌리.
 * 핵심 목표의 별과 이어지도록 꽃잎 5장이 별 모양으로 벌어지고, 뒤에 은은한 빛무리가 있다.
 * 달성한 순간 마운트되므로 등장 스프링이 곧 "피어나는" 연출이다.
 */
export function GoalFlower({ tilt = 0 }: { tilt?: number }) {
  const reduce = useReducedMotion()
  const sway = {
    '--sway-a': '1.6deg',
    animationDuration: `${5.2 + tilt}s`,
    animationDelay: `${-(Math.abs(tilt) * 4).toFixed(2)}s`,
  } as React.CSSProperties

  return (
    <motion.g
      initial={reduce ? false : { scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 13, delay: 0.15 }}
      // SVG에서는 framer가 style.transformOrigin을 50% 50%로 덮어쓴다(실측) — originX/Y로 뿌리 기준
      style={{ transformBox: 'fill-box', originX: 0.5, originY: 1 }}
    >
      <g transform={`rotate(${tilt * 5})`}>
        <ellipse cx="0" cy="1" rx="7" ry="2" fill="var(--plant-shadow)" />
        <g className="plant-sway" style={sway}>
          <path
            d="M0 0 C0.4 -7 0.3 -14 0 -21"
            stroke="var(--stem)"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M0 -7 C-3 -7.4 -6.6 -9.4 -8 -13 C-4.4 -13.4 -1.4 -11 0 -7 Z" fill="var(--leaf)" />
          <path d="M0 -11 C2.6 -11.6 5.8 -13.8 6.8 -17 C3.6 -17.2 1 -15 0 -11 Z" fill="var(--stem)" />
          <g transform="translate(0 -26)">
            {/* 빛무리 0.22 — 0.5는 다크에서 탁한 원으로 보였다 (docs/03 M2 시안 B) */}
            <circle r="15" fill="var(--core)" opacity="0.22" />
            {ANGLES.map((deg) => (
              <path key={deg} d={PETAL} fill="var(--petal)" transform={`rotate(${deg})`} />
            ))}
            {ANGLES.map((deg) => (
              <path
                key={`in-${deg}`}
                d={PETAL}
                fill="var(--petal-2)"
                transform={`rotate(${deg}) scale(0.5)`}
              />
            ))}
            <circle r="2.6" fill="var(--core)" />
            <circle cx="-0.8" cy="-0.8" r="0.8" fill="rgba(255,255,255,0.5)" />
          </g>
        </g>
      </g>
    </motion.g>
  )
}
