import { UI } from '@/lib/translations'
import type { PerformanceEntry } from '@/types'
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

interface Props {
    entries: PerformanceEntry[]
    /** Appelé au clic sur un point (date au format YYYY-MM-DD) */
    onDayClick?: (date: string) => void
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
    })
}

/** Regroupe les entries par jour et garde la meilleure perf (poids puis reps) */
function getBestPerDayAndAllByDate(entries: PerformanceEntry[]) {
    const allByDate = new Map<string, PerformanceEntry[]>()
    const bestByDate = new Map<string, PerformanceEntry>()
    for (const e of entries) {
        const key = e.date
        if (!allByDate.has(key)) allByDate.set(key, [])
        allByDate.get(key)!.push(e)
        const existing = bestByDate.get(key)
        if (
            !existing ||
            e.weight > existing.weight ||
            (e.weight === existing.weight && e.reps > existing.reps)
        ) {
            bestByDate.set(key, e)
        }
    }
    const bestList = [...bestByDate.values()].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    return { bestList, allByDate }
}

function formatPerfLabel(weight: number, reps: number): string {
    const weightLabel =
        weight === 0
            ? `${UI.bodyWeightAbbr} (${UI.bodyWeightOnly})`
            : `${weight} kg`
    return `${weightLabel} × ${reps} reps`
}

export function PerformanceChart({ entries, onDayClick }: Props) {
    const { bestList, allByDate } = getBestPerDayAndAllByDate(entries)
    const data = bestList.map((e) => ({
        date: formatDate(e.date),
        weight: e.weight,
        reps: e.reps,
        fullDate: e.date,
        allEntries: allByDate.get(e.date) ?? [],
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
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const { fullDate, allEntries } = payload[0].payload as {
                                fullDate: string
                                allEntries: PerformanceEntry[]
                            }
                            if (!fullDate) return null
                            const dateLabel = new Date(fullDate).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })
                            return (
                                <div className="px-3 py-2 min-w-[140px]">
                                    <div className="font-medium mb-2">{dateLabel}</div>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        {allEntries.map((entry, i) => (
                                            <li key={entry.id ?? i}>
                                                {formatPerfLabel(entry.weight, entry.reps)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="weight"
                        stroke={lineColor}
                        strokeWidth={2.5}
                        dot={(props) => {
                            const { cx, cy, payload, key } = props
                            if (cx == null || cy == null) return null
                            return (
                                <g
                                    key={key}
                                    onClick={() => onDayClick?.(payload.fullDate)}
                                    style={{
                                        cursor: onDayClick ? 'pointer' : 'default',
                                    }}
                                >
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={4}
                                        fill={lineColor}
                                        strokeWidth={0}
                                    />
                                </g>
                            )
                        }}
                        activeDot={(props) => {
                            const { cx, cy, payload, key } = props
                            if (cx == null || cy == null) return null
                            return (
                                <g
                                    key={key}
                                    onClick={() => onDayClick?.(payload.fullDate)}
                                    style={{
                                        cursor: onDayClick ? 'pointer' : 'default',
                                    }}
                                >
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={5}
                                        fill={lineColor}
                                        stroke="#fff"
                                        strokeWidth={2}
                                    />
                                </g>
                            )
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
