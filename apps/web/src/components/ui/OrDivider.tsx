/** A line with "Or" in the middle, between two ways of doing the same thing. */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs font-medium text-ink-600" role="separator" aria-label="Or">
      <span className="h-px flex-1 bg-ink-200" aria-hidden />
      <span aria-hidden>Or</span>
      <span className="h-px flex-1 bg-ink-200" aria-hidden />
    </div>
  )
}
