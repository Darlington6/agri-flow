import { useRef, useState, type FormEvent } from 'react'
import { Sparkles, Send, Sprout, ShoppingCart, Settings2, CloudSun, Bot } from 'lucide-react'
import { PageHeader, Card, Button, ComingSoonBadge, inputClass } from '@/components/ui'
import { aiService, SUGGESTED_PROMPTS, type AIChatMessage } from '@/services/ai'

const FUTURE_COPILOTS = [
  { label: 'Farmer Copilot', desc: 'Crop and production guidance in-app for smallholder farmers.', icon: Sprout },
  { label: 'Buyer Copilot', desc: 'Supply forecasting and sourcing recommendations for buyers.', icon: ShoppingCart },
  { label: 'Operations Copilot', desc: 'Contract and logistics optimization for platform operations.', icon: Settings2 },
  { label: 'Climate Copilot', desc: 'Climate-risk recommendations tailored to each farm.', icon: CloudSun },
]

function AssistantBubble({ message }: { message: AIChatMessage }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-ink-50 px-4 py-3">
        {message.isAIGenerated && (
          <span className="mb-1.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-brand-600">
            <Sparkles className="h-2.5 w-2.5" />
            AI-generated insight
          </span>
        )}
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-800">{message.content}</p>
      </div>
    </div>
  )
}

function UserBubble({ message }: { message: AIChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-700 px-4 py-3 text-sm text-white">
        {message.content}
      </div>
    </div>
  )
}

export function CopilotPage() {
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  async function ask(question: string) {
    if (!question.trim() || thinking) return
    const userMsg: AIChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setThinking(true)
    const history = [...messages, userMsg]
    await new Promise((resolve) => setTimeout(resolve, 500))
    const reply = await aiService.answerQuestion(question, history)
    setMessages((prev) => [...prev, reply])
    setThinking(false)
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    ask(input)
  }

  return (
    <div className="flex h-[calc(100svh-8rem)] flex-col gap-6 lg:flex-row">
      <div className="flex flex-1 flex-col">
        <PageHeader title="AgriFlow Intelligence" subtitle="Ask questions about your agricultural supply chain." />

        <Card padded={false} className="mt-4 flex flex-1 flex-col overflow-hidden">
          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-6 scrollbar-thin">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Bot className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-base font-semibold text-ink-900">
                    Ask about supply risk, farms, harvest or priorities
                  </p>
                  <p className="mt-1 text-sm text-ink-500">Try one of the prompts below to get started.</p>
                </div>
                <div className="flex max-w-xl flex-wrap justify-center gap-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => ask(p)}
                      className="rounded-full border border-ink-200 px-3.5 py-2 text-xs font-medium text-ink-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) =>
              m.role === 'user' ? <UserBubble key={m.id} message={m} /> : <AssistantBubble key={m.id} message={m} />,
            )}

            {thinking && (
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-ink-50 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400" />
                </div>
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <div className="border-t border-ink-100 px-4 py-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
                  <button
                    key={p}
                    onClick={() => ask(p)}
                    className="rounded-full bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-500 hover:bg-ink-100"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder="Ask a follow-up…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button type="submit" disabled={!input.trim() || thinking}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}

          {messages.length === 0 && (
            <div className="border-t border-ink-100 p-4">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder="Ask a follow-up…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button type="submit" disabled={!input.trim() || thinking}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </Card>
      </div>

      <div className="flex w-full flex-col gap-4 lg:w-72">
        <Card>
          <h2 className="font-display text-sm font-semibold text-ink-700">What the Copilot uses</h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-500">
            Responses are generated from structured platform data — contracts, farmers, production, harvest
            forecasts, climate risk and payments — not from open web search.
          </p>
        </Card>
        <div className="flex flex-col gap-3">
          {FUTURE_COPILOTS.map((c) => (
            <Card key={c.label} className="border-dashed">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                  <c.icon className="h-4 w-4" />
                </span>
                <p className="text-sm font-medium text-ink-800">{c.label}</p>
                <ComingSoonBadge className="ml-auto" />
              </div>
              <p className="mt-2 text-xs text-ink-500">{c.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
