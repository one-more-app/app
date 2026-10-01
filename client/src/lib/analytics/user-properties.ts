import type { UserAccess } from "@/lib/social-api";
import type { UserProfile } from "@/types";
import {
  getOnboardingLastStep,
  getOnboardingSignupMethod,
} from "./onboarding-tracking";
import { getAttributionIdentifyProperties } from "./attribution";
import type { AnalyticsProperties } from "./track";
import { isOnboardingMarkedDone } from "@/lib/storage";

/**
 * Traits profil OpenPanel pour segmenter l’usage.
 * Volontairement lean : monétisation, limites, parrainage, contexte produit/morpho.
 * Pas de username (peu utile en analytics).
 */
export function buildUsageIdentifyProperties(params: {
  access?: UserAccess | null;
  profile?: UserProfile | null;
}): AnalyticsProperties {
  const { access, profile } = params;
  const props: AnalyticsProperties = {
    onboarding_completed: isOnboardingMarkedDone(),
    onboarding_last_step: getOnboardingLastStep(),
    signup_method: getOnboardingSignupMethod(),
    ...getAttributionIdentifyProperties(),
  };

  if (access) {
    props.is_premium = access.isPremium;
    props.plan = access.isPremium ? "premium" : "free";
    props.exercise_count = access.activeExerciseCount;
    props.exercise_limit = access.exerciseLimit;
    props.can_add_exercise = access.canAddExercise;
    props.referral_count = access.referralCount;
    props.has_used_referral_code = access.hasUsedReferralCode;
    props.tshirt_reward_eligible = access.tshirtRewardEligible;
    props.referrals_until_tshirt = access.referralsUntilTshirt;
    props.referral_reward_kind = access.referralRewardKind;
  }

  if (profile) {
    if (profile.gender) props.gender = profile.gender;
    if (typeof profile.ageYears === "number") props.age_years = profile.ageYears;
    if (typeof profile.weightKg === "number") props.weight_kg = profile.weightKg;
    if (typeof profile.heightCm === "number") props.height_cm = profile.heightCm;
    if (profile.trainingGoal) props.training_goal = profile.trainingGoal;
    if (profile.trainingExperience) {
      props.training_experience = profile.trainingExperience;
    }
    if (profile.sessionsPerWeek) {
      props.sessions_per_week = profile.sessionsPerWeek;
    }
    props.has_avatar = Boolean(profile.avatarUrl?.trim());
    if (profile.discoverySource) {
      props.discovery_source = profile.discoverySource;
    }
  }

  return props;
}

export function buildIdentifyTraits(profile?: UserProfile | null): {
  firstName?: string;
  lastName?: string;
  avatar?: string;
} {
  if (!profile) return {};
  return {
    firstName: profile.firstName?.trim() || undefined,
    lastName: profile.lastName?.trim() || undefined,
    avatar: profile.avatarUrl?.trim() || undefined,
  };
}
