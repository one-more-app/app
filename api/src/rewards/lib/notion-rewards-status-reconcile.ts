import { TshirtRewardStatus } from '../entities/tshirt-reward-status.enum.js';

export type ClaimNotionSyncState = {
  status: TshirtRewardStatus;
  notionPendingStatus: TshirtRewardStatus | null;
  notionPendingSince: Date | null;
};

export type NotionStatusReconcileResult =
  | { kind: 'noop' }
  | { kind: 'cancel_pending' }
  | {
      kind: 'start_pending';
      pendingStatus: TshirtRewardStatus;
      pendingSince: Date;
    }
  | {
      kind: 'apply';
      previousStatus: TshirtRewardStatus;
      nextStatus: TshirtRewardStatus;
    };

export function readNotionStatusDebounceMinutes(
  raw: string | undefined,
  fallback = 5,
): number {
  const parsed = Number.parseInt(raw?.trim() ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function reconcileNotionClaimStatus(
  claim: ClaimNotionSyncState,
  nextStatus: TshirtRewardStatus | null,
  now: Date,
  debounceMinutes: number,
): NotionStatusReconcileResult {
  if (!nextStatus) return { kind: 'noop' };
  if (claim.status === TshirtRewardStatus.ClaimPending) return { kind: 'noop' };
  if (nextStatus === claim.status) {
    if (claim.notionPendingStatus != null) return { kind: 'cancel_pending' };
    return { kind: 'noop' };
  }

  const debounceMs = debounceMinutes * 60_000;
  const pendingMatches =
    claim.notionPendingStatus === nextStatus &&
    claim.notionPendingSince != null;

  if (!pendingMatches) {
    return {
      kind: 'start_pending',
      pendingStatus: nextStatus,
      pendingSince: now,
    };
  }

  const elapsed = now.getTime() - claim.notionPendingSince!.getTime();
  if (elapsed < debounceMs) return { kind: 'noop' };

  return {
    kind: 'apply',
    previousStatus: claim.status,
    nextStatus,
  };
}
