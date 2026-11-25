'use client'

import { motion } from 'framer-motion'
import type { PlantStage, SpeciesId } from '@/types'

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

/** 기존(과목 없음) 꽃송이 — 둥근 꽃잎 6장. variant로 색이 달라진다. */
function DefaultBloom({ variant }: { variant: number }) {
  const petal = PETAL_COLORS[variant % PETAL_COLORS.length]
  return (
    <>
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
    </>
  )
}

/* ── 과목 식물 종 (docs/03 M3) ─────────────────────
   꽃 단계에서 모양으로 구분한다. 기준점 (0,0)은 꽃송이 중심(줄기 끝 위). */

/** 0 튤립 — 위가 열린 컵 */
function TulipBloom() {
  return (
    <>
      <path d="M-9 0 C-10.5 -9 -7 -16.5 -3 -18 C-2.5 -12 -1.5 -6 0 -1 Z" fill="var(--sp-0-soft)" />
      <path d="M9 0 C10.5 -9 7 -16.5 3 -18 C2.5 -12 1.5 -6 0 -1 Z" fill="var(--sp-0-soft)" />
      <path d="M-6.6 2 C-8.6 -6 -5.6 -14.6 0 -17.4 C5.6 -14.6 8.6 -6 6.6 2 C3.4 4.6 -3.4 4.6 -6.6 2 Z" fill="var(--sp-0)" />
      <path d="M-3 -1 C-3.6 -6 -2 -10.6 0 -12.4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1" strokeLinecap="round" fill="none" />
    </>
  )
}

/** 1 해바라기 — 꽃잎 두 겹 + 크고 진한 중심 */
function SunflowerBloom() {
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => (
        <ellipse key={`b${i}`} cx="0" cy="-7.8" rx="1.9" ry="4.2" fill="var(--sp-1-soft)" transform={`rotate(${i * 25.7 + 12.8})`} />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <ellipse key={i} cx="0" cy="-8.4" rx="2.1" ry="4.8" fill="var(--sp-1)" transform={`rotate(${i * 25.7})`} />
      ))}
      <circle r="5.4" fill="var(--trunk)" />
      <circle r="3.2" fill="var(--trunk)" opacity="0.6" />
      <circle cx="-1.6" cy="-1.6" r="1.1" fill="rgba(255,255,255,0.3)" />
    </>
  )
}

/** 2 라벤더 — 위로 뻗은 꽃 이삭 */
function LavenderBloom() {
  const buds = [
    [0, 5, 2.8], [-2.4, 1, 2.6], [2.4, -1.6, 2.6], [-2.1, -5.4, 2.4], [2.1, -8.6, 2.2],
    [-1.6, -12.2, 2], [1.4, -15.4, 1.8], [0, -18.6, 1.5],
  ]
  return (
    <>
      <path d="M0 7 L0 -18" stroke="var(--stem)" strokeWidth="1.5" strokeLinecap="round" />
      {buds.map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 1.35} fill={i % 2 ? 'var(--sp-2-soft)' : 'var(--sp-2)'} />
      ))}
    </>
  )
}

