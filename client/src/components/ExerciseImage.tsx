import {
    AllMusclesHealthIcon,
    BodyPartHealthIcon,
    TargetMuscleIcon,
} from '@/components/body-part-health-icon'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function ExerciseMuscleFallback({
    target,
    bodyPart,
    className,
}: {
    target?: string
    bodyPart?: string
    className?: string
}) {
    if (target?.trim()) {
        return <TargetMuscleIcon target={target} className={className} />
    }
    if (bodyPart?.trim()) {
        return <BodyPartHealthIcon bodyPart={bodyPart} className={className} />
    }
    return <AllMusclesHealthIcon className={className} />
}

export interface ExerciseImageProps {
    gifUrl?: string
    isCustom?: boolean
    bodyPart?: string
    target?: string
    className?: string
    imgClassName?: string
    fallbackIconClassName?: string
    fit?: 'cover' | 'contain'
    onImageError?: () => void
    /** Ne pas décoder le GIF (ex. pendant une modale de célébration sur iOS). */
    suspendMedia?: boolean
}

export function ExerciseImage({
    gifUrl,
    isCustom = false,
    bodyPart,
    target,
    className,
    imgClassName,
    fallbackIconClassName = 'size-8 text-muted-foreground',
    fit = 'cover',
    onImageError,
    suspendMedia = false,
}: ExerciseImageProps) {
    const [broken, setBroken] = useState(false)
    const showGif =
        !suspendMedia && !isCustom && !!gifUrl?.trim() && !broken

    useEffect(() => {
        setBroken(false)
    }, [gifUrl])

    if (showGif) {
        return (
            <img
                src={getExerciseImageUrl(gifUrl)}
                alt=""
                className={cn(
                    fit === 'cover' ? 'object-cover' : 'object-contain',
                    imgClassName ?? className,
                )}
                onError={() => {
                    setBroken(true)
                    onImageError?.()
                }}
            />
        )
    }

    return (
        <div className={cn('flex items-center justify-center', className)}>
            <ExerciseMuscleFallback
                target={target}
                bodyPart={bodyPart}
                className={fallbackIconClassName}
            />
        </div>
    )
}
