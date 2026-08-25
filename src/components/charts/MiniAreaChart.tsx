import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartColors, tooltipStyle } from './chartTheme'

export function MiniAreaChart({
  data,
  dataKey,
  xKey,
  unit = '',
  height = 72,
}: {
  data: Record<string, unknown>[]
  dataKey: string
  xKey: string
  unit?: string
  height?: number
}) {
  const gradientId = `mini-fill-${dataKey}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.actual} stopOpacity={0.22} />
            <stop offset="100%" stopColor={chartColors.actual} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey={xKey} hide />
        <YAxis hide domain={['dataMin - (dataMax - dataMin) * 0.15', 'dataMax + (dataMax - dataMin) * 0.15']} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(l) => l}
          formatter={(v) => [`${v}${unit}`, '']}
          separator=""
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={chartColors.actual}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
