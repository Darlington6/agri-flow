// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { dismissPopovers } from '../src/lib/popovers'

let menu: HTMLDetailsElement
let languages: HTMLDetailsElement
let outside: HTMLElement
let cleanup: () => void

beforeEach(() => {
  const doc = document
  doc.body.innerHTML = `
    <details id="menu" data-dismissable><summary>Menu</summary><a id="link" href="#buyers">Buyers</a><span id="inside">text</span></details>
    <details id="languages" data-dismissable><summary>EN</summary><a href="/fr/">Français</a></details>
    <details id="other"><summary>Not a popover</summary></details>
    <p id="outside">Page</p>`
  cleanup = dismissPopovers(doc)
  menu = doc.getElementById('menu') as HTMLDetailsElement
  languages = doc.getElementById('languages') as HTMLDetailsElement
  outside = doc.getElementById('outside') as HTMLElement
})

afterEach(() => cleanup())

const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))

describe('dismissPopovers', () => {
  it('closes open popovers on a click outside them', () => {
    menu.open = true
    languages.open = true
    click(outside)
    expect(menu.open).toBe(false)
    expect(languages.open).toBe(false)
  })

  it('keeps a popover open when clicking inside it, except on a link', () => {
    menu.open = true
    click(menu.querySelector('#inside')!)
    expect(menu.open).toBe(true)
    click(menu.querySelector('#link')!)
    expect(menu.open).toBe(false)
  })

  it('closes on Escape and returns focus to the toggle', () => {
    menu.open = true
    menu.ownerDocument.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(menu.open).toBe(false)
    expect(menu.ownerDocument.activeElement).toBe(menu.querySelector('summary'))
  })

  it('leaves other <details> alone', () => {
    const other = outside.ownerDocument.getElementById('other') as HTMLDetailsElement
    other.open = true
    click(outside)
    expect(other.open).toBe(true)
  })
})
