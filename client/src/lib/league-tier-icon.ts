import type { LeagueTier } from "@/lib/strength-standards";
import {
  Crown,
  Diamond,
  Gem,
  Medal,
  Shield,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/** Icône représentative de chaque palier (célébrations, badges, etc.). */
export function leagueTierIcon(tier: LeagueTier): LucideIcon {
  switch (tier) {
    case "bronze":
      return Shield;
    case "silver":
      return Medal;
    case "gold":
      return Trophy;
    case "platinum":
      return Gem;
    case "diamond":
      return Diamond;
    case "legend":
      return Crown;
  }
}
