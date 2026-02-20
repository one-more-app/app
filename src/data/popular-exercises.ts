/**
 * Exercices de musculation (données locales).
 * Généré par: node scripts/fetch-popular-exercises.js
 * Évite les appels API en utilisant le JSON local.
 */

import type { ExerciseDBExercise } from "@/types";
import data from "./popular-exercises.json";

export const popularExercises: ExerciseDBExercise[] =
  data as ExerciseDBExercise[];

/** Récupère un exercice par id depuis les données locales */
export function getExerciseById(id: string): ExerciseDBExercise | null {
  return popularExercises.find((ex) => ex.id === id) ?? null;
}

/** Liste des muscles cibles présents dans les données locales (pour les filtres) */
export const localTargets: string[] = (() => {
  const set = new Set<string>();
  for (const ex of popularExercises) {
    if (ex.target && ex.bodyPart !== "cardio") set.add(ex.target);
  }
  return Array.from(set)
    .filter((t) => t !== "cardio")
    .sort((a, b) => a.localeCompare(b));
})();

/** Liste des équipements présents dans les données locales (pour les filtres) */
export const localEquipmentList: string[] = (() => {
  const set = new Set<string>();
  for (const ex of popularExercises) {
    if (ex.equipment) set.add(ex.equipment);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
})();
