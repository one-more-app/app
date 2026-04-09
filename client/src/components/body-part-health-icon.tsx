/**
 * Pictogrammes « parties du corps » depuis Health Icons (CC0)
 * @see https://healthicons.org — https://github.com/resolvetosavelives/healthicons
 */
import type { ComponentType, SVGProps } from 'react'
import {
    Arm,
    Body,
    Foot,
    Head,
    Joints,
    Leg,
    Lungs,
    PpeGloves,
    Spine,
    UiMenuGrid,
    WaistCircumference,
} from 'healthicons-react/outline'

type HealthIcon = ComponentType<SVGProps<SVGSVGElement>>

const BODY_PART_ICONS: Record<string, HealthIcon> = {
    chest: Lungs,
    back: Spine,
    shoulders: Joints,
    'upper arms': Arm,
    'lower arms': PpeGloves,
    waist: WaistCircumference,
    'upper legs': Leg,
    'lower legs': Foot,
    neck: Head,
}

export const AllMusclesHealthIcon = UiMenuGrid

export function BodyPartHealthIcon({
    bodyPart,
    className,
}: {
    bodyPart: string
    className?: string
}) {
    const Icon = BODY_PART_ICONS[bodyPart.toLowerCase()] ?? Body
    return <Icon className={className} aria-hidden />
}
