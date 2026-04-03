import {
    AllMusclesHealthIcon,
    BodyPartHealthIcon,
} from '@/components/body-part-health-icon'
import {
    HierarchicalFilterControl,
    type HierarchicalSelection,
} from '@/components/HierarchicalFilterControl'
import { inferBodyPartFromTarget } from '@/lib/infer-body-part-from-target'
import {
    isMuscleSelectionEmpty,
    type MuscleSelection,
} from '@/lib/muscle-filter'
import { sortTargetsByRecentPerformanceFirst } from '@/lib/storage'
import { translateTarget, UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'

export interface MuscleFilterControlProps {
    selection: MuscleSelection
    onChange: (next: MuscleSelection) => void
    /** Liste des `target` présents dans les données (catalogue ou suivi) */
    targets: string[]
    className?: string
}

export function MuscleFilterControl({
    selection,
    onChange,
    targets,
    className,
}: MuscleFilterControlProps) {
    const [perfSortTick, setPerfSortTick] = useState(0)
    useEffect(() => {
        const bump = () => setPerfSortTick((n) => n + 1)
        window.addEventListener('one-more:local-data-changed', bump)
        return () =>
            window.removeEventListener('one-more:local-data-changed', bump)
    }, [])

    const orderedTargets = useMemo(
        () => sortTargetsByRecentPerformanceFirst(targets),
        [targets, perfSortTick],
    )

    const byTarget = useMemo(
        () =>
            Object.fromEntries(
                orderedTargets.map((t) => [t, [t]] as const),
            ) as Record<string, string[]>,
        [orderedTargets],
    )

    return (
        <HierarchicalFilterControl
            title={UI.filterMusclesTitle}
            selection={selection as HierarchicalSelection}
            onChange={(next) => onChange(next as MuscleSelection)}
            groups={orderedTargets}
            byGroup={byTarget}
            isSelectionEmpty={(sel) => isMuscleSelectionEmpty(sel as MuscleSelection)}
            allLabel={UI.all}
            renderAllIcon={<AllMusclesHealthIcon className="size-5" />}
            translateGroup={translateTarget}
            translateChild={translateTarget}
            renderGroupIcon={(group, active) => (
                <BodyPartHealthIcon
                    bodyPart={inferBodyPartFromTarget(group) ?? 'chest'}
                    className={cn('size-5 shrink-0', !active && 'opacity-70')}
                />
            )}
            className={className}
        />
    )
}
