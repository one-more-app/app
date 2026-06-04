import {
  escapeIlikePattern,
  isSearchInputReady,
  parseSearchInput,
  toIlikeContainsPattern,
  tokenizeSearchText,
} from '../lib/user-search-query.js';

describe('user-search-query', () => {
  describe('escapeIlikePattern', () => {
    it('strips ILIKE wildcard characters', () => {
      expect(escapeIlikePattern('a%b_c\\d')).toBe('abcd');
    });
  });

  describe('toIlikeContainsPattern', () => {
    it('wraps token in percent wildcards', () => {
      expect(toIlikeContainsPattern('Jean')).toBe('%Jean%');
    });
  });

  describe('tokenizeSearchText', () => {
    it('splits on whitespace and drops short tokens', () => {
      expect(tokenizeSearchText('Jean Dupont')).toEqual(['Jean', 'Dupont']);
      expect(tokenizeSearchText('J Dupont')).toEqual(['Dupont']);
    });
  });

  describe('parseSearchInput', () => {
    it('rejects empty query', () => {
      expect(parseSearchInput('   ')).toEqual({
        error: 'Requête de recherche vide',
      });
    });

    it('parses handle mode with @ prefix', () => {
      expect(parseSearchInput('@ada_lift')).toEqual({
        mode: 'handle',
        raw: '@ada_lift',
        handle: 'ada_lift',
        tokens: ['ada_lift'],
      });
    });

    it('parses handle mode with partial handle', () => {
      expect(parseSearchInput('@a')).toEqual({
        mode: 'handle',
        raw: '@a',
        handle: 'a',
        tokens: ['a'],
      });
    });

    it('parses text mode with tokens', () => {
      expect(parseSearchInput('Jean Dupont')).toEqual({
        mode: 'text',
        raw: 'Jean Dupont',
        tokens: ['Jean', 'Dupont'],
      });
    });

    it('rejects text mode shorter than 2 characters', () => {
      expect(parseSearchInput('J')).toEqual({
        error: 'Saisis au moins 2 caractères pour une recherche',
      });
    });

    it('does not treat valid username shape as handle mode without @', () => {
      expect(parseSearchInput('marie')).toEqual({
        mode: 'text',
        raw: 'marie',
        tokens: ['marie'],
      });
    });
  });

  describe('isSearchInputReady', () => {
    it('returns true for ready queries', () => {
      expect(isSearchInputReady('Jean')).toBe(true);
      expect(isSearchInputReady('@a')).toBe(true);
    });

    it('returns false for too-short text queries', () => {
      expect(isSearchInputReady('J')).toBe(false);
      expect(isSearchInputReady('')).toBe(false);
    });
  });
});
