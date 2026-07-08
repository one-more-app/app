import { describe, expect, it } from '@jest/globals';
import {
  normalizeGcsPublicObjectUrl,
  resolveGcsPublicUrl,
} from '../storage.config.js';

describe('storage.config GCS URLs', () => {
  it('resolveGcsPublicUrl adds bucket to path-style base', () => {
    expect(
      resolveGcsPublicUrl(
        'one-more-app-staging',
        'https://storage.googleapis.com',
      ),
    ).toBe('https://storage.googleapis.com/one-more-app-staging');
  });

  it('normalizeGcsPublicObjectUrl fixes missing bucket segment', () => {
    expect(
      normalizeGcsPublicObjectUrl(
        'https://storage.googleapis.com/avatars/user-1/file.jpg',
        'one-more-app-staging',
      ),
    ).toBe(
      'https://storage.googleapis.com/one-more-app-staging/avatars/user-1/file.jpg',
    );
  });
});
