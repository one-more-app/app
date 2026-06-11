/**
 * Icônes « Set of Muscles » (Icons8) — pack Envato Elements « Muscles » / « Fitness and muscles ».
 * @see https://elements.envato.com/muscles-XJGCWH5
 */
import backMusclesIcon from '@/assets/icons/muscles/back-muscles.png'
import bicepsIcon from '@/assets/icons/muscles/biceps.png'
import calvesIcon from '@/assets/icons/muscles/calves.png'
import chestIcon from '@/assets/icons/muscles/chest.png'
import flexBicepsIcon from '@/assets/icons/muscles/flex-biceps.png'
import forearmIcon from '@/assets/icons/muscles/forearm.png'
import hamstringsIcon from '@/assets/icons/muscles/hamstrings.png'
import legIcon from '@/assets/icons/muscles/leg.png'
import muscleIcon from '@/assets/icons/muscles/muscle.png'
import neckIcon from '@/assets/icons/muscles/neck2.png'
import prelumIcon from '@/assets/icons/muscles/prelum.png'
import quadricepsIcon from '@/assets/icons/muscles/quadriceps.png'
import shouldersIcon from '@/assets/icons/muscles/shoulders.png'
import torsoIcon from '@/assets/icons/muscles/torso.png'
import tricepsIcon from '@/assets/icons/muscles/triceps.png'
import { inferBodyPartFromTarget } from '@/lib/infer-body-part-from-target'

export type Icons8MuscleIconId =
    | 'back-muscles'
    | 'biceps'
    | 'calves'
    | 'chest'
    | 'flex-biceps'
    | 'forearm'
    | 'hamstrings'
    | 'leg'
    | 'muscle'
    | 'neck'
    | 'prelum'
    | 'quadriceps'
    | 'shoulders'
    | 'torso'
    | 'triceps'

export const ICONS8_MUSCLE_ASSETS: Record<Icons8MuscleIconId, string> = {
    'back-muscles': backMusclesIcon,
    biceps: bicepsIcon,
    calves: calvesIcon,
    chest: chestIcon,
    'flex-biceps': flexBicepsIcon,
    forearm: forearmIcon,
    hamstrings: hamstringsIcon,
    leg: legIcon,
    muscle: muscleIcon,
    neck: neckIcon,
    prelum: prelumIcon,
    quadriceps: quadricepsIcon,
    shoulders: shouldersIcon,
    torso: torsoIcon,
    triceps: tricepsIcon,
}

const BODY_PART_ICONS: Record<string, Icons8MuscleIconId> = {
    chest: 'chest',
    back: 'back-muscles',
    shoulders: 'shoulders',
    'upper arms': 'flex-biceps',
    'lower arms': 'forearm',
    waist: 'prelum',
    'upper legs': 'quadriceps',
    'lower legs': 'calves',
    neck: 'neck',
    cardio: 'muscle',
}

const TARGET_ICONS: Record<string, Icons8MuscleIconId> = {
    chest: 'chest',
    pectorals: 'chest',
    'upper chest': 'chest',
    'serratus anterior': 'chest',

    'upper back': 'back-muscles',
    'lower back': 'back-muscles',
    lats: 'back-muscles',
    'latissimus dorsi': 'back-muscles',
    traps: 'back-muscles',
    trapezius: 'back-muscles',
    rhomboids: 'back-muscles',
    'levator scapulae': 'back-muscles',

    shoulders: 'shoulders',
    delts: 'shoulders',
    deltoids: 'shoulders',
    'rear deltoids': 'shoulders',
    'rotator cuff': 'shoulders',

    biceps: 'biceps',
    brachialis: 'biceps',
    triceps: 'triceps',

    forearms: 'forearm',
    'wrist flexors': 'forearm',
    'wrist extensors': 'forearm',
    'grip muscles': 'forearm',
    wrists: 'forearm',
    hands: 'forearm',

    abs: 'prelum',
    abdominals: 'prelum',
    core: 'prelum',
    obliques: 'prelum',
    'lower abs': 'prelum',

    glutes: 'leg',
    hamstrings: 'hamstrings',
    quadriceps: 'quadriceps',
    quads: 'quadriceps',
    'hip flexors': 'leg',
    groin: 'leg',
    'inner thighs': 'leg',
    adductors: 'leg',
    abductors: 'leg',

    calves: 'calves',
    soleus: 'calves',
    shins: 'calves',
    ankles: 'calves',
    'ankle stabilizers': 'calves',
    feet: 'calves',

    neck: 'neck',
    sternocleidomastoid: 'neck',

    spine: 'back-muscles',
    'erector spinae': 'back-muscles',
    back: 'back-muscles',

    cardio: 'muscle',
    'cardiovascular system': 'muscle',
    'full body': 'torso',
}

export function icons8IconForBodyPart(bodyPart: string): Icons8MuscleIconId {
    return BODY_PART_ICONS[bodyPart.toLowerCase()] ?? 'muscle'
}

export function icons8IconForTarget(target: string): Icons8MuscleIconId {
    const key = target.toLowerCase()
    return (
        TARGET_ICONS[key] ??
        icons8IconForBodyPart(inferBodyPartFromTarget(key) ?? '')
    )
}

export function icons8AssetForBodyPart(bodyPart: string): string {
    return ICONS8_MUSCLE_ASSETS[icons8IconForBodyPart(bodyPart)]
}

export function icons8AssetForTarget(target: string): string {
    return ICONS8_MUSCLE_ASSETS[icons8IconForTarget(target)]
}
