/**
 * Sons de célébration — synthèse Web Audio, une variante par type d’événement.
 */

export type CelebrationSoundKind = "record" | "league" | "levelup" | "streak"

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctx) return null
  if (!audioContext) audioContext = new Ctx()
  return audioContext
}

type SoundBus = {
  ctx: AudioContext
  master: GainNode
  t: number
}

function scheduleTone(
  bus: SoundBus,
  start: number,
  opts: {
    type: OscillatorType
    freqStart: number
    freqEnd: number
    duration: number
    peakGain: number
  },
): void {
  const { ctx, master } = bus
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = opts.type
  osc.frequency.setValueAtTime(opts.freqStart, start)
  if (opts.freqEnd !== opts.freqStart) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(opts.freqEnd, 1),
      start + opts.duration,
    )
  }
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(
    Math.max(opts.peakGain, 0.0001),
    start + 0.012,
  )
  gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration)
  osc.connect(gain)
  gain.connect(master)
  osc.start(start)
  osc.stop(start + opts.duration + 0.02)
}

function scheduleNoiseHit(
  bus: SoundBus,
  start: number,
  opts?: { freq?: number; peak?: number; duration?: number },
): void {
  const { ctx, master } = bus
  const duration = opts?.duration ?? 0.06
  const bufferSize = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize
    data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t)
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = "bandpass"
  filter.frequency.value = opts?.freq ?? 180
  filter.Q.value = 0.85
  const gain = ctx.createGain()
  const peak = opts?.peak ?? 0.35
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration + 0.01)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(master)
  source.start(start)
  source.stop(start + duration + 0.02)
}

function scheduleImpact(
  bus: SoundBus,
  start: number,
  opts: { freq: number; freqEnd: number; peak: number; duration: number },
): void {
  const { ctx, master } = bus
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "sine"
  osc.frequency.setValueAtTime(opts.freq, start)
  osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, start + opts.duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(opts.peak, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration)
  osc.connect(gain)
  gain.connect(master)
  osc.start(start)
  osc.stop(start + opts.duration + 0.02)
}

function scheduleRise(
  bus: SoundBus,
  start: number,
  opts: {
    freqStart: number
    freqEnd: number
    peak: number
    duration: number
    type?: OscillatorType
  },
): void {
  const { ctx, master } = bus
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = opts.type ?? "triangle"
  osc.frequency.setValueAtTime(opts.freqStart, start)
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(opts.freqEnd, 1),
    start + opts.duration,
  )
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(opts.peak, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration)
  osc.connect(gain)
  gain.connect(master)
  osc.start(start)
  osc.stop(start + opts.duration + 0.02)
}

/** Record personnel — punch classique, court. */
function playRecordVariant(bus: SoundBus): void {
  const { t } = bus
  scheduleImpact(bus, t, { freq: 78, freqEnd: 42, peak: 0.55, duration: 0.1 })
  scheduleNoiseHit(bus, t)
  scheduleRise(bus, t + 0.05, {
    freqStart: 220,
    freqEnd: 720,
    peak: 0.22,
    duration: 0.28,
  })
  scheduleTone(bus, t + 0.18, {
    type: "sine",
    freqStart: 880,
    freqEnd: 1175,
    duration: 0.28,
    peakGain: 0.28,
  })
  scheduleTone(bus, t + 0.26, {
    type: "sine",
    freqStart: 1568,
    freqEnd: 1318,
    duration: 0.1,
    peakGain: 0.1,
  })
}

