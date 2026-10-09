import { escapeHtml } from '../../emails/transactional-layout.js';

export function interpolateTemplateString(
  template: string,
  variables: Record<string, string | number | boolean>,
  declared: string[],
  opts?: { escapeForHtml?: boolean },
): string {
  for (const key of declared) {
    if (!(key in variables)) {
      throw new Error(`Variable manquante: ${key}`);
    }
  }

  return template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_match, key: string) => {
      if (!declared.includes(key)) {
        throw new Error(`Variable non déclarée: ${key}`);
      }
      const raw = variables[key];
      const str = String(raw);
      return opts?.escapeForHtml ? escapeHtml(str) : str;
    },
  );
}
