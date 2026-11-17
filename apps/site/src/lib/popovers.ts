/**
 * The phone menu and the language picker are <details> popovers (they work
 * without JavaScript). With it, close them on a click or tap outside, on
 * Escape (focus returns to the toggle), and after choosing a link inside, since a
 * jump within the same page wouldn't otherwise close the menu.
 * Returns a function that removes the listeners.
 */
export function dismissPopovers(doc: Document = document): () => void {
  const popovers = [...doc.querySelectorAll<HTMLDetailsElement>('details[data-dismissable]')]
  const onClick = (event: MouseEvent) => {
    const target = event.target as Node
    for (const d of popovers) {
      if (!d.open) continue
      const inside = d.contains(target)
      const onLink = target instanceof Element && target.closest('a') !== null
      if (!inside || onLink) d.open = false
    }
  }
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    for (const d of popovers) {
      if (!d.open) continue
      d.open = false
      d.querySelector('summary')?.focus()
    }
  }
  doc.addEventListener('click', onClick)
  doc.addEventListener('keydown', onKeydown)
  return () => {
    doc.removeEventListener('click', onClick)
    doc.removeEventListener('keydown', onKeydown)
  }
}