/** Passage de palier — plus long, grave, « fanfare » compacte. */
function playLeagueVariant(bus: SoundBus): void {
  const { t } = bus
  scheduleImpact(bus, t, { freq: 62, freqEnd: 38, peak: 0.72, duration: 0.14 })
  scheduleNoiseHit(bus, t, { freq: 140, peak: 0.48, duration: 0.09 })
  scheduleRise(bus, t + 0.06, {
    freqStart: 165,
    freqEnd: 620,
    peak: 0.26,
    duration: 0.22,
    type: "sawtooth",
  })
  scheduleRise(bus, t + 0.12, {
    freqStart: 280,
    freqEnd: 980,
    peak: 0.3,
    duration: 0.38,
  })
  // Accords de victoire (tierce + quinte)
  scheduleTone(bus, t + 0.22, {
    type: "sine",
    freqStart: 523,
    freqEnd: 523,
    duration: 0.35,
    peakGain: 0.2,
  })
  scheduleTone(bus, t + 0.26, {
    type: "sine",
    freqStart: 659,
    freqEnd: 659,
    duration: 0.32,
    peakGain: 0.18,
  })
  scheduleTone(bus, t + 0.3, {
    type: "sine",
    freqStart: 784,
    freqEnd: 988,
    duration: 0.4,
    peakGain: 0.24,
  })
  scheduleImpact(bus, t + 0.38, { freq: 92, freqEnd: 55, peak: 0.35, duration: 0.08 })
  scheduleTone(bus, t + 0.42, {
    type: "sine",
    freqStart: 1175,
    freqEnd: 1568,
    duration: 0.22,
    peakGain: 0.16,
  })
}

/** Montée de niveau — léger, brillant (accent jaune / XP). */
function playLevelUpVariant(bus: SoundBus): void {
  const { t } = bus
  scheduleImpact(bus, t, { freq: 95, freqEnd: 70, peak: 0.38, duration: 0.08 })
  scheduleRise(bus, t + 0.04, {
    freqStart: 440,
    freqEnd: 1180,
    peak: 0.24,
    duration: 0.32,
    type: "triangle",
  })
  scheduleTone(bus, t + 0.14, {
    type: "sine",
    freqStart: 988,
    freqEnd: 1318,
    duration: 0.25,
    peakGain: 0.26,
  })
  scheduleTone(bus, t + 0.22, {
    type: "sine",
    freqStart: 1568,
    freqEnd: 1760,
    duration: 0.18,
    peakGain: 0.18,
  })
  scheduleTone(bus, t + 0.3, {
    type: "triangle",
    freqStart: 2093,
    freqEnd: 2637,
    duration: 0.12,
    peakGain: 0.1,
  })
}

/** Série — double pulse chaleureux (flamme / régularité). */
function playStreakVariant(bus: SoundBus): void {
  const { t } = bus
  scheduleImpact(bus, t, { freq: 88, freqEnd: 65, peak: 0.42, duration: 0.07 })
  scheduleTone(bus, t + 0.04, {
    type: "sine",
    freqStart: 330,
    freqEnd: 440,
    duration: 0.14,
    peakGain: 0.2,
  })
  scheduleImpact(bus, t + 0.11, { freq: 72, freqEnd: 52, peak: 0.38, duration: 0.07 })
  scheduleRise(bus, t + 0.1, {
    freqStart: 392,
    freqEnd: 784,
    peak: 0.18,
    duration: 0.2,
  })
  scheduleTone(bus, t + 0.2, {
    type: "sine",
    freqStart: 880,
    freqEnd: 1046,
    duration: 0.2,
    peakGain: 0.22,
  })
}

/** Multiplicateur global appliqué aux modales de célébration. */
const MASTER_VOLUME = 1.5

const MASTER_BY_KIND: Record<CelebrationSoundKind, number> = {
  record: 0.42,
  league: 0.48,
  levelup: 0.4,
  streak: 0.38,
}

const VARIANT_BY_KIND: Record<CelebrationSoundKind, (bus: SoundBus) => void> = {
  record: playRecordVariant,
  league: playLeagueVariant,
  levelup: playLevelUpVariant,
  streak: playStreakVariant,
}

async function playSyntheticCelebrationSound(
  kind: CelebrationSoundKind,
): Promise<void> {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === "suspended") {
    try {
      await ctx.resume()
    } catch {
      return
    }
  }

  const master = ctx.createGain()
  master.gain.value = MASTER_BY_KIND[kind] * MASTER_VOLUME
  master.connect(ctx.destination)

  const bus: SoundBus = { ctx, master, t: ctx.currentTime }
  VARIANT_BY_KIND[kind](bus)
}

/**
 * Son joué à chaque célébration — variante selon le type.
 */
export function playMilestoneSound(kind: CelebrationSoundKind = "record"): void {
  void playSyntheticCelebrationSound(kind)
}
