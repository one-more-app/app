import type { LeagueLevel } from "@/lib/strength-standards"

export const LEAGUE_COLORS: Record<LeagueLevel, string> = {
  iron: "bg-zinc-700/50 text-zinc-200 border-zinc-500",
  bronze: "bg-amber-900/50 text-amber-200 border-amber-700",
  silver: "bg-slate-600/50 text-slate-200 border-slate-500",
  gold: "bg-amber-600/50 text-amber-100 border-amber-500",
  platinum: "bg-cyan-800/50 text-cyan-200 border-cyan-600",
  emerald: "bg-emerald-800/50 text-emerald-200 border-emerald-600",
  diamond: "bg-violet-600/50 text-violet-100 border-violet-500",
  master: "bg-rose-800/50 text-rose-100 border-rose-600",
  elite: "bg-emerald-700/50 text-emerald-100 border-emerald-500",
  legend: "bg-amber-500/60 text-amber-950 border-amber-400",
}

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
}

/** Classe pour la description du toast palier (contraste lisible sur tous les fonds). */
export const LEAGUE_TOAST_DESCRIPTION_CLASS = "!text-white/95"

export function toastClassForLeague(level: LeagueLevel): string {
  return `!border ${LEAGUE_TOAST_CLASSES[level]}`
}

