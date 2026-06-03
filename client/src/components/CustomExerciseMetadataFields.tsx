import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { translateEquipment, translateTarget, UI } from '@/lib/translations'

function sortByFrenchLabel(
    items: string[],
    translate: (value: string) => string,
): string[] {
    return [...items].sort((a, b) =>
        translate(a).localeCompare(translate(b), 'fr', { sensitivity: 'base' }),
    )
}

export interface CustomExerciseMetadataFieldsProps {
    targets: string[]
    equipmentOptions: string[]
    target: string
    equipment: string
    onTargetChange: (value: string) => void
    onEquipmentChange: (value: string) => void
}

export function CustomExerciseMetadataFields({
    targets,
    equipmentOptions,
    target,
    equipment,
    onTargetChange,
    onEquipmentChange,
}: CustomExerciseMetadataFieldsProps) {
    const sortedTargets = sortByFrenchLabel(targets, translateTarget)
    const sortedEquipment = sortByFrenchLabel(equipmentOptions, translateEquipment)

    return (
        <>
            <div className="flex flex-col gap-2">
                <Label>{UI.muscleGroup}</Label>
                <Select value={target} onValueChange={onTargetChange}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {sortedTargets.map((t) => (
                            <SelectItem key={t} value={t}>
                                {translateTarget(t)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col gap-2">
                <Label>{UI.equipmentLabel}</Label>
                <Select value={equipment} onValueChange={onEquipmentChange}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {sortedEquipment.map((eq) => (
                            <SelectItem key={eq} value={eq}>
                                {translateEquipment(eq)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </>
    )
}
