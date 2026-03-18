/**
 * Son de record / palier : fichier MP3 (haltères / fonte) avec repli sur son synthétique.
 */

const MILESTONE_MP3 = "/sounds/gym-weights-moved-joshua-chivers-1-1-00-01.mp3"

let cachedAudio: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement {
  if (cachedAudio) return cachedAudio
  cachedAudio = new Audio(MILESTONE_MP3)
  return cachedAudio
}

/**
 * Joue le son de milestone (MP3). Si le fichier est absent ou échoue, aucun son.
 */
export function playMilestoneSound(): void {
  try {
    const audio = getAudio()
    audio.currentTime = 0
    audio.volume = 1
    audio.play().catch(() => {
      // Fichier absent, politique autoplay, etc. — on ignore
    })
  } catch {
    // Ignore
  }
}
