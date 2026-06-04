import { normalizeUsername } from './username.js';

export type SearchMode = 'handle' | 'text';

export type ParsedSearchInput = {
  mode: SearchMode;
  raw: string;
  handle?: string;
  tokens: string[];
};

export type ParseSearchInputResult =
  | ParsedSearchInput
  | { error: string };

const MIN_TEXT_TOKEN_LENGTH = 2;

/** Retire les caractères spéciaux ILIKE pour éviter des patterns trop larges. */
export function escapeIlikePattern(token: string): string {
  return token.replace(/[%_\\]/g, '');
}

export function toIlikeContainsPattern(token: string): string {
  return `%${escapeIlikePattern(token)}%`;
}

export function tokenizeSearchText(q: string): string[] {
  return q
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= MIN_TEXT_TOKEN_LENGTH);
}

export function parseSearchInput(raw: string): ParseSearchInputResult {
  const trimmed = raw.trim();
  if (trimmed.length < 1) {
    return { error: 'Requête de recherche vide' };
  }

  if (trimmed.startsWith('@')) {
    const handle = normalizeUsername(trimmed);
    if (handle.length < 1) {
      return { error: 'Saisis au moins 1 caractère après @' };
    }
    return { mode: 'handle', raw: trimmed, handle, tokens: [handle] };
  }

  const tokens = tokenizeSearchText(trimmed);
  if (tokens.length === 0) {
    return {
      error: 'Saisis au moins 2 caractères pour une recherche',
    };
  }

  return { mode: 'text', raw: trimmed, tokens };
}

export function isSearchInputReady(raw: string): boolean {
  const parsed = parseSearchInput(raw);
  return !('error' in parsed);
}
