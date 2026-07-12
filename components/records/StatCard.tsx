'use client'

interface StatCardProps {
  label: string
  value: string
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-card border border-line bg-surface px-5 py-4">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1 text-[17px] font-semibold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  )
}
