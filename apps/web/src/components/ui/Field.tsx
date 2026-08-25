import type { LabelHTMLAttributes, ReactNode } from 'react'

export const inputClass =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

export function Field({
  label,
  children,
  ...rest
}: { label: string; children: ReactNode } & LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="flex flex-col gap-1.5" {...rest}>
      <span className="text-xs font-medium text-ink-600">{label}</span>
      {children}
    </label>
  )
}
