import { describe, expect, it } from '@jest/globals';
import {
  parseActivationHookFilter,
  sqlActivationHookPredicate,
  SQL_HAS_GYM_ARRIVAL_NOTIFY,
  SQL_HAS_TRAINING_REMINDER,
} from '../segments/segment-activation-hook.js';

describe('segment-activation-hook', () => {
  it('parses activationHook and ignores empty', () => {
    expect(
      parseActivationHookFilter({ activationHook: 'gym_arrival' }, 'test'),
    ).toBe('gym_arrival');
    expect(parseActivationHookFilter({ activation_hook: 'any' }, 'test')).toBe(
      'any',
    );
    expect(parseActivationHookFilter({}, 'test')).toBeNull();
    expect(
      parseActivationHookFilter({ activationHook: '' }, 'test'),
    ).toBeNull();
  });

  it('rejects unknown activationHook', () => {
    expect(() =>
      parseActivationHookFilter({ activationHook: 'foo' }, 'seg'),
    ).toThrow(/activationHook invalide/);
  });

  it('builds not_training_reminder as negation', () => {
    expect(sqlActivationHookPredicate('not_training_reminder')).toMatch(
      /^NOT \(/,
    );
  });

  it('builds SQL predicates for each mode', () => {
    expect(sqlActivationHookPredicate('training_reminder')).toBe(
      SQL_HAS_TRAINING_REMINDER,
    );
    expect(sqlActivationHookPredicate('gym_arrival')).toBe(
      SQL_HAS_GYM_ARRIVAL_NOTIFY,
    );
    expect(sqlActivationHookPredicate('both')).toContain(' AND ');
    expect(sqlActivationHookPredicate('any')).toContain(' OR ');
    expect(sqlActivationHookPredicate('none')).toMatch(/^NOT \(/);
  });
});
