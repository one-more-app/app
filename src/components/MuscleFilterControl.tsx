import {
    AllMusclesHealthIcon,
    BodyPartHealthIcon,
} from '@/components/body-part-health-icon'
import {
    HierarchicalFilterControl,
    type HierarchicalSelection,
} from '@/components/HierarchicalFilterControl'
import { Button } from '@/components/ui/button'
import {
    buildTargetsByBodyPart,
    isMuscleSelectionEmpty,
    orderedMuscleGroups,
    type MuscleSelection,
} from '@/lib/muscle-filter'
import { translateBodyPart, translateTarget, UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

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
    const byGroup = useMemo(() => buildTargetsByBodyPart(targets), [targets])
    const groups = useMemo(() => orderedMuscleGroups(byGroup), [byGroup])

    return (
        <HierarchicalFilterControl
            title={UI.filterMusclesTitle}
            selection={selection as HierarchicalSelection}
            onChange={(next) => onChange(next as MuscleSelection)}
            groups={groups}
            byGroup={byGroup}
            isSelectionEmpty={(sel) => isMuscleSelectionEmpty(sel as MuscleSelection)}
            allLabel={UI.all}
            renderAllIcon={<AllMusclesHealthIcon className="size-5" />}
            renderHeaderActions={({ clearAll }) =>
                !isMuscleSelectionEmpty(selection) ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={clearAll}
                    >
                        {UI.filterMusclesReset}
                    </Button>
                ) : null
            }
            translateGroup={translateBodyPart}
            translateChild={translateTarget}
            renderGroupIcon={(group, active) => (
                <BodyPartHealthIcon
                    bodyPart={group}
                    className={cn('size-5 shrink-0', !active && 'opacity-70')}
                />
            )}
            className={className}
        />
    )
}
