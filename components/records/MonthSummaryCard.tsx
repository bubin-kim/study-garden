'use client'

import { useState } from 'react'
import { ImageDown } from 'lucide-react'
import { percentages, type MonthSummary } from '@/lib/summary'
import { formatDuration } from '@/lib/time'
import type { Subject } from '@/types'
import { renderSummaryPng, shareOrDownload, type SummaryImageData } from './exportSummary'

interface Props {
  year: number
  month: number
  summary: MonthSummary
  plants: number
  flowers: number
  subjects: Subject[]
  /** 내보낼 때 복제할 화면의 정원 SVG */
  getGarden(): SVGSVGElement | null
}

/** 기록 페이지 하단 "한 달 정리" — 이미지로 저장·공유 (docs/03 M5) */
export function MonthSummaryCard({ year, month, summary, plants, flowers, subjects, getGarden }: Props) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const hasSubjects = summary.bySubject.some((s) => s.subjectId !== null)
  const pcts = percentages(summary.bySubject.map((s) => s.minutes))
  const rows = hasSubjects
    ? summary.bySubject.map((s, i) => {
        const sub = subjects.find((x) => x.id === s.subjectId)
        return {
          name: sub?.name ?? '과목 없이',
          color: sub ? `var(--sp-${sub.species})` : 'var(--muted)',
          value: formatDuration(s.minutes),
          percent: pcts[i],
        }
      })
    : []
  const stats = [
    { label: '가꾼 시간', value: formatDuration(summary.minutes) },
    { label: '공부한 날', value: `${summary.studyDays}일` },
    { label: '자란 식물', value: `${plants}그루` },
    { label: '목표 꽃', value: `${flowers}송이` },
  ]
  const data: SummaryImageData = {
    title: `${year}년 ${month + 1}월의 정원`,
    stats,
    rows,
    fileName: `study-garden-${year}-${String(month + 1).padStart(2, '0')}.png`,
  }

  const save = async () => {
    const svg = getGarden()
    if (!svg || busy) return
    setBusy(true)
    setNote(null)
    try {
      const blob = await renderSummaryPng(data, svg)
      const r = await shareOrDownload(blob, data.fileName)
      if (r === 'downloaded') setNote('이미지로 저장했어요')
    } catch {
      setNote('이미지를 만들지 못했어요 · 잠시 뒤 다시 해 볼까요?')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-4 rounded-card border border-line bg-surface p-5" aria-label="한 달 정리">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold">{month + 1}월 정리</h3>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="-mr-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-muted transition-colors hover:bg-primary-soft hover:text-ink disabled:opacity-50"
        >
          <ImageDown size={15} />
          {busy ? '만드는 중' : '이미지로 저장'}
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[12px] text-muted">{s.label}</dt>
            <dd className="mt-0.5 text-[16px] font-semibold tabular-nums tracking-tight">{s.value}</dd>
          </div>
        ))}
      </dl>

      {hasSubjects && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[12px] text-muted">과목별로 가꾼 시간</p>
          <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-line">
            {rows.map((r, i) => (
              <span key={i} style={{ width: `${r.percent}%`, background: r.color }} />
            ))}
          </div>
          <ul className="mt-3 space-y-1.5">
            {rows.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-[13px]">
                <span className="size-2 shrink-0 rounded-full" style={{ background: r.color }} />
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className="shrink-0 text-[12.5px] text-muted tabular-nums">
                  {r.value} · {r.percent}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {note && (
        <p className="mt-3 text-[12.5px] text-muted" aria-live="polite">
          {note}
        </p>
      )}
    </section>
  )
}
