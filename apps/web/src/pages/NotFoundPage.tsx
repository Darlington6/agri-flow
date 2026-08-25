import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-ink-50 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Compass className="h-6 w-6" />
      </span>
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-900">Page not found</h1>
        <p className="mt-1 text-sm text-ink-500">The page you're looking for doesn't exist in this prototype.</p>
      </div>
      <Link to="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  )
}
