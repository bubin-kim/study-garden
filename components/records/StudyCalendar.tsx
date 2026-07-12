'use client'

import type { DayRecord } from '@/lib/stats'
import { dateKey } from '@/lib/time'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function intensityCls(minutes: number): string {
  if (minutes <= 0) return 'bg-line/50'
  if (minutes < 30) return 'bg-primary/25'
  if (minutes < 90) return 'bg-primary/45'
  if (minutes < 180) return 'bg-primary/70'
  return 'bg-primary'
}

interface StudyCalendarProps {
  year: number
  month: number
  records: Map<string, DayRecord>
  selected: string | null
  onSelect(key: string | null): void
}

export function StudyCalendar({
  year,
  month,
  records,
  selected,
  onSelect,
}: StudyCalendarProps) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = dateKey(new Date())

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <p key={w} className="pb-1 text-center text-[11px] text-muted">
            {w}
          </p>
        ))}
        {cells.map((day, i) => {
          if (day == null) return <div key={`empty-${i}`} />
          const key = dateKey(new Date(year, month, day))
          const minutes = records.get(key)?.minutes ?? 0
          const isFuture = key > todayKey
          const isSelected = key === selected
          const isToday = key === todayKey
          return (
            <button
              key={key}
              disabled={isFuture}
              onClick={() => onSelect(isSelected ? null : key)}
              aria-label={`${month + 1}월 ${day}일`}
              className={`flex aspect-square items-center justify-center rounded-[9px] text-[11px] transition-all ${
                isFuture ? 'text-muted/40' : intensityCls(minutes)
              } ${minutes >= 90 ? 'font-medium text-on-primary' : 'text-ink/60'} ${
                isSelected
                  ? 'ring-2 ring-primary'
                  : isToday
                    ? 'ring-1 ring-primary/60'
                    : ''
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted">
        적게
        {['bg-line/50', 'bg-primary/25', 'bg-primary/45', 'bg-primary/70', 'bg-primary'].map(
          (cls) => (
            <span key={cls} className={`h-2.5 w-2.5 rounded-[4px] ${cls}`} />
          ),
        )}
        많이
      </div>
    </div>
  )
}
