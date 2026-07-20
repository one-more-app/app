import { describe, expect, it } from '@jest/globals';
import { formatEventParticipantDisplayName } from '../event-display-name.js';

describe('formatEventParticipantDisplayName', () => {
  it('combines first and last name', () => {
    expect(formatEventParticipantDisplayName('Alex', 'Martin')).toBe(
      'Alex Martin',
    );
    expect(formatEventParticipantDisplayName('Léa', 'Dupont')).toBe(
      'Léa Dupont',
    );
  });

  it('falls back to first name only when last name is missing', () => {
    expect(formatEventParticipantDisplayName('Alex', '')).toBe('Alex');
    expect(formatEventParticipantDisplayName('Alex', '   ')).toBe('Alex');
  });

  it('trims whitespace', () => {
    expect(formatEventParticipantDisplayName(' Alex ', ' Martin ')).toBe(
      'Alex Martin',
    );
  });
});
