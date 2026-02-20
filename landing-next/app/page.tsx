"use client";

import type { ExerciseCardExercise, ExerciseCardPerf } from "@/components/landing/ExerciseCard";
import { ExerciseCard } from "@/components/landing/ExerciseCard";
import { LeagueBadge } from "@/components/landing/LeagueBadge";
import { PerformanceChart } from "@/components/landing/PerformanceChart";
import { SubscribeForm } from "@/components/landing/SubscribeForm";
import { Button } from "@/components/ui/button";
import type { LeagueLevel } from "@/lib/landing-data";
import {
    LEAGUE_COLORS,
    MOCK_CHART_ENTRIES,
    MOCK_LEAGUE_DETAIL,
    MOCK_LEAGUE_GOLD
} from "@/lib/landing-data";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const fadeIn = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.4 },
};

const LEAGUE_LEVELS: LeagueLevel[] = [
    "iron",
    "bronze",
    "silver",
    "gold",
    "platinum",
    "emerald",
    "diamond",
    "master",
    "elite",
    "legend",
];

const LABELS: Record<LeagueLevel, string> = {
    iron: "Fer",
    bronze: "Bronze",
    silver: "Argent",
    gold: "Or",
    platinum: "Platine",
    emerald: "Émeraude",
    diamond: "Diamant",
    master: "Maître",
    elite: "Elite",
    legend: "Légende",
};

