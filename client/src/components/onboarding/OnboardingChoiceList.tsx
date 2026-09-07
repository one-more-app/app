import { onboardingEntrance, OnboardingReveal } from '@/components/onboarding/onboarding-motion'
import { hapticSelectionChanged } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export type OnboardingChoiceOption<T extends string> = {
    id: T
    label: string
    hint?: string
    Icon?: LucideIcon
    analyticsLabel: string
}

interface OnboardingChoiceListProps<T extends string> {
    value: T | null
    options: OnboardingChoiceOption<T>[]
    onSelect: (value: T) => void
    ariaLabel: string
}

export function OnboardingChoiceList<T extends string>({
    value,
    options,
    onSelect,
    ariaLabel,
}: OnboardingChoiceListProps<T>) {
    const compactGrid =
        options.length === 2 && options.every((option) => !option.hint)

    return (
        <OnboardingReveal delayMs={160}>
            <div
                className={cn(
                    'flex flex-col gap-2',
                    compactGrid && 'grid grid-cols-2 gap-2',
                )}
                role="radiogroup"
                aria-label={ariaLabel}
            >
                {options.map(({ id, label, hint, Icon, analyticsLabel }, index) => {
                    const selected = value === id

                    return (
                        <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            data-analytics-label={analyticsLabel}
                            onClick={() => {
                                void hapticSelectionChanged()
                                onSelect(id)
                            }}
                            className={onboardingEntrance(
                                'flex w-full gap-2.5 rounded-xl px-3 py-2.5 text-left',
                                hint ? 'items-start' : 'items-center',
                                'transition-[color,background-color,opacity] duration-150 ease-out',
                                'active:opacity-90',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                selected
                                    ? 'bg-primary text-primary-foreground active:bg-primary/85 dark:bg-primary-foreground dark:text-primary dark:active:bg-primary-foreground/85'
                                    : 'bg-secondary text-foreground hover:bg-secondary/80 active:bg-muted',
                                'animate-in fade-in-0 slide-in-from-bottom-2 duration-350',
                                compactGrid && 'flex-col items-center justify-center gap-2 py-4 text-center',
                            )}
                            style={{
                                animationDelay: `${120 + index * 60}ms`,
                            }}
                        >
                            {Icon ? (
                                <Icon
                                    className={cn(
                                        'size-5 shrink-0 stroke-[1.75]',
                                        hint && 'mt-0.5',
                                        selected
                                            ? 'text-primary-foreground dark:text-primary'
                                            : 'text-muted-foreground',
                                    )}
                                    aria-hidden
                                />
                            ) : null}
                            <span
                                className={cn(
                                    'flex min-w-0 flex-col gap-0.5',
                                    compactGrid ? 'flex-none items-center' : 'flex-1',
                                )}
                            >
                                <span
                                    className={cn(
                                        'font-one-more text-xs uppercase italic leading-tight',
                                        compactGrid && 'text-center',
                                    )}
                                >
                                    {label}
                                </span>
                                {hint ? (
                                    <span
                                        className={cn(
                                            'text-[11px] leading-snug normal-case',
                                            selected
                                                ? 'text-primary-foreground/75 dark:text-primary/75'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {hint}
                                    </span>
                                ) : null}
                            </span>
                        </button>
                    )
                })}
            </div>
        </OnboardingReveal>
    )
}
