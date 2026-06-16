const INTERACTIVE_SELECTOR =
  'button, a[href], [role="button"], [role="link"], [role="tab"], input[type="submit"], input[type="button"], label[for], summary, [data-track]';

export function findInteractiveElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null;
  const el = target.closest(INTERACTIVE_SELECTOR);
  return el instanceof HTMLElement ? el : null;
}

export function shouldSkipAutoClickTrack(el: HTMLElement): boolean {
  if (el.closest("[data-analytics-skip]")) return true;
  if (el.hasAttribute("data-track")) return true;
  if (el.getAttribute("data-analytics-auto") === "false") return true;
  return false;
}

export function resolveClickLabel(el: HTMLElement): string {
  const explicit =
    el.getAttribute("data-analytics-label") ??
    el.getAttribute("aria-label") ??
    el.getAttribute("title");
  if (explicit?.trim()) return explicit.trim().slice(0, 120);

  const slot = el.getAttribute("data-slot");
  if (slot) return slot;

  const text = el.textContent?.replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, 120);

  return el.tagName.toLowerCase();
}

export function resolveAnalyticsSection(el: HTMLElement): string | undefined {
  const sectionEl = el.closest("[data-analytics-section]");
  if (sectionEl instanceof HTMLElement) {
    return sectionEl.getAttribute("data-analytics-section") ?? undefined;
  }
  return undefined;
}

export function resolveAnalyticsFeature(el: HTMLElement): string | undefined {
  const featureEl = el.closest("[data-analytics-feature]");
  if (featureEl instanceof HTMLElement) {
    return featureEl.getAttribute("data-analytics-feature") ?? undefined;
  }
  return undefined;
}
