import { useState } from 'react'
import { Phone, PhoneOff } from 'lucide-react'
import { Button, Modal } from '@/components/ui'

export function CallButton({ counterpartyName, counterpartyPhone }: { counterpartyName: string; counterpartyPhone: string }) {
  const [open, setOpen] = useState(false)
  const [calling, setCalling] = useState(false)

  function startCall() {
    setOpen(true)
    setCalling(true)
    setTimeout(() => setCalling(false), 1600)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={startCall}>
        <Phone className="h-3.5 w-3.5" />
        Call
      </Button>
      {open && (
        <Modal title={calling ? 'Calling…' : 'Voice calling'} onClose={() => setOpen(false)}>
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full ${
                calling ? 'animate-pulse bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-400'
              }`}
            >
              {calling ? <Phone className="h-7 w-7" /> : <PhoneOff className="h-7 w-7" />}
            </span>
            {calling ? (
              <p className="text-sm text-ink-600">Calling {counterpartyName}…</p>
            ) : (
              <div>
                <p className="text-sm font-medium text-ink-800">In-app voice calling is coming soon.</p>
                <p className="mt-2 text-sm text-ink-500">
                  For now, reach {counterpartyName} directly at{' '}
                  <span className="font-medium text-ink-700">{counterpartyPhone}</span>.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
