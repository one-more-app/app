import { describe, expect, it } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { resolveMonth } from '../ranking.controller.js';

describe('resolveMonth', () => {
  it('accepts a valid YYYY-MM string', () => {
    expect(resolveMonth('2026-09')).toBe('2026-09');
  });

  it('throws BadRequestException when month is an array', () => {
    expect(() => resolveMonth(['2026-09', '2026-10'])).toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException for invalid format', () => {
    expect(() => resolveMonth('nope')).toThrow(BadRequestException);
  });
});
