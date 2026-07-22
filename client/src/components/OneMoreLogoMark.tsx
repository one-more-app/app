import logoBlack from "@/assets/logo-black.png";
import logoWhite from "@/assets/logo-white.png";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { useEffect, useId, useState } from "react";

/**
 * =============================================================================
 * COMMENT MODIFIER L'AXE (BUILD_CENTERLINE)
 * =============================================================================
 *
 * Principe
 * ---------
 * Le logo PNG est toujours là en entier, mais un MASQUE le révèle progressivement.
 * Le masque = un gros trait blanc qui suit BUILD_CENTERLINE (comme un pinceau).
 * Là où le pinceau est passé → on voit le logo. Ailleurs → invisible.
 *
 * Coordonnées (viewBox 974 × 902)
 * --------------------------------
 * - Origine (0, 0) = coin HAUT-GAUCHE du logo
 * - X augmente vers la DROITE  (0 → 974)
 * - Y augmente vers le BAS     (0 → 902)
 *
 * Repères utiles sur ce logo :
 * - Sommet du « 1 »     ≈ (525, 0)
 * - Gauche du « 1 »     ≈ (20, 360)
 * - Base du « 1 »       ≈ (250, 860)
 * - Pointe (tip)        ≈ (969, 251)
 *
 * Syntaxe du path SVG
 * -------------------
 *   M x y     = MoveTo : point de départ (sans tracer)
 *   L x y     = LineTo : ligne droite jusqu'à ce point
 *
 * Exemple :
 *   "M 525 0 L 400 200 L 969 251"
 *   → part du sommet, passe par (400,200), finit à la pointe.
 *
 * Ordre = sens de la révélation
 * -----------------------------
 * Le trait se dessine DU PREMIER point VERS LE DERNIER.
 * Pour « corps puis pointe » : mets d'abord les points du corps, la pointe à la fin.
 *
 * BUILD_STROKE_WIDTH
 * ------------------
 * Épaisseur du pinceau. Le corps fait ~545px au milieu :
 * - trop petit (ex. 280) → trous sur les côtés
 * - ~560 → couvre tout le corps
 * - la pointe est fine : un gros stroke la déborde, mais le PNG clippe le surplus
 *
 * Piège classique (trou au milieu)
 * --------------------------------
 * Évite un grand saut en diagonale qui traverse le vide / le milieu du logo.
 * Reste proche du centre du corps, puis enchaîne sur la pointe à la jonction.
 *
 * Debug
 * -----
 * Passe DEBUG_AXIS à true : l'axe s'affiche en rouge + le pinceau en transparent.
 * Tu vois exactement ce que tu édites. Remets false avant de ship.
 * =============================================================================
 */

/** Durée CSS de `.splash-logo-draw` (index.css). */
export const SPLASH_LOGO_DRAW_MS = 500;

/** Délai mini avant de quitter le splash (légèrement après la fin du tracé). */
export const SPLASH_MIN_DURATION_MS = SPLASH_LOGO_DRAW_MS + 80;

/** Mets `true` pour voir l'axe (rouge) et la zone du pinceau pendant que tu ajustes. */
const DEBUG_AXIS = false;

/**
 * Suite de points (x y) : départ → … → arrivée.
 * C'est ÇA que tu édites pour changer le parcours de révélation.
 */
const BUILD_CENTERLINE =
    "M 20 360 L 540 20 L 290 800  L 969 251";

/** Épaisseur du pinceau de révélation (voir doc en tête de fichier). */
const BUILD_STROKE_WIDTH = 380;

function prefersReducedMotion(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type OneMoreLogoMarkProps = {
    className?: string;
    /** Anime le tracé du 1 jusqu'à la pointe. */
    animate?: boolean;
    /**
     * `auto` : suit le thème.
     * `light` : mark blanc (fonds sombres, ex. leaderboard event).
     * `dark` : mark noir (fonds clairs).
     */
    variant?: "auto" | "light" | "dark";
};

export function OneMoreLogoMark({
    className,
    animate = true,
    variant = "auto",
}: OneMoreLogoMarkProps) {
    const rawId = useId();
    const maskId = `om-logo-mask-${rawId.replace(/:/g, "")}`;
    const { resolvedTheme } = useTheme();
    const logoSrc =
        variant === "light"
            ? logoWhite
            : variant === "dark"
                ? logoBlack
                : resolvedTheme === "dark"
                    ? logoWhite
                    : logoBlack;

    const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion);
    // En debug, on ne "termine" jamais : le masque reste pour rejouer / ajuster l'axe.
    const [built, setBuilt] = useState(
        () => !DEBUG_AXIS && (!animate || prefersReducedMotion()),
    );
    const shouldAnimate = animate && !reduceMotion && !built;
    const settle = animate && !reduceMotion && !DEBUG_AXIS;

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = () => {
            const reduced = media.matches;
            setReduceMotion(reduced);
            if (reduced && !DEBUG_AXIS) setBuilt(true);
        };
        onChange();
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
        if (!shouldAnimate || DEBUG_AXIS) return;
        const timer = window.setTimeout(() => setBuilt(true), SPLASH_MIN_DURATION_MS);
        return () => window.clearTimeout(timer);
    }, [shouldAnimate]);

    return (
        <svg
            viewBox="0 0 974 902"
            className={cn("h-16 w-auto sm:h-20", settle && "splash-logo-settle", className)}
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="One More"
        >
            {shouldAnimate ? (
                <defs>
                    <mask
                        id={maskId}
                        maskUnits="userSpaceOnUse"
                        x="0"
                        y="0"
                        width="974"
                        height="902"
                    >
                        <rect width="974" height="902" fill="#000" />
                        <path
                            d={BUILD_CENTERLINE}
                            fill="none"
                            stroke="#fff"
                            strokeWidth={BUILD_STROKE_WIDTH}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength={1}
                            strokeDasharray={1}
                            strokeDashoffset={1}
                            className="splash-logo-draw"
                            onAnimationEnd={() => {
                                if (!DEBUG_AXIS) setBuilt(true);
                            }}
                        />
                    </mask>
                </defs>
            ) : null}

            <image
                href={logoSrc}
                width="974"
                height="902"
                preserveAspectRatio="xMidYMid meet"
                mask={shouldAnimate ? `url(#${maskId})` : undefined}
            />

            {DEBUG_AXIS ? (
                <g>
                    {/* Zone couverte par le pinceau */}
                    <path
                        d={BUILD_CENTERLINE}
                        fill="none"
                        stroke="tomato"
                        strokeOpacity={0.25}
                        strokeWidth={BUILD_STROKE_WIDTH}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {/* Axe exact (la ligne que tu édites) */}
                    <path
                        d={BUILD_CENTERLINE}
                        fill="none"
                        stroke="red"
                        strokeWidth={6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </g>
            ) : null}
        </svg>
    );
}
