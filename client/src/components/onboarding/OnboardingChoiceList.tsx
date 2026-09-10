import { onboardingEntrance, OnboardingReveal } from '@/components/onboarding/onboarding-motion'
import { hapticImpact } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type OnboardingChoiceOption<T extends string> = {
    id: T
    label: string
    hint?: string
    Icon?: LucideIcon
    /** Icône marque déjà colorée (pas recolorée selon la sélection). */
    icon?: ReactNode
    section?: string
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
    return (
        <OnboardingReveal delayMs={160}>
            <div
                className="flex flex-col gap-3"
                role="radiogroup"
                aria-label={ariaLabel}
            >
                {options.map(({ id, label, hint, Icon, icon, section, analyticsLabel }, index) => {
                    const selected = value === id
                    const prevSection = index > 0 ? options[index - 1]?.section : undefined
                    const showSection = Boolean(section && section !== prevSection)

                    return (
                        <div key={id} className="flex flex-col gap-2">
                            {showSection ? (
                                <p
                                    className={cn(
                                        'px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground',
                                        index > 0 && 'pt-1',
                                    )}
                                >
                                    {section}
                                </p>
                            ) : null}
                            <button
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                data-analytics-label={analyticsLabel}
                                onClick={() => {
                                    void hapticImpact()
                                    onSelect(id)
                                }}
                                className={onboardingEntrance(
                                    'flex w-full gap-2.5 rounded-xl px-4 py-4 text-left',
                                    hint ? 'items-start' : 'items-center',
                                    'transition-[color,background-color,opacity] duration-150 ease-out',
                                    'active:opacity-90',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                    selected
                                        ? 'bg-primary text-primary-foreground active:bg-primary/85 dark:bg-primary-foreground dark:text-primary dark:active:bg-primary-foreground/85'
                                        : 'bg-card text-foreground hover:bg-card/80 active:bg-muted',
                                    'animate-in fade-in-0 slide-in-from-bottom-2 duration-350',
                                )}
                                style={{
                                    animationDelay: `${120 + index * 60}ms`,
                                }}
                            >
                                {icon ? (
                                    <span
                                        className={cn(
                                            'flex h-5 shrink-0 items-center justify-center',
                                            hint && 'mt-0.5',
                                        )}
                                        aria-hidden
                                    >
                                        {icon}
                                    </span>
                                ) : Icon ? (
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
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span className="font-one-more text-sm uppercase italic leading-tight">
                                        {label}
                                    </span>
                                    {hint ? (
                                        <span
                                            className={cn(
                                                'text-xs leading-snug normal-case',
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
                        </div>
                    )
                })}
            </div>
        </OnboardingReveal>
    )
}
