'use client'

import { motion } from 'framer-motion'
import type { PlantStage } from '@/types'

const PETAL_COLORS = ['var(--petal)', 'var(--petal-2)', 'var(--accent)']

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300]

/** 곡선이 살아 있는 잎사귀 한 장. 기준점 (0,0)이 줄기에 붙는 자리, 끝이 왼쪽 위를 향한다. */
function LeafBlade({
  x,
  y,
  angle,
  size = 1,
  flip = false,
  fill,
}: {
  x: number
  y: number
  angle: number
  size?: number
  flip?: boolean
  fill: string
}) {
  return (
    <path
      d="M0 0 C-4.5 -0.6 -9.6 -3 -12 -8.2 C-8.4 -10.6 -3 -8.6 -1 -3.8 C-0.3 -2.4 0 -1.2 0 0 Z"
      fill={fill}
      transform={`translate(${x} ${y}) rotate(${angle}) scale(${flip ? -size : size} ${size})`}
    />
  )
}

function SproutShape() {
  return (
    <g>
      <path
        d="M0 0 C0.4 -6 0.4 -12 0 -17"
        stroke="var(--stem)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <LeafBlade x={0} y={-15.5} angle={8} size={1.05} fill="var(--leaf)" />
      <LeafBlade x={0} y={-15.5} angle={-8} size={0.95} flip fill="var(--stem)" />
    </g>
  )
}

function LeafShape() {
  return (
    <g>
      <path
        d="M0 0 C0.6 -12 0.6 -24 0 -34"
        stroke="var(--stem)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <LeafBlade x={0} y={-13} angle={14} size={1.15} fill="var(--leaf)" />
      <LeafBlade x={0} y={-20} angle={-14} size={1.1} flip fill="var(--stem)" />
      <LeafBlade x={0} y={-27} angle={10} size={0.95} fill="var(--leaf)" />
      <path
        d="M0 -33 C-2.6 -36 -2.2 -40.5 0 -42.5 C2.2 -40.5 2.6 -36 0 -33 Z"
        fill="var(--leaf)"
      />
    </g>
  )
}

function FlowerShape({ variant }: { variant: number }) {
  const petal = PETAL_COLORS[variant % PETAL_COLORS.length]
  return (
    <g>
      <path
        d="M0 0 C0.6 -16 0.6 -30 0 -41"
        stroke="var(--stem)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <LeafBlade x={0} y={-16} angle={12} size={1.15} fill="var(--leaf)" />
      <LeafBlade x={0} y={-24} angle={-12} size={1.05} flip fill="var(--stem)" />
      <g transform="translate(0 -48)">
        <g
          className="plant-sway"
          style={{ '--sway-a': '2.1deg', animationDuration: '3.9s' } as React.CSSProperties}
        >
          {PETAL_ANGLES.map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="-6.4"
              rx="3.2"
              ry="6.2"
              fill={petal}
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="3.7" fill="var(--core)" />
          <circle cx="-1.1" cy="-1.1" r="1.1" fill="rgba(255,255,255,0.45)" />
        </g>
      </g>
    </g>
  )
}

function TreeShape() {
  return (
    <g>
      <path
        d="M0 0 C-1.2 -12 -1 -22 0 -34"
        stroke="var(--trunk)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M0 -20 C4 -24 7 -28 9 -34"
        stroke="var(--trunk)"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M0 -24 C-3.5 -27 -6 -30 -7.5 -34"
        stroke="var(--trunk)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="-13" cy="-43" rx="13" ry="10" fill="var(--canopy-2)" />
      <ellipse cx="13" cy="-45" rx="12" ry="10" fill="var(--canopy-2)" />
      <ellipse cx="0" cy="-53" rx="21" ry="16" fill="var(--canopy)" />
      <ellipse cx="-7" cy="-59" rx="9.5" ry="6" fill="var(--canopy-2)" opacity="0.55" />
    </g>
  )
}

interface PlantProps {
  stage: PlantStage
  variant?: number
  delay?: number
}

/** 단계별 흔들림 — 여린 식물일수록 크게, 나무일수록 느리고 작게 흔들린다. */
const SWAY: Record<PlantStage, { amp: number; dur: number }> = {
  sprout: { amp: 1.4, dur: 4.6 },
  leaf: { amp: 1.7, dur: 5.4 },
  flower: { amp: 1.9, dur: 5.8 },
  tree: { amp: 0.8, dur: 7.2 },
}

/** 정원 SVG 안에서 쓰는 식물 한 그루. 기준점 (0,0)이 뿌리. */
export function Plant({ stage, variant = 0, delay = 0 }: PlantProps) {
  const sway = SWAY[stage]
  const swayStyle = {
    '--sway-a': `${sway.amp}deg`,
    animationDuration: `${sway.dur + (variant % 3) * 0.7}s`,
    animationDelay: `${-((variant * 1.7 + delay * 10) % 5)}s`,
  } as React.CSSProperties

  return (
    <motion.g
      key={stage}
      initial={{ scale: 0.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, delay }}
      style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
    >
      <ellipse cx="0" cy="1" rx="10" ry="2.5" fill="var(--plant-shadow)" />
      <g className="plant-sway" style={swayStyle}>
        {stage === 'sprout' && <SproutShape />}
        {stage === 'leaf' && <LeafShape />}
        {stage === 'flower' && <FlowerShape variant={variant} />}
        {stage === 'tree' && <TreeShape />}
      </g>
    </motion.g>
  )
}
