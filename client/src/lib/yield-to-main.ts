/** Laisse le main thread traiter les taps (Continuer) entre étapes lourdes. */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0)
  })
}
