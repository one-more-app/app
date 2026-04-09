import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { UI } from '@/lib/translations'

interface BodyWeightLabelProps {
    className?: string
}

/** Affiche "PDC" avec un popover "Poids du corps" */
export function BodyWeightLabel({ className }: BodyWeightLabelProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className={`cursor-help border-b border-dashed border-current hover:border-solid ${className ?? ''}`}
                >
                    {UI.bodyWeightAbbr}
                </button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-auto p-2 text-sm">
                {UI.bodyWeightOnly}
            </PopoverContent>
        </Popover>
    )
}
