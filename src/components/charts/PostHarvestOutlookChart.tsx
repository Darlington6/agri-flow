import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { postHarvestWeeklyOutlook } from '@/data'
import { chartColors, tooltipStyle } from './chartTheme'

export function PostHarvestOutlookChart() {
  const data = postHarvestWeeklyOutlook.map((w) => ({
    week: w.weekLabel,
    'Expected harvest': w.upcomingHarvestTonnes,
    'Storage available': w.storageAvailableTonnes,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="harvestFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.actual} stopOpacity={0.18} />
            <stop offset="100%" stopColor={chartColors.actual} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={chartColors.grid} />
        <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: chartColors.axis, fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: chartColors.axis, fontSize: 11 }} width={36} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${v} t`, name]} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: chartColors.textSecondary }} />
        <Area type="monotone" dataKey="Expected harvest" stroke={chartColors.actual} strokeWidth={2} fill="url(#harvestFill)" activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="Storage available" stroke={chartColors.target} strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
