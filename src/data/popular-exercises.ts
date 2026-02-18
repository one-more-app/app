/**
 * 50 exercices de musculation les plus populaires.
 * Généré par: node scripts/fetch-popular-exercises.js
 * Exercices stockés en JSON pour éviter les appels API.
 */

import type { ExerciseDBExercise } from '@/types'
import data from './popular-exercises.json'

export const popularExercises: ExerciseDBExercise[] = data as ExerciseDBExercise[]
