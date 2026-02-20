import { UI } from "@/lib/landing-data";
import { cn } from "@/lib/utils";

interface BodyWeightLabelProps {
    className?: string;
}

/** Affiche "PDC" (poids du corps) — version landing sans popover */
export function BodyWeightLabel({ className }: BodyWeightLabelProps) {
    return (
        <span
            title={UI.bodyWeightOnly}
            className={cn(
                "cursor-help border-b border-dashed border-current hover:border-solid",
                className
            )}
        >
            {UI.bodyWeightAbbr}
        </span>
    );
}
