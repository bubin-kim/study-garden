'use client'

import { Check } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { DURATION_OPTIONS, useTimerStore } from '@/stores/timer-store'
import { useSeasonStore } from '@/stores/season-store'
import { useUiStore } from '@/stores/ui-store'
import type { Season } from '@/types'

const SEASON_LABEL: Record<Season, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
}

const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter']

function OptionRow({
  selected,
  onClick,
  label,
  sub,
}: {
  selected: boolean
  onClick(): void
  label: string
  sub?: string
}) {
  return (
    <li className="border-b border-line last:border-b-0">
      <button
        onClick={onClick}
        className="-mx-3 flex w-[calc(100%+1.5rem)] items-center justify-between rounded-[14px] px-3 py-4 text-[15px] transition-colors duration-200 hover:bg-primary-soft/50"
      >
        <span className={selected ? 'font-semibold' : ''}>
          {label}
          {sub && <span className="ml-2 text-[13px] font-normal text-muted">{sub}</span>}
        </span>
        {selected && <Check size={18} className="text-primary" />}
      </button>
    </li>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1 mt-7 text-[13px] font-medium text-muted first:mt-0">
      {children}
    </h3>
  )
}

export function SettingsSheet() {
  const open = useUiStore((s) => s.settingsOpen)
  const close = useUiStore((s) => s.closeSettings)
  const durationMin = useTimerStore((s) => s.durationMin)
  const setDuration = useTimerStore((s) => s.setDuration)
  const idle = useTimerStore((s) => s.status === 'idle')
  const preference = useSeasonStore((s) => s.preference)
  const autoSeason = useSeasonStore((s) => s.autoSeason)
  const setPreference = useSeasonStore((s) => s.setPreference)

  return (
    <Sheet open={open} onClose={close} title="설정">
      <SectionLabel>집중 시간</SectionLabel>
      <ul>
        {DURATION_OPTIONS.map((min) => (
          <OptionRow
            key={min}
            selected={min === durationMin}
            label={`${min}분`}
            onClick={() => {
              setDuration(min)
              close()
            }}
          />
        ))}
      </ul>
      {!idle && (
        <p className="mt-3 text-[13px] text-muted">
          진행 중인 타이머에는 다음 세션부터 적용돼요.
        </p>
      )}

      <SectionLabel>정원의 계절</SectionLabel>
      <ul>
        <OptionRow
          selected={preference === null}
          label="계절 따라"
          sub={autoSeason ? `지금은 ${SEASON_LABEL[autoSeason]}` : undefined}
          onClick={() => setPreference(null)}
        />
        {SEASON_ORDER.map((season) => (
          <OptionRow
            key={season}
            selected={preference === season}
            label={SEASON_LABEL[season]}
            onClick={() => setPreference(season)}
          />
        ))}
      </ul>
      {preference !== null && (
        <p className="mt-3 text-[13px] text-muted">정원이 이 계절에 머물러요.</p>
      )}
    </Sheet>
  )
}
