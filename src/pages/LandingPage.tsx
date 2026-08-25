import { Link } from 'react-router-dom'
import {
  Leaf,
  ArrowRight,
  ClipboardList,
  FileSignature,
  Sprout,
  CloudSun,
  Warehouse,
  Truck,
  Wallet,
  LineChart,
  ShoppingCart,
  UserCheck,
  Building2,
  ArrowDown,
} from 'lucide-react'
import { brand } from '@/config/brand'
import { DemoTag } from '@/components/ui'

const FLOW_STEPS = [
  { label: 'Buyer Demand', icon: ClipboardList },
  { label: 'Farmer Production', icon: Sprout },
  { label: 'Climate Intelligence', icon: CloudSun },
  { label: 'Harvest', icon: Warehouse },
  { label: 'Delivery', icon: Truck },
]

const LOOP_STEPS = [
  { label: 'Demand', icon: ClipboardList, desc: 'Institutional buyers submit verified demand: crop, quantity, grade, delivery date.' },
  { label: 'Contracts', icon: FileSignature, desc: 'Demand becomes production contracts matched to farmers with capacity to deliver.' },
  { label: 'Production', icon: Sprout, desc: 'Farmers grow against a confirmed contract, with guidance for the target quality grade.' },
  { label: 'Climate Intelligence', icon: CloudSun, desc: 'Rainfall, heat and drought risk are tracked against each production cycle.' },
  { label: 'Harvest Forecast', icon: LineChart, desc: 'Expected yield is projected ahead of harvest, adjusted for climate risk.' },
  { label: 'Post-Harvest Coordination', icon: Warehouse, desc: 'Storage, aggregation and buyer pickup are coordinated to limit losses.' },
  { label: 'Delivery', icon: Truck, desc: 'Produce moves from farm to buyer against the original contract terms.' },
  { label: 'Payment', icon: Wallet, desc: 'Buyer and farmer payments are tracked through to settlement.' },
  { label: 'Performance Data', icon: LineChart, desc: 'Delivery reliability and yield accuracy feed back into future contracts.' },
]

const USERS = [
  {
    label: 'Institutional Buyers',
    icon: ShoppingCart,
    desc: 'Food processors, hotels, restaurants, supermarkets, aggregators and exporters securing predictable, traceable supply.',
  },
  {
    label: 'Farmers',
    icon: Sprout,
    desc: 'Smallholder farmers and farmer groups producing against reliable demand and contracted terms.',
  },
  {
    label: 'Field Agents',
    icon: UserCheck,
    desc: 'Agronomists monitoring farms, verifying climate-smart practices and reporting issues early.',
  },
  {
    label: 'Operations Teams',
    icon: Building2,
    desc: 'Platform staff managing supply visibility, contracts, forecasting and risk across the network.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-svh bg-white">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold text-ink-900">{brand.name}</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-ink-600 md:flex">
            <a href="#how-it-works" className="hover:text-ink-900">How it works</a>
            <a href="#users" className="hover:text-ink-900">Who it's for</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-ink-600 hover:text-ink-900">
              Log in
            </Link>
            <Link
              to="/login"
              className="inline-flex h-10 items-center rounded-xl bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
            >
              Explore the Platform
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <DemoTag className="mx-auto mb-6" />
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl">
            {brand.statement}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-ink-600 sm:text-lg">
            {brand.name} connects institutional buyers with smallholder farmers through production contracts,
            climate intelligence, harvest forecasting and coordinated post-harvest delivery.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-medium text-white hover:bg-brand-800"
            >
              Explore the Platform
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 px-5 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              See How It Works
            </a>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:gap-2 sm:p-6">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.label} className="flex flex-1 items-center gap-2">
                <div className="flex flex-1 flex-col items-center gap-2 rounded-xl px-3 py-3 text-center sm:py-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-ink-700 sm:text-sm">{step.label}</span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-ink-300 sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-50/50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            Production and demand are poorly coordinated
          </h2>
          <p className="mt-4 text-base text-ink-600">
            Smallholder farmers often produce without reliable knowledge of future demand, while institutional
            buyers struggle to secure predictable volumes, quality and delivery. {brand.name} reverses the
            traditional model: demand drives production, not the other way around.
          </p>
          <p className="mt-6 font-display text-lg font-medium text-brand-800">{brand.substatement}</p>
        </div>
      </section>

      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
              One coordination layer, end to end
            </h2>
            <p className="mt-3 text-sm text-ink-600 sm:text-base">
              Every module connects back to a single production contract — from the moment demand is verified to
              the moment performance data informs the next one.
            </p>
          </div>

          <div className="mx-auto mt-12 flex max-w-md flex-col sm:max-w-5xl">
            <div className="grid gap-3 sm:grid-cols-3">
              {LOOP_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-start gap-3 sm:flex-col sm:items-start">
                  <div className="flex w-full flex-col gap-2 rounded-2xl border border-ink-100 bg-white p-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <step.icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="font-display text-sm font-semibold text-ink-900">{step.label}</p>
                    <p className="text-xs leading-relaxed text-ink-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center text-ink-300 sm:hidden">
              <ArrowDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </section>

      <section id="users" className="border-t border-ink-100 bg-ink-50/50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Built for four roles</h2>
            <p className="mt-3 text-sm text-ink-600 sm:text-base">
              Each role sees the same supply chain, from a different vantage point.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USERS.map((u) => (
              <div key={u.label} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[var(--shadow-card)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <u.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-sm font-semibold text-ink-900">{u.label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            Explore a working prototype
          </h2>
          <p className="mt-3 text-sm text-ink-600 sm:text-base">
            Walk through a live demand-to-farm scenario: a buyer's tomato order, matched farmers, climate risk,
            harvest forecast, post-harvest coordination and payment — all connected.
          </p>
          <Link
            to="/login"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-medium text-white hover:bg-brand-800"
          >
            Explore the Platform
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center sm:px-6">
          <p className="text-xs text-ink-400">
            {brand.name} is an early-stage prototype. All metrics, farmers, buyers and contracts shown are
            simulated demonstration data.
          </p>
        </div>
      </footer>
    </div>
  )
}
