import { useTheme } from "@/hooks/use-theme";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";

const TSHIRT_IMAGES = {
  dark: "/images/rewards/tshirt-black.png",
  light: "/images/rewards/tshirt-white.png",
} as const;

type TshirtRewardVisualProps = {
  highlight?: boolean;
  className?: string;
};

export function TshirtRewardVisual({
  highlight = false,
  className,
}: TshirtRewardVisualProps) {
  const { resolvedTheme } = useTheme();
  const src = TSHIRT_IMAGES[resolvedTheme];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex h-28 w-full items-center justify-center sm:h-32",
          highlight && "rounded-xl ring-2 ring-accent/70 ring-offset-2 ring-offset-background",
        )}
      >
        <img
          src={src}
          alt={UI.referralTshirtImageAlt}
          className="max-h-full max-w-[min(100%,220px)] object-contain"
        />
      </div>
      <p className="mt-1 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
        {UI.referralTshirtSloganOutline}
      </p>
      <p className="text-center text-sm font-bold italic tracking-wide text-foreground">
        {UI.referralTshirtSloganBold}
      </p>
    </div>
  );
}
