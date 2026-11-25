'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown, CornerDownRight, Plus, Star, X } from 'lucide-react'
import type { Subject, Task } from '@/types'
import { SpeciesIcon } from '@/components/garden/Plant'
import { activeSubjects } from '@/lib/subjects'
import { useSubjectStore } from '@/stores/subject-store'
import { canMarkCore, carryOver, isDayAchieved, MAX_CORE, tasksOn } from '@/lib/tasks'
import { MAX_TITLE, useTaskStore } from '@/stores/task-store'

/**
 * 과목 칩 — 투명한 네이티브 select를 겹쳐 접근성과 모바일 선택 UI를 그대로 쓴다.
 * 보관된 과목이 붙은 할 일은 그 이름을 보여주되 새로 고를 수는 없다.
 */
function SubjectChip({
  subjects,
  value,
  onChange,
  label,
}: {
  subjects: Subject[]
  value: string | undefined
  onChange(id: string | undefined): void
  label: string
}) {
  const current = subjects.find((s) => s.id === value)
  const options = activeSubjects(subjects)
  return (
    <label
      className={`relative flex h-7 max-w-[7.5rem] shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] transition-colors ${
        current ? 'bg-primary-soft text-ink' : 'text-muted hover:bg-primary-soft'
      }`}
    >
      {current && <SpeciesIcon species={current.species} className="size-3.5 shrink-0" />}
      <span className="truncate">{current?.name ?? '과목'}</span>
      <select
        aria-label={label}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">과목 없음</option>
        {current?.archived && <option value={current.id}>{current.name}</option>}
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  )
}

/** 핵심 목표 먼저, 그다음 적은 순서 */
function ordered(tasks: Task[]) {
  return [...tasks].sort(
    (a, b) => Number(b.core) - Number(a.core) || a.createdAt.localeCompare(b.createdAt),
  )
}

