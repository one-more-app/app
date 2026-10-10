import { REVIEW_FOUNDERS_IMAGE_SRC } from "@/lib/review-founders-image";
import { cn } from "@/lib/utils";

type Props = {
    className?: string;
    /** Réduit la largeur (pulse avis). */
    compact?: boolean;
};

export function ReviewFoundersPhoto({ className, compact }: Props) {
    return (
        <div
            className={cn(
                "overflow-hidden rounded-xl border border-border bg-muted",
                compact && "mx-auto w-full max-w-[13.5rem]",
                className,
            )}
        >
            <img
                src={REVIEW_FOUNDERS_IMAGE_SRC}
                alt=""
                className="aspect-[640/430] w-full select-none object-cover"
                draggable={false}
            />
        </div>
    );
}
