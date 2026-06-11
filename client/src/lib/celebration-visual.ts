import type { CSSProperties } from 'react'

import { leagueMapFill } from '@/lib/league-colors'
import type { NewRecordCelebrationPayload } from '@/lib/perf-notifications'

/** Même dégradé que la modale de célébration (à garder aligné avec `LeaguePromotionCelebration`). */
export function streakCelebrationRadialBackground(): string {
  return `radial-gradient(ellipse 85% 65% at 50% 15%, color-mix(in srgb, #f97316 42%, transparent), transparent 72%)`
}

/** Halo accent XP / montée de niveau (aligné sur `--accent`). */
export function levelCelebrationRadialBackground(): string {
  return `radial-gradient(ellipse 85% 65% at 50% 15%, color-mix(in srgb, var(--accent) 48%, transparent), transparent 72%)`
}

export function leagueCelebrationRadialBackground(leagueColor: string): string {
  return `radial-gradient(ellipse 85% 65% at 50% 15%, color-mix(in srgb, ${leagueColor} 42%, transparent), transparent 72%)`
}

export function recordCelebrationGlow(
  leagueAfter: NewRecordCelebrationPayload['leagueAfter'],
  isDark: boolean,
): string {
  if (leagueAfter) return leagueMapFill(leagueAfter.tier, isDark)
  return isDark ? 'hsl(68 90% 52%)' : 'hsl(68 72% 42%)'
}

/**
 * Variables thème isolées pour la carte hors-modale (capture html-to-image) :
 * ne dépend pas de la classe `dark` sur `<html>`.
 */
/** Vignette story : lisibilité du texte sur image ou fond riche. */
export function shareStoryVignette(glowColor?: string): string {
  const accentGlow = glowColor
    ? `radial-gradient(ellipse 80% 55% at 50% 42%, color-mix(in srgb, ${glowColor} 28%, transparent), transparent 70%)`
    : ''
  const base = [
    'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 28%, rgba(0,0,0,0.35) 62%, rgba(0,0,0,0.88) 100%)',
    'radial-gradient(ellipse 120% 80% at 50% 100%, rgba(0,0,0,0.75), transparent 55%)',
    accentGlow,
  ]
    .filter(Boolean)
    .join(', ')
  return base
}

/** Fond mesh pour cartes sans image exo (story). */
export function shareStoryMeshBackground(accent: string, isDark: boolean): string {
  const base = isDark ? 'oklch(0.12 0 0)' : 'oklch(0.18 0 0)'
  return [
    `linear-gradient(160deg, ${base} 0%, color-mix(in srgb, ${accent} 12%, ${base}) 45%, ${base} 100%)`,
    `radial-gradient(ellipse 90% 70% at 20% 10%, color-mix(in srgb, ${accent} 35%, transparent), transparent 60%)`,
    `radial-gradient(ellipse 70% 50% at 85% 75%, color-mix(in srgb, ${accent} 20%, transparent), transparent 55%)`,
  ].join(', ')
}

export function shareCardThemeVars(isDark: boolean): CSSProperties {
  return isDark
    ? ({
        '--background': 'oklch(0.1 0 0)',
        '--foreground': 'oklch(0.985 0 0)',
        '--card': 'oklch(0.22 0 0)',
        '--card-foreground': 'oklch(0.985 0 0)',
        '--primary': '#1a1a1a',
        '--primary-foreground': '#ffffff',
        '--muted': 'oklch(0.225 0 0)',
        '--muted-foreground': 'oklch(0.708 0 0)',
        '--accent': '#dfff5e',
        '--accent-foreground': '#000000',
        '--border': 'oklch(1 0 0 / 10%)',
      } as CSSProperties)
    : ({
        '--background': 'oklch(0.95 0 0)',
        '--foreground': 'oklch(0.200 0 0)',
        '--card': 'oklch(1 0 0)',
        '--card-foreground': 'oklch(0.145 0 0)',
        '--primary': '#1a1a1a',
        '--primary-foreground': '#ffffff',
        '--muted': 'oklch(0.97 0 0)',
        '--muted-foreground': 'oklch(0.556 0 0)',
        '--accent': '#dfff5e',
        '--accent-foreground': '#000000',
        '--border': 'oklch(0.922 0 0)',
      } as CSSProperties)
}