export function TodayGoals() {
  const all = useTaskStore((s) => s.tasks)
  const today = useTaskStore((s) => s.today)
  const hydrated = useTaskStore((s) => s.hydrated)
  const add = useTaskStore((s) => s.add)
  const toggleDone = useTaskStore((s) => s.toggleDone)
  const toggleCore = useTaskStore((s) => s.toggleCore)
  const remove = useTaskStore((s) => s.remove)
  const carry = useTaskStore((s) => s.carryOverFromYesterday)
  const setSubject = useTaskStore((s) => s.setSubject)
  const subjects = useSubjectStore((s) => s.subjects)
  const hasSubjects = activeSubjects(subjects).length > 0
  const reduce = useReducedMotion()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [draftSubject, setDraftSubject] = useState<string | undefined>(undefined)

  const todays = useMemo(() => (today ? ordered(tasksOn(all, today)) : []), [all, today])
  // 미리보기용 — 실제 id·시각은 store가 가져올 때 새로 만든다
  const carryCount = useMemo(
    () => (today ? carryOver(all, today, () => '', '').length : 0),
    [all, today],
  )

  const core = todays.filter((t) => t.core)
  const coreDone = core.filter((t) => t.done).length
  const achieved = today != null && isDayAchieved(all, today)
  const coreFull = today != null && !canMarkCore(all, today)

  let summary = ''
  if (hydrated) {
    if (todays.length === 0) summary = '오늘 가꿀 목표를 적어 보세요'
    else if (achieved) summary = '핵심 목표를 모두 가꿨어요'
    else if (core.length > 0) summary = `핵심 ${coreDone}/${core.length}`
    else summary = `할 일 ${todays.filter((t) => t.done).length}/${todays.length}`
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    add(draft, draftSubject)
    setDraft('')
  }

  const height = reduce
    ? { initial: false as const, animate: {}, exit: {} }
    : {
        initial: { height: 0, opacity: 0 },
        animate: { height: 'auto', opacity: 1 },
        exit: { height: 0, opacity: 0 },
      }

  return (
    <section className="rounded-card border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-[14px] font-semibold">오늘의 목표</span>
        <span className="flex min-w-0 items-center gap-2.5 text-[13px] text-muted">
          <span className="truncate">{summary}</span>
          {core.length > 0 && (
            <span aria-hidden className="flex gap-1">
              {core.map((t) => (
                <span
                  key={t.id}
                  className={`size-1.5 rounded-full ${t.done ? 'bg-primary' : 'bg-line'}`}
                />
              ))}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            {...height}
            transition={{ duration: 0.28, ease: [0.25, 0.8, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-3 pb-3 pt-2">
              {carryCount > 0 && (
                <button
                  type="button"
                  onClick={carry}
                  className="mx-2 mb-1 mt-1 flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-[12.5px] font-medium text-ink transition-[filter] hover:brightness-[0.98]"
                >
                  <CornerDownRight size={13} />
                  어제 남은 할 일 {carryCount}개 가져오기
                </button>
              )}

              <ul>
                {todays.map((t) => (
                  <li key={t.id} className="group flex items-center gap-1 rounded-xl px-2 py-1.5">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={t.done}
                      aria-label={`${t.title} 완료`}
                      onClick={() => toggleDone(t.id)}
                      className={`grid size-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors duration-200 ${
                        t.done ? 'border-primary bg-primary text-on-primary' : 'border-muted/40 hover:border-primary'
                      }`}
                    >
                      {t.done && <Check size={13} strokeWidth={3} />}
                    </button>
                    <span
                      className={`ml-2 min-w-0 flex-1 break-words text-[14px] transition-colors duration-200 ${
                        t.done ? 'text-muted line-through' : ''
                      }`}
                    >
                      {t.title}
                    </span>
                    {(hasSubjects || t.subjectId) && (
                      <SubjectChip
                        subjects={subjects}
                        value={t.subjectId}
                        onChange={(id) => setSubject(t.id, id)}
                        label={`${t.title} 과목`}
                      />
                    )}
                    <button
                      type="button"
                      aria-pressed={t.core}
                      aria-label={t.core ? '핵심 목표에서 빼기' : '핵심 목표로 정하기'}
                      title={!t.core && coreFull ? `핵심 목표는 하루 ${MAX_CORE}개까지예요` : undefined}
                      disabled={!t.core && coreFull}
                      onClick={() => toggleCore(t.id)}
                      className={`grid size-8 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-30 ${
                        t.core ? 'text-accent' : 'text-muted hover:text-ink'
                      }`}
                    >
                      <Star size={16} fill={t.core ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      aria-label={`${t.title} 지우기`}
                      onClick={() => remove(t.id)}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-ink"
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>

              {todays.length > 0 && core.length === 0 && (
                <p className="px-2 pb-1 pt-1 text-[12.5px] text-muted">
                  별을 눌러 오늘 꼭 해낼 핵심 목표를 1~{MAX_CORE}개 골라 주세요
                </p>
              )}
              {todays.length === 0 && (
                <p className="px-2 pb-1 pt-1 text-[12.5px] text-muted">
                  핵심 목표를 모두 마친 날엔 정원에 꽃이 한 송이 더 피어요
                </p>
              )}

              <form onSubmit={submit} className="mt-1 flex items-center gap-2 px-2">
                {hasSubjects && (
                  <SubjectChip
                    subjects={subjects}
                    value={draftSubject}
                    onChange={setDraftSubject}
                    label="새 할 일 과목"
                  />
                )}
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={MAX_TITLE}
                  placeholder="할 일 적기"
                  aria-label="새 할 일"
                  className="h-10 min-w-0 flex-1 rounded-full bg-primary-soft px-4 text-[14px] outline-none placeholder:text-muted focus-visible:ring-1 focus-visible:ring-primary"
                />
                <button
                  type="submit"
                  aria-label="할 일 추가"
                  disabled={!draft.trim()}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-on-primary transition-opacity disabled:opacity-40"
                >
                  <Plus size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
