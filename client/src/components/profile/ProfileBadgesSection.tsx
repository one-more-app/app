import { formatRankingMonthLabel } from "@/lib/ranking-month";
import { UI } from "@/lib/translations";
import type { UserBadgeDto } from "@/lib/badges-api";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const BASE_CHIP =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium leading-tight outline-none transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring";

/** Styles sans bordure, alignés sur les couleurs de ligue. */
function chipClassForTier(tier: string): string {
  if (tier === "top1") {
    return `${BASE_CHIP} bg-amber-200 text-amber-950 dark:bg-amber-600/50 dark:text-amber-100`;
  }
  if (tier === "top3") {
    return `${BASE_CHIP} bg-slate-200 text-slate-900 dark:bg-slate-600/50 dark:text-slate-200`;
  }
  if (tier === "top10") {
    return `${BASE_CHIP} bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-200`;
  }
  return `${BASE_CHIP} bg-secondary text-foreground`;
}

function badgeLabel(badge: UserBadgeDto): string {
  if (badge.kind === "ranking_gym") {
    const tierKey =
      badge.tier === "top1"
        ? UI.badgeRankingGymTop1
        : badge.tier === "top3"
          ? UI.badgeRankingGymTop3
          : badge.tier === "top10"
            ? UI.badgeRankingGymTop10
            : UI.badgeRankingGymTop50;
    const month =
      typeof badge.meta.month === "string"
        ? formatRankingMonthLabel(badge.meta.month)
        : badge.sourceKey;
    return tierKey.replace("{month}", month);
  }
  return badge.tier;
}

export function ProfileBadgesSection({
  badges,
  nested = false,
}: {
  badges: UserBadgeDto[];
  /** Affiché dans le bloc niveau : titre plus compact. */
  nested?: boolean;
}) {
  if (badges.length === 0) return null;

  return (
    <section className="space-y-2" aria-label={UI.profileBadgesTitle}>
      <h2
        className={
          nested
            ? "text-xs text-muted-foreground"
            : "text-sm font-semibold font-one-more uppercase italic text-muted-foreground"
        }
      >
        {UI.profileBadgesTitle}
      </h2>
      <ul className="flex flex-wrap gap-1.5">
        {badges.map((badge) => {
          const label = badgeLabel(badge);
          const chipClass = chipClassForTier(badge.tier);
          const inner = (
            <>
              <Trophy className="size-3 shrink-0" aria-hidden />
              <span>{label}</span>
            </>
          );
          return (
            <li key={badge.id}>
              {badge.deeplink ? (
                <Link to={badge.deeplink} className={chipClass}>
                  {inner}
                </Link>
              ) : (
                <span className={chipClass}>{inner}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
