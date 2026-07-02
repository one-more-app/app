/** Nombre max d'exercices actifs sans bonus de parrainage. */
export const EXERCISE_LIMIT_BASE = 10;

/** @deprecated Utiliser EXERCISE_LIMIT_BASE */
export const EXERCISE_LIMIT_LIMITED = EXERCISE_LIMIT_BASE;

/** Bonus d'exercices par filleul validé (parrain). */
export const EXERCISE_BONUS_PER_REFERRAL = 10;

/** Bonus d'exercices pour l'utilisateur qui utilise un code de parrainage (une seule fois). */
export const EXERCISE_BONUS_FOR_USING_REFERRAL = 10;

/** Parrainages requis pour débloquer le t-shirt. */
export const REFERRALS_FOR_TSHIRT_REWARD = 5;

export function computeExerciseLimit(params: {
  referralCount: number;
  hasUsedReferralCode: boolean;
}): number {
  const referralBonus = params.referralCount * EXERCISE_BONUS_PER_REFERRAL;
  const inviteeBonus = params.hasUsedReferralCode
    ? EXERCISE_BONUS_FOR_USING_REFERRAL
    : 0;
  return EXERCISE_LIMIT_BASE + referralBonus + inviteeBonus;
}

export function computeReferralBonus(referralCount: number): number {
  return referralCount * EXERCISE_BONUS_PER_REFERRAL;
}

export function computeTshirtRewardEligible(params: {
  referralCount: number;
}): boolean {
  return params.referralCount >= REFERRALS_FOR_TSHIRT_REWARD;
}

export function computeReferralsUntilTshirt(params: {
  referralCount: number;
}): number {
  return Math.max(0, REFERRALS_FOR_TSHIRT_REWARD - params.referralCount);
}
