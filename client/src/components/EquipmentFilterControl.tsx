import {
    AllEquipmentIcon,
    EquipmentIcon,
} from '@/components/equipment-icon'
import {
    HierarchicalFilterControl,
    type HierarchicalSelection,
} from '@/components/HierarchicalFilterControl'
import {
    buildEquipmentByParent,
    isEquipmentSelectionEmpty,
    type EquipmentSelection,
} from '@/lib/equipment-filter'
import { translateEquipment, UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

export interface EquipmentFilterControlProps {
    selection: EquipmentSelection
    onChange: (next: EquipmentSelection) => void
    parentOptions: string[]
    availableRawEquipment: string[]
    className?: string
}

export function EquipmentFilterControl({
    selection,
    onChange,
    parentOptions,
    availableRawEquipment,
    className,
}: EquipmentFilterControlProps) {
    const byParent = useMemo(
        () => buildEquipmentByParent(parentOptions, availableRawEquipment),
        [parentOptions, availableRawEquipment],
    )
    const parents = useMemo(
        () => parentOptions.filter((p) => (byParent[p] ?? []).length > 0),
        [parentOptions, byParent],
    )

    return (
        <HierarchicalFilterControl
            title={UI.filterByEquipment}
            selection={selection as HierarchicalSelection}
            onChange={(next) => onChange(next as EquipmentSelection)}
            groups={parents}
            byGroup={byParent}
            isSelectionEmpty={(sel) =>
                isEquipmentSelectionEmpty(sel as EquipmentSelection)
            }
            allLabel={UI.all}
            renderAllIcon={<AllEquipmentIcon className="size-6" />}
            translateGroup={translateEquipment}
            translateChild={translateEquipment}
            renderGroupIcon={(group, active) => (
                <EquipmentIcon
                    equipment={group}
                    className={cn('size-6 shrink-0', !active && 'opacity-70')}
                />
            )}
            className={className}
        />
    )
}
