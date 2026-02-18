import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { PerformanceEntry } from '@/types'
import { UI } from '@/lib/translations'

interface Props {
  entries: PerformanceEntry[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

export function PerformanceChart({ entries }: Props) {
  const data = entries.map((e) => ({
    date: formatDate(e.date),
    weight: e.weight,
    fullDate: e.date,
  }))

  const lineColor = '#97d756'
  const gridColor = 'rgba(255, 255, 255, 0.1)'
  const tickColor = 'rgba(255, 255, 255, 0.6)'

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="date"
            tick={{ fill: tickColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
            tickLine={{ stroke: gridColor }}
          />
          <YAxis
            dataKey="weight"
            unit=" kg"
            tick={{ fill: tickColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
            tickLine={{ stroke: gridColor }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(220 13% 18%)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelFormatter={(_, payload) =>
              payload[0]?.payload?.fullDate
                ? new Date(payload[0].payload.fullDate).toLocaleDateString(
                    'fr-FR',
                    {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    }
                  )
                : ''
            }
            formatter={(value: number) => [`${value} kg`, UI.weight]}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={{ fill: lineColor, strokeWidth: 0, r: 4 }}
            activeDot={{ fill: lineColor, stroke: '#fff', strokeWidth: 2, r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
