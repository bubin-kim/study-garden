'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { SpeciesIcon } from '@/components/garden/Plant'
import { Sheet } from '@/components/ui/Sheet'
import { activeSubjects, speciesOf } from '@/lib/subjects'
import { tasksOn } from '@/lib/tasks'
import { useSubjectStore } from '@/stores/subject-store'
import { useTaskStore } from '@/stores/task-store'
import { type Focus, useTimerStore } from '@/stores/timer-store'

/**
 * 세션 시작 전 "무엇을 가꿀까요?" (docs/03 M3). 고르지 않아도 시작할 수 있다.
 * 할 일을 고르면 그 할 일의 과목이 따라오고, 과목만 골라도 된다.
 */
export function FocusPicker() {
  const status = useTimerStore((s) => s.status)
  const picked = useTimerStore((s) => s.picked)
  const activeFocus = useTimerStore((s) => s.activeFocus)
  const pick = useTimerStore((s) => s.pick)
  const tasks = useTaskStore((s) => s.tasks)
  const today = useTaskStore((s) => s.today)
  const subjects = useSubjectStore((s) => s.subjects)
  const [open, setOpen] = useState(false)

  const idle = status === 'idle'
  const todo = today ? tasksOn(tasks, today).filter((t) => !t.done) : []
  const active = activeSubjects(subjects)
  if (todo.length === 0 && active.length === 0 && idle) return null

  const focus = idle ? picked : activeFocus
  const task = focus.taskId ? tasks.find((t) => t.id === focus.taskId) : undefined
  const subject = focus.subjectId ? subjects.find((s) => s.id === focus.subjectId) : undefined
  // 고른 할 일이 그새 끝났거나 지워졌으면 선택 없음으로 본다
  const validTask = task && (!idle || !task.done) ? task : undefined
  const label = validTask?.title ?? subject?.name
  if (!idle && !label) return null

  const species = speciesOf(subjects, focus.subjectId)
  const choose = (f: Focus) => {
    pick(f)
    setOpen(false)
  }
  const isPicked = (f: Focus) => f.taskId === picked.taskId && f.subjectId === picked.subjectId

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!idle}
        className="mt-1 flex max-w-[80vw] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-primary-soft hover:text-ink disabled:pointer-events-none"
      >
        {species != null && <SpeciesIcon species={species} className="size-4 shrink-0" />}
        <span className="truncate">{label ?? '무엇을 가꿀까요?'}</span>
        {idle && <ChevronDown size={14} className="shrink-0" />}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="무엇을 가꿀까요?">
        <ul>
          <Row selected={!picked.taskId && !picked.subjectId} onClick={() => choose({})} label="고르지 않고 시작" />
        </ul>
        {todo.length > 0 && (
          <>
            <h3 className="mb-1 mt-6 text-[13px] font-medium text-muted">오늘의 할 일</h3>
            <ul>
              {todo.map((t) => {
                const f = { taskId: t.id, ...(t.subjectId && { subjectId: t.subjectId }) }
                const sp = speciesOf(subjects, t.subjectId)
                return (
                  <Row
                    key={t.id}
                    selected={isPicked(f)}
                    onClick={() => choose(f)}
                    label={t.title}
                    icon={sp}
                    sub={subjects.find((s) => s.id === t.subjectId)?.name}
                  />
                )
              })}
            </ul>
          </>
        )}
        {active.length > 0 && (
          <>
            <h3 className="mb-1 mt-6 text-[13px] font-medium text-muted">과목</h3>
            <ul>
              {active.map((s) => (
                <Row
                  key={s.id}
                  selected={isPicked({ subjectId: s.id })}
                  onClick={() => choose({ subjectId: s.id })}
                  label={s.name}
                  icon={s.species}
                />
              ))}
            </ul>
          </>
        )}
      </Sheet>
    </>
  )
}

function Row({
  selected,
  onClick,
  label,
  sub,
  icon,
}: {
  selected: boolean
  onClick(): void
  label: string
  sub?: string
  icon?: import('@/types').SpeciesId | null
}) {
  return (
    <li className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 py-3.5 text-left text-[15px]"
      >
        <span className="grid size-6 shrink-0 place-items-center">
          {icon != null && <SpeciesIcon species={icon} className="size-6" />}
        </span>
        <span className={`min-w-0 flex-1 truncate ${selected ? 'font-semibold' : ''}`}>
          {label}
          {sub && <span className="ml-2 text-[13px] font-normal text-muted">{sub}</span>}
        </span>
        {selected && <Check size={18} className="shrink-0 text-primary" />}
      </button>
    </li>
  )
}
