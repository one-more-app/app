import { Button } from "@/components/ui/button";
import { UI } from "@/lib/translations";
import { Play } from "lucide-react";

type HomeStartSessionCtaProps = {
  onClick: () => void;
};

/** CTA fixe au dessus de la bottom nav (visible hors séance en cours). */
export function HomeStartSessionCta({ onClick }: HomeStartSessionCtaProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-10 bg-gradient-to-t from-background from-60% to-transparent px-4 pb-3 pt-6"
      style={{ bottom: "calc(var(--bottom-nav-height) + var(--safe-bottom))" }}
    >
      <div className="mx-auto max-w-2xl">
        <Button
          className="pointer-events-auto h-11 w-full gap-2 font-one-more font-bold uppercase italic"
          onClick={onClick}
          data-analytics-label="home_start_session"
          data-tour="home-start-session"
        >
          <Play className="size-3.5 fill-current" aria-hidden />
          {UI.homeStartSession}
        </Button>
      </div>
    </div>
  );
}
