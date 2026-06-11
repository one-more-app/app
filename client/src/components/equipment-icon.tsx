/**
 * Pictogrammes matériel — Icons8 « Fitness » (Envato Elements).
 * @see https://elements.envato.com/fitness-and-muscles-EANXC44
 */
import { Icons8MaskIcon } from '@/components/icons8-mask-icon'
import {
    icons8AssetForEquipment,
    ICONS8_EQUIPMENT_ASSETS,
} from '@/lib/icons8-equipment-icons'

export function AllEquipmentIcon({ className }: { className?: string }) {
    return (
        <Icons8MaskIcon
            src={ICONS8_EQUIPMENT_ASSETS.crossfit}
            className={className}
        />
    )
}

export function EquipmentIcon({
    equipment,
    className,
}: {
    equipment: string
    className?: string
}) {
    return (
        <Icons8MaskIcon
            src={icons8AssetForEquipment(equipment)}
            className={className}
        />
    )
}
