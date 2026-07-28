/**
 * Abréviations / synonymes → fragments de noms EN du catalogue.
 * Attachés aux exercices dont le nom contient l'un des fragments.
 */
export const EXERCISE_SEARCH_ALIASES: Record<string, string[]> = {
  // Pectoraux
  dc: ["bench press"],
  dcl: ["bench press"],
  "developpe couche": ["bench press"],
  bench: ["bench press"],
  bp: ["bench press"],
  "incline bp": ["incline bench press", "incline press"],
  pec: ["chest", "pec", "fly", "crossover"],
  // Dos / tractions
  sdt: ["deadlift"],
  dl: ["deadlift"],
  rdl: ["romanian deadlift"],
  "souleve de terre": ["deadlift"],
  "souleve de terre roumain": ["romanian deadlift"],
  traction: ["pull-up", "pull up", "chin-up", "chin up"],
  tractions: ["pull-up", "pull up", "chin-up", "chin up"],
  "pull ups": ["pull-up"],
  "chin ups": ["chin-up"],
  tirage: ["pulldown", "seated row", "row"],
  // Jambes
  sq: ["squat"],
  fente: ["lunge"],
  fentes: ["lunge"],
  ischio: ["leg curl", "romanian deadlift", "hamstring"],
  mollet: ["calf"],
  mollets: ["calf"],
  presse: ["leg press"],
  // Épaules
  oiseau: ["rear delt", "reverse fly"],
  "elevation laterale": ["lateral raise"],
  "elevation frontale": ["front raise"],
  militaire: ["military press", "overhead press"],
  // Bras
  marteau: ["hammer curl"],
  curl: ["curl"],
  dips: ["dip"],
  "skull crusher": ["skull crusher", "lying tricep"],
  // Divers
  pompe: ["push-up", "push up"],
  pompes: ["push-up", "push up"],
  "push ups": ["push-up"],
  gainage: ["plank"],
  "hip thrust": ["hip thrust"],
  "pont fessier": ["glute bridge"],
};
