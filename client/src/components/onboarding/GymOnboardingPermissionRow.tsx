import { Switch } from '@/components/ui/switch'
import { type LucideIcon } from 'lucide-react'

type GymOnboardingPermissionRowProps = {
    icon: LucideIcon
    label: string
    hint: string
    checked: boolean
    disabled?: boolean
    busy?: boolean
    onCheckedChange: (checked: boolean) => void
}

export function GymOnboardingPermissionRow({
    icon: Icon,
    label,
    hint,
    checked,
    disabled,
    busy,
    onCheckedChange,
}: GymOnboardingPermissionRowProps) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-muted/20 p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Icon className="size-5 stroke-[1.75]" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-1 flex-row items-center justify-between gap-2">
                <div className="flex flex-col items-start justify-start">
                    <p className="font-one-more text-xs font-semibold uppercase italic leading-tight">
                        {label}
                    </p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
                <Switch
                    checked={checked}
                    disabled={disabled || busy}
                    onCheckedChange={onCheckedChange}
                    aria-label={label}
                />
            </div>
        </div>
    )
}
