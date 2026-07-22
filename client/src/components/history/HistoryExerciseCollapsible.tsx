import { ExerciseImage } from '@/components/ExerciseImage'
import { HistoryCollapsedHighlights } from '@/components/history/HistoryCollapsedHighlights'
import { PerfEntryList } from '@/components/history/PerfEntryList'
import { ExerciseTitle } from '@/components/ExerciseTitle'
import { ReactionBubbles } from '@/components/session/ReactionBubbles'
import { Card, CardTitle } from '@/components/ui/card'
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
} from '@/components/ui/popover'
import { useLongPress } from '@/hooks/use-long-press'
import { hapticSelectionChanged } from '@/lib/haptics'
import {
    summarizeExerciseGroupInsights,
    type HistoryEntryInsight,
} from '@/lib/history-entries'
import { profileNestedClass } from '@/lib/profile-section'
import {
    SESSION_REACTION_EMOJIS,
    type ReactionBubble,
} from '@/lib/session-api'
import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import type { PerformanceEntry, TrackedExercise } from '@/types'
import { ChevronDown } from 'lucide-react'
import { Collapsible } from 'radix-ui'
import { useCallback, useMemo, useState, type MouseEvent } from 'react'

type HistoryExerciseCollapsibleProps = {
    trackedExerciseId: string
    items: PerformanceEntry[]
    exercise: TrackedExercise | undefined
    stillTracked: boolean
    seriesLabel: string
    entryInsights: Map<string, HistoryEntryInsight>
    onEditEntry: (entry: PerformanceEntry) => void
    onDeleteEntry: (entry: PerformanceEntry) => void
    /** Ouvre l’ajout d’une perf pour ce jour et cet exercice (ex. depuis l’historique global). */
    onAddEntry?: () => void
    readOnly?: boolean
    /** Sur le profil : fond secondary au lieu d’une Card imbriquée. */
    surface?: 'card' | 'profile'
    reactions?: ReactionBubble[]
    onToggleReaction?: (emoji: string) => void
    reactionsEnabled?: boolean
}

