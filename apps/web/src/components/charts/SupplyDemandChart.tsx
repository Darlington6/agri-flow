import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { crops, supplyDemandSeries } from '@/data'
import type { CropId } from '@/types'
import { chartColors, tooltipStyle } from './chartTheme'

export function SupplyDemandChart() {
  const [cropId, setCropId] = useState<CropId>('tomatoes')

  const data = useMemo(
    () =>
      supplyDemandSeries.map((point) => ({
        week: point.week,
        Demand: point[cropId].demand,
        Supply: point[cropId].supply,
      })),
    [cropId],
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-ink-900">Supply vs Demand</h3>
          <p className="text-xs text-ink-500">Next 12 weeks, tonnes</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-ink-50 p-1">
          {crops.map((c) => (
            <button
              key={c.id}
              onClick={() => setCropId(c.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                cropId === c.id ? 'bg-white text-brand-800 shadow-sm' : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="supplyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.actual} stopOpacity={0.18} />
              <stop offset="100%" stopColor={chartColors.actual} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={chartColors.grid} />
          <XAxis
            dataKey="week"
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartColors.axis, fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartColors.axis, fontSize: 11 }}
            width={36}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${v} t`, name]} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: chartColors.textSecondary }}
          />
          <Area
            type="monotone"
            dataKey="Supply"
            stroke={chartColors.actual}
            strokeWidth={2}
            fill="url(#supplyFill)"
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Demand"
            stroke={chartColors.target}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
