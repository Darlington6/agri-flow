import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { networkGrowthTrend } from '@/data'
import { chartColors, tooltipStyle } from './chartTheme'
import { formatGHS } from '@/lib/format'

function shortGHS(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

export function GrowthTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={networkGrowthTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.actual} stopOpacity={0.28} />
            <stop offset="100%" stopColor={chartColors.actual} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={chartColors.grid} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartColors.axis, fontSize: 11 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tick={{ fill: chartColors.axis, fontSize: 11 }}
          tickFormatter={(v: number) => shortGHS(v)}
          domain={['dataMin - 100000', 'dataMax + 100000']}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatGHS(Number(v)), 'Contracted value']} />
        <Area
          type="monotone"
          dataKey="contractedValueGHS"
          stroke={chartColors.actual}
          strokeWidth={2.5}
          fill="url(#growth-fill)"
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
