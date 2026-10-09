import { TshirtRewardStatus } from '../entities/tshirt-reward-status.enum.js';
import { reconcileNotionClaimStatus } from '../lib/notion-rewards-status-reconcile.js';

const base = {
  status: TshirtRewardStatus.Pending,
  notionPendingStatus: null as TshirtRewardStatus | null,
  notionPendingSince: null as Date | null,
};

describe('reconcileNotionClaimStatus', () => {
  const t0 = new Date('2026-06-01T12:00:00.000Z');

  it('starts pending on first status change', () => {
    expect(
      reconcileNotionClaimStatus(base, TshirtRewardStatus.Shipped, t0, 5),
    ).toEqual({
      kind: 'start_pending',
      pendingStatus: TshirtRewardStatus.Shipped,
      pendingSince: t0,
    });
  });

  it('does not apply before debounce elapses', () => {
    expect(
      reconcileNotionClaimStatus(
        {
          ...base,
          notionPendingStatus: TshirtRewardStatus.Shipped,
          notionPendingSince: t0,
        },
        TshirtRewardStatus.Shipped,
        new Date(t0.getTime() + 4 * 60_000),
        5,
      ),
    ).toEqual({ kind: 'noop' });
  });

  it('applies after debounce elapses', () => {
    expect(
      reconcileNotionClaimStatus(
        {
          ...base,
          notionPendingStatus: TshirtRewardStatus.Shipped,
          notionPendingSince: t0,
        },
        TshirtRewardStatus.Shipped,
        new Date(t0.getTime() + 5 * 60_000),
        5,
      ),
    ).toEqual({
      kind: 'apply',
      previousStatus: TshirtRewardStatus.Pending,
      nextStatus: TshirtRewardStatus.Shipped,
    });
  });

  it('cancels pending when reverted to committed status', () => {
    expect(
      reconcileNotionClaimStatus(
        {
          ...base,
          notionPendingStatus: TshirtRewardStatus.Shipped,
          notionPendingSince: t0,
        },
        TshirtRewardStatus.Pending,
        new Date(t0.getTime() + 60_000),
        5,
      ),
    ).toEqual({ kind: 'cancel_pending' });
  });

  it('resets pending timer when target status changes', () => {
    const t1 = new Date(t0.getTime() + 2 * 60_000);
    expect(
      reconcileNotionClaimStatus(
        {
          ...base,
          notionPendingStatus: TshirtRewardStatus.Shipped,
          notionPendingSince: t0,
        },
        TshirtRewardStatus.Delivered,
        t1,
        5,
      ),
    ).toEqual({
      kind: 'start_pending',
      pendingStatus: TshirtRewardStatus.Delivered,
      pendingSince: t1,
    });
  });
});
