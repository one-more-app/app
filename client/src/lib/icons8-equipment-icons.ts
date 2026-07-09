/**
 * Icônes fitness / gym (Icons8) — pack Envato Elements « Fitness and muscles ».
 * @see https://elements.envato.com/fitness-and-muscles-EANXC44
 */
import barbellIcon from '@/assets/icons/equipment/barbell.png'
import battleRopesIcon from '@/assets/icons/equipment/battle-ropes.png'
import beachBallIcon from '@/assets/icons/equipment/beach-ball.png'
import benchPressIcon from '@/assets/icons/equipment/bench-press.png'
import bikeTrainerIcon from '@/assets/icons/equipment/bike-trainer.png'
import crossfitIcon from '@/assets/icons/equipment/crossfit.png'
import curlsWithDumbbellsIcon from '@/assets/icons/equipment/curls-with-dumbbells.png'
import deadliftIcon from '@/assets/icons/equipment/deadlift.png'
import dumbbellIcon from '@/assets/icons/equipment/dumbbell.png'
import exerciseIcon from '@/assets/icons/equipment/exercise.png'
import ezCurlBarIcon from '@/assets/icons/equipment/ez-curl-bar.png'
import functionalTrainingIcon from '@/assets/icons/equipment/functional-training.png'
import gymBenchIcon from '@/assets/icons/equipment/gym-bench.png'
import gymWeightsIcon from '@/assets/icons/equipment/gym-weights.png'
import hammerIcon from '@/assets/icons/equipment/hammer.png'
import pullUpBarIcon from '@/assets/icons/equipment/pull-up-bar.png'
import pulleyIcon from '@/assets/icons/equipment/pulley.png'
import ropeIcon from '@/assets/icons/equipment/rope.png'
import resistanceBandsIcon from '@/assets/icons/equipment/resistance-bands.png'
import rowingIcon from '@/assets/icons/equipment/rowing-2.png'
import sleepingMatIcon from '@/assets/icons/equipment/sleeping-mat.png'
import sledIcon from '@/assets/icons/equipment/sled.png'
import squatsIcon from '@/assets/icons/equipment/squats.png'
import stepperIcon from '@/assets/icons/equipment/stepper.png'
import stretchingIcon from '@/assets/icons/equipment/stretching.png'
import tireIcon from '@/assets/icons/equipment/tire.png'
import treadmillIcon from '@/assets/icons/equipment/treadmill.png'
import weightIcon from '@/assets/icons/equipment/weight.png'

export type Icons8EquipmentIconId =
    | 'barbell'
    | 'battle-ropes'
    | 'beach-ball'
    | 'bench-press'
    | 'bike-trainer'
    | 'crossfit'
    | 'curls-with-dumbbells'
    | 'deadlift'
    | 'dumbbell'
    | 'exercise'
    | 'ez-curl-bar'
    | 'functional-training'
    | 'gym-bench'
    | 'gym-weights'
    | 'hammer'
    | 'pull-up-bar'
    | 'pulley'
    | 'resistance-bands'
    | 'rope'
    | 'rowing-2'
    | 'sleeping-mat'
    | 'sled'
    | 'squats'
    | 'stepper'
    | 'stretching'
    | 'tire'
    | 'treadmill'
    | 'weight'

export const ICONS8_EQUIPMENT_ASSETS: Record<Icons8EquipmentIconId, string> = {
    barbell: barbellIcon,
    'battle-ropes': battleRopesIcon,
    'beach-ball': beachBallIcon,
    'bench-press': benchPressIcon,
    'bike-trainer': bikeTrainerIcon,
    crossfit: crossfitIcon,
    'curls-with-dumbbells': curlsWithDumbbellsIcon,
    deadlift: deadliftIcon,
    dumbbell: dumbbellIcon,
    exercise: exerciseIcon,
    'ez-curl-bar': ezCurlBarIcon,
    'functional-training': functionalTrainingIcon,
    'gym-bench': gymBenchIcon,
    'gym-weights': gymWeightsIcon,
    hammer: hammerIcon,
    'pull-up-bar': pullUpBarIcon,
    pulley: pulleyIcon,
    'resistance-bands': resistanceBandsIcon,
    rope: ropeIcon,
    'rowing-2': rowingIcon,
    'sleeping-mat': sleepingMatIcon,
    sled: sledIcon,
    squats: squatsIcon,
    stepper: stepperIcon,
    stretching: stretchingIcon,
    tire: tireIcon,
    treadmill: treadmillIcon,
    weight: weightIcon,
}

const EQUIPMENT_ICONS: Record<string, Icons8EquipmentIconId> = {
    barres: 'barbell',
    barbell: 'barbell',
    'olympic barbell': 'barbell',
    'ez barbell': 'ez-curl-bar',
    'trap bar': 'deadlift',

    machines_lever_smith: 'bench-press',
    'smith machine': 'bench-press',
    'leverage machine': 'bench-press',
    machine: 'bench-press',

    dumbbell: 'dumbbell',
    kettlebell: 'gym-weights',

    'body weight': 'squats',
    weighted: 'weight',

    cable: 'pulley',
    band: 'resistance-bands',
    'resistance band': 'resistance-bands',

    'medicine ball': 'beach-ball',
    'stability ball': 'beach-ball',
    'exercise ball': 'beach-ball',
    'bosu ball': 'beach-ball',

    rope: 'rope',
    roller: 'stretching',
    'wheel roller': 'exercise',
    'wrist roller': 'curls-with-dumbbells',

    'sled machine': 'sled',
    'elliptical machine': 'treadmill',
    'stationary bike': 'bike-trainer',
    'stepmill machine': 'stepper',
    'skierg machine': 'rowing-2',
    'upper body ergometer': 'rowing-2',

    hammer: 'hammer',
    assisted: 'pull-up-bar',
    tire: 'tire',
    'pull-up bar': 'pull-up-bar',
    'yoga mat': 'sleeping-mat',
}

export function icons8IconForEquipment(equipment: string): Icons8EquipmentIconId {
    return EQUIPMENT_ICONS[equipment.toLowerCase()] ?? 'exercise'
}

export function icons8AssetForEquipment(equipment: string): string {
    return ICONS8_EQUIPMENT_ASSETS[icons8IconForEquipment(equipment)]
}
