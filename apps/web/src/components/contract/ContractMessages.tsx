import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { Card, Button, inputClass } from '@/components/ui'
import { CallButton } from './CallButton'
import { usePlatformData } from '@/context/PlatformDataContext'
import { useSession } from '@/context/SessionContext'
import type { DemoRole } from '@/types'

export function ContractMessages({
  contractId,
  counterpartyName,
  counterpartyPhone,
}: {
  contractId: string
  counterpartyName: string
  counterpartyPhone: string
}) {
  const { session } = useSession()
  const { messages, sendMessage } = usePlatformData()
  const [text, setText] = useState('')

  const thread = messages.filter((m) => m.contractId === contractId).sort((a, b) => a.sentAt.localeCompare(b.sentAt))
  const myRole: DemoRole = session?.role ?? 'Platform Admin'
  const myName = session?.name ?? 'You'

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(contractId, myRole, myName, text.trim())
    setText('')
  }

  return (
    <Card padded={false} className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5">
        <div>
          <h2 className="font-display text-sm font-semibold text-ink-900">Messages</h2>
          <p className="text-xs text-ink-500">With {counterpartyName}</p>
        </div>
        <CallButton counterpartyName={counterpartyName} counterpartyPhone={counterpartyPhone} />
      </div>

      <div className="mt-4 flex max-h-80 flex-col gap-3 overflow-y-auto px-5 scrollbar-thin">
        {thread.length === 0 && <p className="pb-2 text-sm text-ink-400">No messages yet — say hello.</p>}
        {thread.map((m) => {
          const mine = m.senderRole === myRole
          return (
            <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${mine ? 'rounded-tr-sm bg-brand-700 text-white' : 'rounded-tl-sm bg-ink-50 text-ink-800'}`}>
                {!mine && <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{m.senderName}</p>}
                <p>{m.text}</p>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 border-t border-ink-100 p-4">
        <input
          className={inputClass}
          placeholder="Write a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={!text.trim()}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </Card>
  )
}
