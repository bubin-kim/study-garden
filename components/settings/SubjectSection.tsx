'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SpeciesIcon } from '@/components/garden/Plant'
import { activeSubjects, MAX_SUBJECTS } from '@/lib/subjects'
import { MAX_SUBJECT_NAME, useSubjectStore } from '@/stores/subject-store'

/** 설정 시트의 "과목" — 과목마다 다른 꽃이 자란다 (docs/03 M3) */
export function SubjectSection() {
  const subjects = useSubjectStore((s) => s.subjects)
  const add = useSubjectStore((s) => s.add)
  const rename = useSubjectStore((s) => s.rename)
  const archive = useSubjectStore((s) => s.archive)
  const [draft, setDraft] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const active = activeSubjects(subjects)
  const full = active.length >= MAX_SUBJECTS

  return (
    <div>
      <p className="mb-2 text-[13px] text-muted">과목마다 다른 꽃이 자라요.</p>
      <ul>
        {active.map((s) => (
          <li key={s.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
            <SpeciesIcon species={s.species} className="size-7 shrink-0" />
            <input
              defaultValue={s.name}
              maxLength={MAX_SUBJECT_NAME}
              aria-label={`${s.name} 이름 바꾸기`}
              onBlur={(e) => e.target.value.trim() && rename(s.id, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 text-[15px] outline-none focus-visible:bg-primary-soft"
            />
            <button
              type="button"
              onClick={() => {
                if (confirmId !== s.id) return setConfirmId(s.id)
                archive(s.id)
                setConfirmId(null)
              }}
              className="shrink-0 rounded-full px-3 py-1.5 text-[13px] text-muted transition-colors hover:bg-primary-soft hover:text-ink"
            >
              {confirmId === s.id ? '한 번 더 누르면 보관' : '보관'}
            </button>
          </li>
        ))}
      </ul>
      {!full ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            add(draft)
            setDraft('')
          }}
          className="mt-2 flex items-center gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_SUBJECT_NAME}
            placeholder="과목 이름 (예: 수학)"
            aria-label="새 과목"
            className="h-10 min-w-0 flex-1 rounded-full bg-primary-soft px-4 text-[14px] outline-none placeholder:text-muted focus-visible:ring-1 focus-visible:ring-primary"
          />
          <button
            type="submit"
            aria-label="과목 추가"
            disabled={!draft.trim()}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-on-primary transition-opacity disabled:opacity-40"
          >
            <Plus size={18} />
          </button>
        </form>
      ) : (
        <p className="mt-3 text-[13px] text-muted">과목은 {MAX_SUBJECTS}개까지 가꿀 수 있어요.</p>
      )}
      {subjects.length > active.length && (
        <p className="mt-2 text-[12.5px] text-muted">보관한 과목의 꽃은 정원에 그대로 남아 있어요.</p>
      )}
    </div>
  )
}
