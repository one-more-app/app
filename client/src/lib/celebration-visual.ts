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
export function shareCardThemeVars(isDark: boolean): CSSProperties {
  return isDark
    ? ({
        '--background': 'oklch(0.1 0 0)',
        '--foreground': 'oklch(0.985 0 0)',
        '--card': 'oklch(0.22 0 0)',
        '--card-foreground': 'oklch(0.985 0 0)',
        '--primary': 'oklch(0.922 0 0)',
        '--border': 'oklch(1 0 0 / 10%)',
        '--muted-foreground': 'oklch(0.708 0 0)',
      } as CSSProperties)
    : ({
        '--background': 'oklch(0.95 0 0)',
        '--foreground': 'oklch(0.200 0 0)',
        '--card': 'oklch(1 0 0)',
        '--card-foreground': 'oklch(0.145 0 0)',
        '--primary': 'oklch(0.205 0 0)',
        '--border': 'oklch(0.922 0 0)',
        '--muted-foreground': 'oklch(0.556 0 0)',
      } as CSSProperties)
}