export function HistoryExerciseCollapsible({
    items,
    exercise,
    stillTracked,
    seriesLabel,
    entryInsights,
    onEditEntry,
    onDeleteEntry,
    onAddEntry,
    readOnly = false,
    surface = 'card',
    reactions,
    onToggleReaction,
    reactionsEnabled = false,
}: HistoryExerciseCollapsibleProps) {
    const title = exercise?.name ?? UI.exerciseNotFound
    const canEdit = !!exercise
    const canReact = reactionsEnabled && !!onToggleReaction

    const Shell = surface === 'profile' ? 'div' : Card
    const shellClass =
        surface === 'profile'
            ? cn(profileNestedClass, 'overflow-hidden')
            : 'overflow-hidden py-0'
    const triggerHover =
        surface === 'profile'
            ? 'hover:opacity-90'
            : 'hover:bg-muted/40'
    const thumbBg = surface === 'profile' ? 'bg-background' : 'bg-muted'

    const groupHighlights = useMemo(
        () => summarizeExerciseGroupInsights(items, entryInsights),
        [items, entryInsights],
    )

    const [pickerOpen, setPickerOpen] = useState(false)
    const openPicker = useCallback(() => {
        if (!canReact) return
        void hapticSelectionChanged()
        setPickerOpen(true)
    }, [canReact])

    const { handlers: longPressHandlers, didLongPressRef } = useLongPress({
        onLongPress: openPicker,
        disabled: !canReact,
    })

    const handleTriggerClick = useCallback(
        (event: MouseEvent) => {
            if (!didLongPressRef.current) return
            event.preventDefault()
            event.stopPropagation()
            didLongPressRef.current = false
        },
        [didLongPressRef],
    )

    const triggerButton = (
        <button
            type="button"
            onPointerDown={(event) => {
                void hapticSelectionChanged()
                longPressHandlers.onPointerDown(event)
            }}
            onPointerMove={longPressHandlers.onPointerMove}
            onPointerUp={longPressHandlers.onPointerUp}
            onPointerCancel={longPressHandlers.onPointerCancel}
            onContextMenu={longPressHandlers.onContextMenu}
            onClickCapture={handleTriggerClick}
            className={cn(
                'flex min-w-0 flex-1 items-center gap-3 p-3 text-left transition-colors',
                triggerHover,
            )}
        >
            <div
                className={cn(
                    'relative size-12 shrink-0 overflow-hidden rounded-lg',
                    thumbBg,
                )}
            >
                <ExerciseImage
                    gifUrl={exercise?.gifUrl}
                    isCustom={exercise?.isCustom}
                    bodyPart={exercise?.bodyPart}
                    target={exercise?.target}
                    className="size-full"
                    imgClassName="size-full object-cover"
                    fallbackIconClassName="size-7 text-muted-foreground"
                />
            </div>
            <div className="min-w-0 flex-1">
                <CardTitle>
                    <ExerciseTitle className="flex-1">{title}</ExerciseTitle>
                    {!stillTracked && exercise?.deletedAt ? (
                        <span className="shrink-0 text-xs font-normal normal-case text-muted-foreground">
                            ({UI.exerciseRemovedFromTracking})
                        </span>
                    ) : null}
                </CardTitle>
                <HistoryCollapsedHighlights
                    seriesLabel={seriesLabel}
                    summary={groupHighlights}
                />
            </div>
            <ChevronDown
                className={cn(
                    'size-5 shrink-0 text-muted-foreground transition-transform duration-200',
                    'group-data-[state=open]/coll:rotate-180',
                )}
                aria-hidden
            />
        </button>
    )

    return (
        <li>
            <Collapsible.Root className="group/coll">
                <Shell className={shellClass}>
                    <div className="flex items-stretch">
                        {canReact ? (
                            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                                <PopoverAnchor asChild>
                                    <div className="flex min-w-0 flex-1 items-stretch">
                                        <Collapsible.Trigger asChild>
                                            {triggerButton}
                                        </Collapsible.Trigger>
                                    </div>
                                </PopoverAnchor>
                                <PopoverContent
                                    className="w-auto rounded-full border bg-popover p-1 shadow-md"
                                    side="bottom"
                                    align="start"
                                    sideOffset={6}
                                    onOpenAutoFocus={(event) => event.preventDefault()}
                                >
                                    <div
                                        role="listbox"
                                        aria-label={UI.sessionReactionPick}
                                        className="flex items-center gap-1"
                                    >
                                        {SESSION_REACTION_EMOJIS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                role="option"
                                                aria-label={UI.sessionReactionToggleAdd.replace(
                                                    '{emoji}',
                                                    emoji,
                                                )}
                                                className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs transition-colors hover:bg-muted"
                                                onClick={() => {
                                                    void hapticSelectionChanged()
                                                    onToggleReaction?.(emoji)
                                                    setPickerOpen(false)
                                                }}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        ) : (
                            <Collapsible.Trigger asChild>
                                {triggerButton}
                            </Collapsible.Trigger>
                        )}
                    </div>
                    <Collapsible.Content className="data-[state=closed]:hidden">
                        <PerfEntryList
                            className="px-3 pb-3 pt-2"
                            entries={items}
                            entryInsights={entryInsights}
                            canEdit={canEdit && !readOnly}
                            readOnly={readOnly}
                            onEditEntry={onEditEntry}
                            onDeleteEntry={onDeleteEntry}
                            onAddSet={
                                canEdit && !readOnly && onAddEntry
                                    ? onAddEntry
                                    : undefined
                            }
                        />
                    </Collapsible.Content>
                </Shell>
            </Collapsible.Root>
            {canReact && (reactions?.length ?? 0) > 0 ? (
                <ReactionBubbles
                    reactions={reactions ?? []}
                    onToggle={(emoji) => onToggleReaction?.(emoji)}
                    className="px-1 pt-1.5"
                />
            ) : null}
        </li>
    )
}
