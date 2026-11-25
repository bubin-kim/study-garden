'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { canAddExam, daysBetween, MAX_EXAMS, upcomingExams } from '@/lib/dday'
import { MAX_EXAM_NAME, useExamStore } from '@/stores/exam-store'
import { useTaskStore } from '@/stores/task-store'

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

/** 'YYYY-MM-DD' → '12월 18일 (목)'. 날짜 키에서 결정적으로 — 현재 시각을 쓰지 않는다 */
function formatDate(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return `${m}월 ${d}일 (${WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]})`
}

/** 설정 시트의 "시험" — 가장 가까운 시험까지 남은 날을 정원 위에 보여준다 (docs/03 M4) */
export function ExamSection() {
  const exams = useExamStore((s) => s.exams)
  const add = useExamStore((s) => s.add)
  const remove = useExamStore((s) => s.remove)
  const today = useTaskStore((s) => s.today)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')

  if (!today) return null
  const upcoming = upcomingExams(exams, today)
  const full = !canAddExam(exams, today)
  const ready = name.trim() !== '' && date >= today

  return (
    <div>
      <p className="mb-2 text-[13px] text-muted">가장 가까운 시험까지 남은 날을 정원 위에 적어 둘게요.</p>
      <ul>
        {upcoming.map((e) => {
          const days = daysBetween(today, e.date)
          return (
            <li key={e.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
              <span className="min-w-0 flex-1 truncate text-[15px]">{e.name}</span>
              <span className="shrink-0 text-[13px] text-muted tabular-nums">
                {formatDate(e.date)} · {days === 0 ? '오늘' : `${days}일 남음`}
              </span>
              <button
                type="button"
                onClick={() => remove(e.id)}
                aria-label={`${e.name} 지우기`}
                className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-primary-soft hover:text-ink"
              >
                <X size={16} />
              </button>
            </li>
          )
        })}
      </ul>
      {!full ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!ready) return
            add(name, date)
            setName('')
            setDate('')
          }}
          className="mt-2 flex items-center gap-2"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_EXAM_NAME}
            placeholder="시험 이름"
            aria-label="새 시험 이름"
            className="h-10 min-w-0 flex-1 rounded-full bg-primary-soft px-4 text-[14px] outline-none placeholder:text-muted focus-visible:ring-1 focus-visible:ring-primary"
          />
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            aria-label="새 시험 날짜"
            className={`h-10 w-[8.75rem] shrink-0 rounded-full bg-primary-soft px-3 text-[14px] outline-none focus-visible:ring-1 focus-visible:ring-primary ${
              date ? '' : 'text-muted'
            }`}
          />
          <button
            type="submit"
            aria-label="시험 추가"
            disabled={!ready}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-on-primary transition-opacity disabled:opacity-40"
          >
            <Plus size={18} />
          </button>
        </form>
      ) : (
        <p className="mt-3 text-[13px] text-muted">시험은 {MAX_EXAMS}개까지 적어 둘 수 있어요.</p>
      )}
    </div>
  )
}
