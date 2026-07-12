'use client'

import type { PlantData } from '@/types'
import { Plant } from './Plant'
import { GrowingSeed } from './GrowingSeed'

/** 앞쪽 잔디 곡선의 윗선 y좌표 (viewBox 기준) */
function groundTopY(x: number) {
  const u = x / 800
  return 222 - 72 * u * (1 - u)
}

/* ── 배경 장식 ──────────────────────────────────
   식물보다 눈에 띄지 않는, 흙 위의 작은 것들. */

function GrassTuft() {
  return (
    <g stroke="var(--stem)" strokeWidth="1.3" strokeLinecap="round" opacity="0.45" fill="none">
      <path d="M0 0 C-0.5 -3 -2 -5 -3.4 -6.5" />
      <path d="M0 0 C0 -4 0 -6 0.4 -8" />
      <path d="M0 0 C0.8 -3 2.2 -5 3.6 -6" />
    </g>
  )
}

function Clover() {
  return (
    <g opacity="0.5">
      <path d="M0 0 L0.4 -3" stroke="var(--stem)" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="-1.5" cy="-4.4" r="1.6" fill="var(--leaf)" />
      <circle cx="1.9" cy="-4.2" r="1.6" fill="var(--leaf)" />
      <circle cx="0.2" cy="-6" r="1.6" fill="var(--leaf)" />
    </g>
  )
}

function Stone() {
  return (
    <g fill="var(--muted)" opacity="0.28">
      <ellipse cx="0" cy="-1.6" rx="4.4" ry="2.6" />
      <ellipse cx="4.6" cy="-0.9" rx="2.4" ry="1.5" />
    </g>
  )
}

function Mushroom() {
  return (
    <g opacity="0.55">
      <path d="M-1.1 0 L-1 -3.2 L1 -3.2 L1.1 0 Z" fill="var(--muted)" opacity="0.7" />
      <path d="M-3.4 -3.2 C-3.4 -6 3.4 -6 3.4 -3.2 Z" fill="var(--accent)" opacity="0.75" />
    </g>
  )
}

function Wildflower() {
  return (
    <g opacity="0.65">
      <path d="M0 0 L0 -5" stroke="var(--stem)" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="-1.4" cy="-6.4" r="1.2" fill="var(--petal-2)" />
      <circle cx="1.4" cy="-6.4" r="1.2" fill="var(--petal-2)" />
      <circle cx="0" cy="-7.8" r="1.2" fill="var(--petal-2)" />
      <circle cx="0" cy="-6.3" r="1" fill="var(--core)" />
    </g>
  )
}

const DECOR: { El: () => React.ReactElement; x: number; dy: number; s: number }[] = [
  { El: GrassTuft, x: 70, dy: 4, s: 1 },
  { El: Stone, x: 142, dy: 5, s: 1 },
  { El: Clover, x: 226, dy: 4, s: 1 },
  { El: GrassTuft, x: 302, dy: 14, s: 0.9 },
  { El: Mushroom, x: 338, dy: 3, s: 1 },
  { El: GrassTuft, x: 468, dy: 4, s: 1.1 },
  { El: Wildflower, x: 558, dy: 4, s: 1 },
  { El: Stone, x: 648, dy: 5, s: 0.85 },
  { El: Clover, x: 736, dy: 6, s: 1 },
]

/* ── 계절 앰비언스 ──────────────────────────────
   가끔 하나씩 지나가는 계절의 흔적. 표시 여부는 CSS(data-season)가 결정한다. */
function Ambience() {
  return (
    <>
      <g className="amb amb-spring" transform="translate(600 -8)">
        <g className="amb-petal">
          <g transform="scale(1.9)">
            <path
              d="M0 0 C2.4 -1.2 4.2 0.4 3.6 2.8 C2.2 4.8 -0.6 4.2 -1 1.9 Z"
              fill="var(--accent)"
            />
          </g>
        </g>
      </g>
      <g className="amb amb-summer">
        <g transform="translate(170 150)">
          <g className="amb-fly">
            <circle r="5.5" fill="var(--petal)" opacity="0.3" />
            <circle r="2.3" fill="var(--petal)" />
          </g>
        </g>
        <g transform="translate(590 170)">
          <g className="amb-fly amb-fly-2">
            <circle r="5.5" fill="var(--petal)" opacity="0.3" />
            <circle r="2.3" fill="var(--petal)" />
          </g>
        </g>
      </g>
      <g className="amb amb-autumn" transform="translate(210 -8)">
        <g className="amb-leaf-fall">
          <g transform="scale(1.8)">
            <path
              d="M0 -3.4 C2.8 -1.8 2.8 1.8 0 3.4 C-2.8 1.8 -2.8 -1.8 0 -3.4 Z"
              fill="var(--accent)"
            />
          </g>
        </g>
      </g>
      <g className="amb amb-winter">
        <g transform="translate(180 -5)">
          <circle className="amb-snow" r="3" fill="var(--accent)" />
        </g>
        <g transform="translate(430 -5)">
          <circle className="amb-snow amb-snow-2" r="2.4" fill="var(--accent)" />
        </g>
        <g transform="translate(680 -5)">
          <circle className="amb-snow amb-snow-3" r="3.4" fill="var(--accent)" />
        </g>
      </g>
    </>
  )
}

interface GardenProps {
  plants: PlantData[]
  growing?: boolean
  emptyText?: string
  emptySub?: string
}

export function Garden({ plants, growing = false, emptyText, emptySub }: GardenProps) {
  // 뒤쪽(depth 큰) 식물부터 그려서 앞 식물이 자연스럽게 겹치게 한다
  const sorted = [...plants].sort((a, b) => b.depth - a.depth)
  const empty = plants.length === 0 && !growing

  return (
    <div className="relative w-full">
      <svg viewBox="0 0 800 250" className="h-auto w-full" role="img" aria-label="정원">
        <path d="M0 214 Q400 176 800 214 L800 250 L0 250 Z" fill="var(--ground-2)" />
        <path d="M0 222 Q400 186 800 222 L800 250 L0 250 Z" fill="var(--ground)" />
        {DECOR.map(({ El, x, dy, s }, i) => (
          <g key={i} transform={`translate(${x} ${groundTopY(x) + dy}) scale(${s})`}>
            <El />
          </g>
        ))}
        {sorted.map((p, i) => {
          const x = 28 + p.x * 744
          const y = groundTopY(x) + 6 + (1 - p.depth) * 22
          const scale = 0.78 + (1 - p.depth) * 0.5
          return (
            <g key={p.id} transform={`translate(${x} ${y}) scale(${scale})`}>
              <Plant
                stage={p.stage}
                variant={p.variant}
                delay={Math.min(i * 0.03, 0.5)}
              />
            </g>
          )
        })}
        {growing && (
          <g transform="translate(400 234)">
            <GrowingSeed />
          </g>
        )}
        {empty && (
          <g transform="translate(400 233)" opacity="0.95">
            <ellipse cx="0" cy="0" rx="12" ry="3.5" fill="var(--ground-2)" />
            <ellipse cx="0" cy="-4.5" rx="4" ry="5" fill="var(--trunk)" />
            <path
              d="M0 -9 C1.5 -12 4 -13 6 -13"
              stroke="var(--stem)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}
        <Ambience />
      </svg>
      {empty && emptyText && (
        <div className="pointer-events-none absolute inset-x-0 top-[10%] text-center">
          <p className="text-[14px] font-medium">{emptyText}</p>
          {emptySub && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{emptySub}</p>
          )}
        </div>
      )}
    </div>
  )
}