/** Un seul exercice de démo : Barbell Bench Press (données popular-exercises.json) */
const DEMO_EXERCISE: {
    exercise: ExerciseCardExercise;
    lastPerf: ExerciseCardPerf;
    personalBest: ExerciseCardPerf;
    leagueInfo: typeof MOCK_LEAGUE_GOLD;
} = {
    exercise: {
        id: "EIeI8Vf",
        name: "Développé couché barre",
        target: "pectorals",
        bodyPart: "chest",
        gifUrl: "https://static.exercisedb.dev/media/EIeI8Vf.gif",
    },
    lastPerf: { weight: 80, reps: 6 },
    personalBest: { weight: 92, reps: 3 },
    leagueInfo: MOCK_LEAGUE_GOLD,
};

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt=""
                            width={120}
                            height={32}
                            className="h-8 w-auto"
                            priority
                        />
                        <span className="text-xl font-bold tracking-tight">One More</span>
                    </Link>
                    <Button variant="accent" size="sm" asChild>
                        <Link href="#inscription">Pré-inscription</Link>
                    </Button>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero */}
                <section className="relative overflow-hidden px-4 pt-16 pb-24 sm:pt-24 sm:pb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mx-auto max-w-2xl text-center"
                    >
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                            Ta progression, enfin simple.
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
                            Suivi de musculation sans prise de tête : enregistre tes séries,
                            suis tes records et regarde ta courbe monter. Une app pensée pour
                            ceux qui veulent juste s&apos;entraîner et progresser.
                        </p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="mt-8"
                        >
                            <Button variant="accent" size="lg" asChild>
                                <Link href="#inscription">Réserver ma place au lancement</Link>
                            </Button>
                        </motion.div>
                    </motion.div>
                </section>

                {/* Problème */}
                <motion.section
                    {...fadeIn}
                    className="border-t border-border bg-card/50 px-4 py-16 sm:py-20"
                >
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-semibold sm:text-3xl">
                            Tu t&apos;entraînes. Mais tu oublies où tu en étais.
                        </h2>
                        <p className="mt-4 text-muted-foreground leading-relaxed">
                            Combien tu as mis la dernière fois au développé ? À la dernière
                            séance de squat ? Les carnets se perdent, les notes s&apos;effacent.
                            One More garde tout : tes exercices, tes séries, tes records. Tu
                            ouvres l&apos;app, tu vois où tu en es — et tu fais une rep de plus.
                        </p>
                    </div>
                </motion.section>

                {/* Visuels app — cartes exercices (composant exact) */}
                <section className="px-4 py-16 sm:py-24">
                    <motion.div {...fadeIn} className="mx-auto max-w-2xl text-center mb-12">
                        <h2 className="text-2xl font-semibold sm:text-3xl">
                            Tout ce dont tu as besoin pour progresser.
                        </h2>
                        <p className="mt-3 text-muted-foreground">
                            Dernière perf et record dès l&apos;accueil. Ligue par exercice.
                            Historique en graphiques. Mobile (iOS & Android).
                        </p>
                    </motion.div>
                    <div className="mx-auto max-w-lg">
                        <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-30px" }}
                            transition={{ duration: 0.35 }}
                        >
                            <ExerciseCard
                                exercise={DEMO_EXERCISE.exercise}
                                lastPerf={DEMO_EXERCISE.lastPerf}
                                personalBest={DEMO_EXERCISE.personalBest}
                                leagueInfo={DEMO_EXERCISE.leagueInfo}
                                onAddPerf={() => { }}
                            />
                        </motion.div>
                    </div>

                    {/* Graphique de progression (composant exact) */}
                    <motion.div
                        {...fadeIn}
                        className="mx-auto mt-8 max-w-lg rounded-xl border border-border bg-card p-4"
                    >
                        <p className="mb-2 text-sm font-medium text-muted-foreground">
                            Historique de progression
                        </p>
                        <PerformanceChart entries={MOCK_CHART_ENTRIES} />
                    </motion.div>

                    <motion.p
                        {...fadeIn}
                        className="mx-auto mt-8 max-w-xl text-center text-sm text-muted-foreground"
                    >
                        Une app légère, rapide, mobile (iOS & Android). Données en
                        local, thème sombre.
                    </motion.p>
                </section>

                {/* Ligues — badges compacts + bloc détaillé (composant exact) */}
                <motion.section
                    {...fadeIn}
                    className="border-t border-border bg-card/50 px-4 py-16 sm:py-20"
                >
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-semibold sm:text-3xl">
                            Garde ta motivation avec le système de ligues.
                        </h2>
                        <p className="mt-4 text-muted-foreground leading-relaxed">
                            Chaque exercice est classé selon ton ratio force / poids du corps.
                            Tu progresses de palier en palier : tu vois ta ligue actuelle, le
                            palier suivant et combien il te reste à soulever pour l&apos;atteindre.
                        </p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="mt-8 flex flex-wrap justify-center gap-2"
                        >
                            {LEAGUE_LEVELS.map((level) => (
                                <span
                                    key={level}
                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${LEAGUE_COLORS[level] ?? "bg-muted"}`}
                                >
                                    {LABELS[level]}
                                </span>
                            ))}
                        </motion.div>

                        {/* Bloc ligue détaillé (LeagueBadge avec showNextTarget) */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.35 }}
                            className="max-w-xs mx-auto mt-10 rounded-xl border border-border bg-background p-4 bg-card"
                        >
                            <div>
                                <LeagueBadge
                                    league={MOCK_LEAGUE_DETAIL}
                                    showNextTarget
                                    weightSuffix=" kg"
                                />
                            </div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Pour qui */}
                <motion.section {...fadeIn} className="px-4 py-16 sm:py-20">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-semibold sm:text-3xl">
                            Pour ceux qui veulent « une rep de plus ».
                        </h2>
                        <p className="mt-4 text-muted-foreground leading-relaxed">
                            Que tu sois en full body, en split ou en force pure, One More
                            s&apos;adapte à ta routine. Moins de friction, plus de séries.
                            Inscris-toi pour être prévenu au lancement.
                        </p>
                    </div>
                </motion.section>

                {/* CTA + Formulaire */}
                <section
                    id="inscription"
                    className="border-t border-border bg-card/50 px-4 py-20 sm:py-28 scroll-mt-20"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="mx-auto max-w-xl text-center"
                    >
                        <h2 className="text-2xl font-semibold sm:text-3xl">
                            Lancement prochain. Réserve ta place.
                        </h2>
                        <p className="mt-3 text-muted-foreground">
                            Inscris-toi pour recevoir une notification dès que One More sera
                            disponible. Pas de spam, une seule info : « c&apos;est en ligne ».
                        </p>
                        <div className="mt-8">
                            <SubscribeForm />
                        </div>
                        <p className="mt-4 text-xs text-muted-foreground">
                            On n&apos;utilise ton email que pour te prévenir du lancement.
                        </p>
                    </motion.div>
                </section>
            </main>

            <footer className="border-t border-border px-4 py-8">
                <div className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
                    <p>One More — Suivi de progression en musculation.</p>
                    <p className="mt-1">iOS & Android.</p>
                </div>
            </footer>
        </div>
    );
}
