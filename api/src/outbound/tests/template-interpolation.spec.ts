import { describe, expect, it } from '@jest/globals';
import { interpolateTemplateString } from '../templates/template-interpolation.js';

describe('interpolateTemplateString', () => {
  it('replaces declared variables', () => {
    const out = interpolateTemplateString('Hello {{name}}', { name: 'Tom' }, [
      'name',
    ]);
    expect(out).toBe('Hello Tom');
  });

  it('throws on missing variable', () => {
    expect(() =>
      interpolateTemplateString('Hi {{name}}', {}, ['name']),
    ).toThrow(/Variable manquante/);
  });

  it('throws on undeclared placeholder', () => {
    expect(() => interpolateTemplateString('Hi {{x}}', { x: 1 }, [])).toThrow(
      /Variable non déclarée/,
    );
  });
});
