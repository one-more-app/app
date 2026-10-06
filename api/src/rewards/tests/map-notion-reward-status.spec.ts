import { TshirtRewardStatus } from '../entities/tshirt-reward-status.enum.js';
import {
  isForwardStatusTransition,
  notionRewardStatusToClaimStatus,
} from '../lib/map-notion-reward-status.js';

describe('map-notion-reward-status', () => {
  it('maps Notion status labels to claim statuses', () => {
    expect(notionRewardStatusToClaimStatus('À traiter')).toBe(
      TshirtRewardStatus.Pending,
    );
    expect(notionRewardStatusToClaimStatus('Expédié')).toBe(
      TshirtRewardStatus.Shipped,
    );
    expect(notionRewardStatusToClaimStatus('Livré')).toBe(
      TshirtRewardStatus.Delivered,
    );
    expect(notionRewardStatusToClaimStatus('Inconnu')).toBeNull();
  });

  it('detects forward transitions only', () => {
    expect(
      isForwardStatusTransition(
        TshirtRewardStatus.Pending,
        TshirtRewardStatus.Shipped,
      ),
    ).toBe(true);
    expect(
      isForwardStatusTransition(
        TshirtRewardStatus.Shipped,
        TshirtRewardStatus.Pending,
      ),
    ).toBe(false);
    expect(
      isForwardStatusTransition(
        TshirtRewardStatus.Pending,
        TshirtRewardStatus.Pending,
      ),
    ).toBe(false);
  });
});
