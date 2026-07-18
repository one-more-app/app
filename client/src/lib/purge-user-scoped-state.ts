import type { Cache } from "swr";
import { clearCelebrationQueue } from "@/lib/celebration-queue";
import { invalidateCelebrationShareCacheIfLoaded } from "@/lib/celebration-share-cache-control";
import { clearProfileAvatarCache } from "@/lib/profile-avatar";
import { resetProgressCache } from "@/lib/progress-cache";
import { resetRestTimerLocalState } from "@/lib/rest-timer-local-notifications";
import {
  clearGymOnboardingLocalState,
  resetLocalExerciseCaches,
  resetUserProfileCache,
} from "@/lib/storage";

export function purgeUserScopedClientState(cache: Cache): void {
  resetLocalExerciseCaches();
  resetProgressCache();
  resetUserProfileCache();
  clearProfileAvatarCache();
  clearGymOnboardingLocalState();
  clearCelebrationQueue();
  // Ne pas importer celebration-share-prewarm (html-to-image) dans le bundle principal.
  invalidateCelebrationShareCacheIfLoaded();
  void resetRestTimerLocalState();
  for (const key of cache.keys()) {
    cache.delete(key);
  }
}
