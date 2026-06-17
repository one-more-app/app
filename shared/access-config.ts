/** Nombre max d'exercices actifs sans bonus de parrainage. */
export const EXERCISE_LIMIT_BASE = 10;

/** @deprecated Utiliser EXERCISE_LIMIT_BASE */
export const EXERCISE_LIMIT_LIMITED = EXERCISE_LIMIT_BASE;

/** Bonus d'exercices par filleul validé (parrain). */
export const EXERCISE_BONUS_PER_REFERRAL = 10;

/** Bonus d'exercices pour l'utilisateur qui utilise un code de parrainage. */
export const EXERCISE_BONUS_FOR_USING_REFERRAL = 5;

/** Nombre max de parrainages récompensés pour le parrain. */
export const MAX_REWARDED_REFERRALS = 10;

export function computeExerciseLimit(params: {
  referralCount: number;
  hasUsedReferralCode: boolean;
}): number {
  const referralBonus =
    Math.min(params.referralCount, MAX_REWARDED_REFERRALS) *
    EXERCISE_BONUS_PER_REFERRAL;
  const inviteeBonus = params.hasUsedReferralCode
    ? EXERCISE_BONUS_FOR_USING_REFERRAL
    : 0;
  return EXERCISE_LIMIT_BASE + referralBonus + inviteeBonus;
}

export function computeReferralBonus(referralCount: number): number {
  return (
    Math.min(referralCount, MAX_REWARDED_REFERRALS) *
    EXERCISE_BONUS_PER_REFERRAL
  );
}
