import type { LeagueInfo, LeagueTier } from "@/lib/strength-standards";

export function leagueTierOf(league: LeagueInfo): LeagueTier {
  return league.tier;
}

export const LEAGUE_MAP_FILL: Record<
  LeagueTier,
  { light: string; dark: string }
> = {
  bronze: { light: "hsl(32 62% 44%)", dark: "hsl(28 55% 36%)" },
  silver: { light: "hsl(215 20% 46%)", dark: "hsl(215 18% 38%)" },
  gold: { light: "hsl(38 88% 44%)", dark: "hsl(38 82% 36%)" },
  platinum: { light: "hsl(192 72% 40%)", dark: "hsl(192 65% 33%)" },
  diamond: { light: "hsl(263 58% 52%)", dark: "hsl(263 52% 44%)" },
  legend: { light: "#dfff5e", dark: "hsl(69 90% 58%)" },
};

export function leagueMapFill(tier: LeagueTier, isDark: boolean): string {
  return isDark ? LEAGUE_MAP_FILL[tier].dark : LEAGUE_MAP_FILL[tier].light;
}

/** Couleur d’accent (icône + sous-rang) pour les pastilles de rang noires. */
export const LEAGUE_ACCENT_CLASS: Record<LeagueTier, string> = {
  bronze: "text-[#C47A2A]",
  silver: "text-[#A8AAB4]",
  gold: "text-[#F5C518]",
  platinum: "text-cyan-400",
  diamond: "text-violet-400",
  legend: "text-accent",
};

export const LEAGUE_COLORS: Record<LeagueTier, string> = {
  bronze:
    "border-amber-600 bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700",
  silver:
    "border-slate-500 bg-slate-200 text-slate-900 dark:bg-slate-600/50 dark:text-slate-200 dark:border-slate-500",
  gold:
    "border-amber-600 bg-amber-200 text-amber-950 dark:bg-amber-600/50 dark:text-amber-100 dark:border-amber-500",
  platinum:
    "border-cyan-600 bg-cyan-100 text-cyan-950 dark:bg-cyan-800/50 dark:text-cyan-200 dark:border-cyan-600",
  diamond:
    "border-violet-600 bg-violet-200 text-violet-950 dark:bg-violet-600/50 dark:text-violet-100 dark:border-violet-500",
  legend:
    "border-accent bg-accent/35 text-accent-foreground dark:bg-accent/25 dark:text-accent-foreground dark:border-accent",
};

export const LEAGUE_1RM_STYLES: Record<LeagueTier, string> = {
  bronze:
    "border border-amber-600/80 bg-amber-50/90 dark:border-amber-700/80 dark:bg-amber-900/20",
  silver:
    "border border-slate-400/90 bg-slate-100/90 dark:border-slate-500/80 dark:bg-slate-600/20",
  gold:
    "border border-amber-500/80 bg-amber-50/90 dark:border-amber-500/80 dark:bg-amber-600/20",
  platinum:
    "border border-cyan-500/80 bg-cyan-50/90 dark:border-cyan-600/80 dark:bg-cyan-800/20",
  diamond:
    "border border-violet-500/80 bg-violet-50/90 dark:border-violet-500/80 dark:bg-violet-600/20",
  legend:
    "border border-accent/80 bg-accent/15 dark:border-accent/70 dark:bg-accent/15",
};

const LEAGUE_TOAST_CLASSES: Record<LeagueTier, string> = {
  bronze: "!bg-amber-950 !text-amber-100 !border-amber-700",
  silver: "!bg-slate-700 !text-slate-100 !border-slate-500",
  gold: "!bg-amber-800 !text-amber-50 !border-amber-500",
  platinum: "!bg-cyan-900 !text-cyan-100 !border-cyan-600",
  diamond: "!bg-violet-800 !text-violet-100 !border-violet-500",
  legend: "!bg-accent !text-accent-foreground !border-accent",
};

export const LEAGUE_TOAST_DESCRIPTION_CLASS =
  "!text-[11px] !leading-snug !text-white/90";

export function toastClassForLeague(league: LeagueInfo | LeagueTier): string {
  const tier = typeof league === "string" ? league : league.tier;
  return `!rounded-xl !border !px-3 !py-2 !text-xs !shadow-sm ${LEAGUE_TOAST_CLASSES[tier]}`;
}

export function colorsForLeague(league: LeagueInfo): string {
  return LEAGUE_COLORS[league.tier];
}
