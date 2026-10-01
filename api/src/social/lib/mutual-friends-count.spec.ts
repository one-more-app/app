import { describe, expect, it } from '@jest/globals';
import { countMutualFriendIds } from './mutual-friends-count.js';

describe('countMutualFriendIds', () => {
  it('returns 0 when either list is empty', () => {
    expect(countMutualFriendIds([], ['a'])).toBe(0);
    expect(countMutualFriendIds(['a'], [])).toBe(0);
  });

  it('counts intersection only', () => {
    expect(countMutualFriendIds(['a', 'b', 'c'], ['b', 'd', 'c'])).toBe(2);
  });

  it('ignores duplicates in the first list via Set on second only', () => {
    expect(countMutualFriendIds(['a', 'a', 'b'], ['a', 'c'])).toBe(2);
  });
});
