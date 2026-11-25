'use client'

import { useMemo } from 'react'
import { Garden } from '@/components/garden/Garden'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { demoGarden } from '@/lib/demo'
import { getGardenPlants, getGoalFlowers } from '@/lib/garden'
import { speciesOf } from '@/lib/subjects'
import { monthSummary } from '@/lib/summary'
import { formatDuration } from '@/lib/time'

interface Props {
  open: boolean
  onClose(): void
}

/**
 * 빈 정원 첫 방문자가 구경하는 "한 달 가꾼 예시 정원" (docs/04).
 * 읽기 전용 — store·localStorage를 건드리지 않는다.
 */
export function DemoGardenSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="예시 정원">
      <DemoGardenBody onClose={onClose} />
    </Sheet>
  )
}

function DemoGardenBody({ onClose }: { onClose(): void }) {
  const view = useMemo(() => {
    const g = demoGarden()
    const plants = getGardenPlants(g.sessions, g.year, g.month, (id) => speciesOf(g.subjects, id))
    const flowers = getGoalFlowers(g.achieved)
    const summary = monthSummary(g.sessions, g.year, g.month)
    const legend = summary.bySubject.map((s) => {
      const sub = g.subjects.find((x) => x.id === s.subjectId)
      return {
        name: sub?.name ?? '과목 없이',
        color: sub ? `var(--sp-${sub.species})` : 'var(--muted)',
        time: formatDuration(s.minutes),
      }
    })
    return { plants, flowers, summary, legend }
  }, [])
  const stats = [
    { label: '가꾼 시간', value: formatDuration(view.summary.minutes) },
    { label: '공부한 날', value: `${view.summary.studyDays}일` },
    { label: '목표 꽃', value: `${view.flowers.length}송이` },
  ]

  return (
    <div>
      <p className="-mt-2 break-keep text-[13px] text-muted">
        어느 대학생이 한 달 동안 가꾼 정원이에요 · {view.plants.length}그루 · 꽃 {view.flowers.length}송이
      </p>

      <div className="-mx-2 mt-3">
        <Garden plants={view.plants} goalFlowers={view.flowers} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[12px] text-muted">{s.label}</dt>
            <dd className="mt-0.5 text-[16px] font-semibold tabular-nums tracking-tight">{s.value}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-4" aria-label="과목">
        {view.legend.map((r) => (
          <li key={r.name} className="flex items-center gap-1.5 text-[13px]">
            <span className="size-2 shrink-0 rounded-full" style={{ background: r.color }} />
            {r.name}
            <span className="text-[12.5px] text-muted tabular-nums">{r.time}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 break-keep text-[13px] leading-relaxed text-muted">
        집중을 끝까지 마칠 때마다 식물이 하나 심어지고, 공부를 이어 갈수록 새싹에서 잎, 꽃, 나무로
        자라요. 과목마다 꽃 색이 다르고, 오늘의 핵심 목표를 모두 마친 날엔 앞줄에 꽃이 한 송이 더 펴요.
      </p>

      <div className="mt-6 flex justify-center">
        <Button onClick={onClose}>내 정원 가꾸러 가기</Button>
      </div>
    </div>
  )
}