/** 3 수국 — 작은 꽃(네 장)이 둥글게 모인 송이 */
function HydrangeaBloom() {
  const florets = [
    [0, -4], [-6.4, -2], [6.4, -2], [-3.4, -9.6], [3.4, -9.6],
    [-8, -8], [8, -8], [0, -14], [-4, 2.4], [4, 2.4],
  ]
  return (
    <>
      <circle cx="0" cy="-5" r="10.5" fill="var(--sp-3-soft)" opacity="0.55" />
      {florets.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${i * 23})`}>
          {[[0, -1.7], [1.7, 0], [0, 1.7], [-1.7, 0]].map(([dx, dy], k) => (
            <circle key={k} cx={dx} cy={dy} r="1.75" fill={i % 3 === 1 ? 'var(--sp-3-soft)' : 'var(--sp-3)'} />
          ))}
          <circle r="0.7" fill="var(--core)" />
        </g>
      ))}
    </>
  )
}

/** 4 동백 — 겹꽃. 둥근 꽃잎 두 겹 + 노란 수술 */
function CamelliaBloom() {
  return (
    <>
      {[0, 72, 144, 216, 288].map((deg) => (
        <circle key={deg} cx="0" cy="-6.4" r="6.2" fill="var(--sp-4)" transform={`rotate(${deg})`} />
      ))}
      {[36, 108, 180, 252, 324].map((deg) => (
        <circle key={deg} cx="0" cy="-3.8" r="4.2" fill="var(--sp-4-soft)" transform={`rotate(${deg})`} />
      ))}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <circle key={deg} cx="0" cy="-1.9" r="1" fill="var(--core)" transform={`rotate(${deg})`} />
      ))}
      <circle r="1.4" fill="var(--core)" />
    </>
  )
}

export const SPECIES_BLOOM: Record<SpeciesId, () => React.ReactElement> = {
  0: TulipBloom,
  1: SunflowerBloom,
  2: LavenderBloom,
  3: HydrangeaBloom,
  4: CamelliaBloom,
}

/** 설정·선택 UI용 종 미리보기 (꽃송이만) */
export function SpeciesIcon({ species, className }: { species: SpeciesId; className?: string }) {
  const Bloom = SPECIES_BLOOM[species]
  return (
    <svg viewBox="-15 -21 30 30" aria-hidden className={className}>
      <Bloom />
    </svg>
  )
}

function FlowerShape({ variant, species }: { variant: number; species: SpeciesId | null }) {
  const Bloom = species != null ? SPECIES_BLOOM[species] : null
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
          {Bloom ? <Bloom /> : <DefaultBloom variant={variant} />}
        </g>
      </g>
    </g>
  )
}

/** 둥근 활엽수 — V1의 기본 나무. */
function BroadleafTree() {
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

/** 침엽수 — 곡선 변으로 부드럽게 그린 3단 층. 활엽수보다 좁고 크다. */
function ConiferTree() {
  return (
    <g>
      <path
        d="M0 0 C-0.8 -10 -0.6 -20 0 -28"
        stroke="var(--trunk)"
        strokeWidth="4.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M0 -46 C6 -38 12 -30 17 -24 C6 -26.5 -6 -26.5 -17 -24 C-12 -30 -6 -38 0 -46 Z"
        fill="var(--canopy-2)"
      />
      <path
        d="M0 -60 C4.5 -53.5 9 -46 13 -40 C4.5 -42.2 -4.5 -42.2 -13 -40 C-9 -46 -4.5 -53.5 0 -60 Z"
        fill="var(--canopy)"
      />
      <path
        d="M0 -74 C3 -68 6 -60.5 8.5 -55 C3 -56.8 -3 -56.8 -8.5 -55 C-6 -60.5 -3 -68 0 -74 Z"
        fill="var(--canopy)"
      />
      <ellipse cx="-3" cy="-64" rx="3.6" ry="5" fill="var(--canopy-2)" opacity="0.55" />
    </g>
  )
}

/** 아치형 — 가지가 양옆으로 벌어지고 캐노피가 넓게 얹힌 우산 실루엣. 셋 중 가장 낮고 넓다. */
function ArchTree() {
  return (
    <g>
      <path
        d="M0 0 C-1 -10 -0.8 -16 0 -22"
        stroke="var(--trunk)"
        strokeWidth="4.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M0 -16 C-6 -25 -13 -31 -20 -35"
        stroke="var(--trunk)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M0 -18 C6 -27 13 -33 19 -37"
        stroke="var(--trunk)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="-19" cy="-41" rx="12" ry="8" fill="var(--canopy-2)" />
      <ellipse cx="18" cy="-43" rx="12.5" ry="8" fill="var(--canopy-2)" />
      <ellipse cx="0" cy="-47" rx="24" ry="10" fill="var(--canopy)" />
      <ellipse cx="8" cy="-52" rx="9" ry="5" fill="var(--canopy-2)" opacity="0.55" />
    </g>
  )
}

/** 나무 수종은 꽃잎 색과 같은 방식으로 variant(세션 id 해시)에서 결정된다. */
function TreeShape({ variant }: { variant: number }) {
  const kind = variant % 3
  if (kind === 1) return <ConiferTree />
  if (kind === 2) return <ArchTree />
  return <BroadleafTree />
}

interface PlantProps {
  stage: PlantStage
  variant?: number
  /** 과목 식물 종 — null이면 기존 모습 (docs/03 M3) */
  species?: SpeciesId | null
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
export function Plant({ stage, variant = 0, species = null, delay = 0 }: PlantProps) {
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
      // SVG에서는 framer가 style.transformOrigin을 50% 50%로 덮어쓴다 — originX/Y로 뿌리 기준 (docs/03 M2)
      style={{ transformBox: 'fill-box', originX: 0.5, originY: 1 }}
    >
      <ellipse cx="0" cy="1" rx="10" ry="2.5" fill="var(--plant-shadow)" />
      <g className="plant-sway" style={swayStyle}>
        {stage === 'sprout' && <SproutShape />}
        {stage === 'leaf' && <LeafShape />}
        {stage === 'flower' && <FlowerShape variant={variant} species={species} />}
        {stage === 'tree' && <TreeShape variant={variant} />}
      </g>
    </motion.g>
  )
}
