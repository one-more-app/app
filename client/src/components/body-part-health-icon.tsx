/**
 * Pictogrammes muscles / parties du corps — Icons8 « Set of Muscles » (Envato Elements).
 * @see https://elements.envato.com/muscles-XJGCWH5
 */
import { Icons8MaskIcon } from '@/components/icons8-mask-icon'
import {
    icons8AssetForBodyPart,
    icons8AssetForTarget,
    ICONS8_MUSCLE_ASSETS,
} from '@/lib/icons8-muscle-icons'

export function AllMusclesHealthIcon({ className }: { className?: string }) {
    return (
        <Icons8MaskIcon
            src={ICONS8_MUSCLE_ASSETS.muscle}
            className={className}
        />
    )
}

export function BodyPartHealthIcon({
    bodyPart,
    className,
}: {
    bodyPart: string
    className?: string
}) {
    return (
        <Icons8MaskIcon
            src={icons8AssetForBodyPart(bodyPart)}
            className={className}
        />
    )
}

export function TargetMuscleIcon({
    target,
    className,
}: {
    target: string
    className?: string
}) {
    return (
        <Icons8MaskIcon
            src={icons8AssetForTarget(target)}
            className={className}
        />
    )
}
