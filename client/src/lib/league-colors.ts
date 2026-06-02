import type { LeagueLevel } from "@/lib/strength-standards";

/**
 * Remplissage SVG / zones muscle (carte stats). Cohérent avec l’identité visuelle des paliers.
 */
export const LEAGUE_MAP_FILL: Record<
  LeagueLevel,
  { light: string; dark: string }
> = {
  iron: { light: "hsl(240 6% 52%)", dark: "hsl(240 10% 40%)" },
  bronze: { light: "hsl(32 62% 44%)", dark: "hsl(28 55% 36%)" },
  silver: { light: "hsl(215 20% 46%)", dark: "hsl(215 18% 38%)" },
  gold: { light: "hsl(38 88% 44%)", dark: "hsl(38 82% 36%)" },
  platinum: { light: "hsl(192 72% 40%)", dark: "hsl(192 65% 33%)" },
  emerald: { light: "hsl(158 58% 36%)", dark: "hsl(158 52% 30%)" },
  diamond: { light: "hsl(263 58% 52%)", dark: "hsl(263 52% 44%)" },
  master: { light: "hsl(350 58% 48%)", dark: "hsl(350 52% 40%)" },
  elite: { light: "hsl(152 62% 34%)", dark: "hsl(152 55% 28%)" },
  legend: { light: "hsl(43 92% 46%)", dark: "hsl(43 88% 40%)" },
};

export function leagueMapFill(level: LeagueLevel, isDark: boolean): string {
  return isDark ? LEAGUE_MAP_FILL[level].dark : LEAGUE_MAP_FILL[level].light;
}

/** Badges / pastilles : fonds opaques clairs + texte foncé en mode clair (les /50 sur blanc tuaient le contraste). */
export const LEAGUE_COLORS: Record<LeagueLevel, string> = {
  iron:
    "border-zinc-500 bg-zinc-200 text-zinc-900 dark:bg-zinc-700/50 dark:text-zinc-200 dark:border-zinc-500",
  bronze:
    "border-amber-600 bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700",
  silver:
    "border-slate-500 bg-slate-200 text-slate-900 dark:bg-slate-600/50 dark:text-slate-200 dark:border-slate-500",
  gold:
    "border-amber-600 bg-amber-200 text-amber-950 dark:bg-amber-600/50 dark:text-amber-100 dark:border-amber-500",
  platinum:
    "border-cyan-600 bg-cyan-100 text-cyan-950 dark:bg-cyan-800/50 dark:text-cyan-200 dark:border-cyan-600",
  emerald:
    "border-emerald-600 bg-emerald-100 text-emerald-950 dark:bg-emerald-800/50 dark:text-emerald-200 dark:border-emerald-600",
  diamond:
    "border-violet-600 bg-violet-200 text-violet-950 dark:bg-violet-600/50 dark:text-violet-100 dark:border-violet-500",
  master:
    "border-rose-600 bg-rose-100 text-rose-950 dark:bg-rose-800/50 dark:text-rose-100 dark:border-rose-600",
  elite:
    "border-emerald-500 bg-emerald-100 text-emerald-950 dark:bg-emerald-700/50 dark:text-emerald-100 dark:border-emerald-500",
  legend:
    "border-amber-500 bg-amber-200 text-amber-950 dark:bg-amber-500/60 dark:text-amber-50 dark:border-amber-400",
};

export const LEAGUE_1RM_STYLES: Record<LeagueLevel, string> = {
  iron:
    "border border-zinc-400/90 bg-zinc-100/90 dark:border-zinc-500/80 dark:bg-zinc-700/20",
  bronze:
    "border border-amber-600/80 bg-amber-50/90 dark:border-amber-700/80 dark:bg-amber-900/20",
  silver:
    "border border-slate-400/90 bg-slate-100/90 dark:border-slate-500/80 dark:bg-slate-600/20",
  gold:
    "border border-amber-500/80 bg-amber-50/90 dark:border-amber-500/80 dark:bg-amber-600/20",
  platinum:
    "border border-cyan-500/80 bg-cyan-50/90 dark:border-cyan-600/80 dark:bg-cyan-800/20",
  emerald:
    "border border-emerald-500/80 bg-emerald-50/90 dark:border-emerald-600/80 dark:bg-emerald-800/20",
  diamond:
    "border border-violet-500/80 bg-violet-50/90 dark:border-violet-500/80 dark:bg-violet-600/20",
  master:
    "border border-rose-500/80 bg-rose-50/90 dark:border-rose-600/80 dark:bg-rose-800/20",
  elite:
    "border border-emerald-500/80 bg-emerald-50/90 dark:border-emerald-500/80 dark:bg-emerald-700/20",
  legend:
    "border border-amber-500/80 bg-amber-50/90 dark:border-amber-400/80 dark:bg-amber-500/20",
};

/** Classes pour le toast Sonner (avec ! pour écraser les styles par défaut du Toaster). */
const LEAGUE_TOAST_CLASSES: Record<LeagueLevel, string> = {
  iron: "!bg-zinc-800 !text-zinc-100 !border-zinc-500",
  bronze: "!bg-amber-950 !text-amber-100 !border-amber-700",
  silver: "!bg-slate-700 !text-slate-100 !border-slate-500",
  gold: "!bg-amber-800 !text-amber-50 !border-amber-500",
  platinum: "!bg-cyan-900 !text-cyan-100 !border-cyan-600",
  emerald: "!bg-emerald-900 !text-emerald-100 !border-emerald-600",
  diamond: "!bg-violet-800 !text-violet-100 !border-violet-500",
  master: "!bg-rose-900 !text-rose-100 !border-rose-600",
  elite: "!bg-emerald-800 !text-emerald-50 !border-emerald-500",
  legend: "!bg-amber-700 !text-amber-50 !border-amber-400",
};

/** Classe pour la description du toast palier (contraste lisible sur tous les fonds). */
export const LEAGUE_TOAST_DESCRIPTION_CLASS =
  "!text-[11px] !leading-snug !text-white/90";

export function toastClassForLeague(level: LeagueLevel): string {
  return `!rounded-xl !border !px-3 !py-2 !text-xs !shadow-sm ${LEAGUE_TOAST_CLASSES[level]}`;
}
