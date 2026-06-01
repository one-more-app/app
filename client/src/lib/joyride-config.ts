const STICKY_HEADER_SELECTOR = "[data-sticky-app-header]";
const SCROLL_VIEWPORT_SELECTOR = ".app-scroll-viewport";

/** Offset scroll Joyride pour ne pas masquer les cibles sous le header sticky. */
export function getJoyrideScrollOffset(): number {
  if (typeof document === "undefined") return 72;

  const header = document.querySelector(STICKY_HEADER_SELECTOR);
  if (header instanceof HTMLElement) {
    const scrollParent =
      header.closest(SCROLL_VIEWPORT_SELECTOR) ??
      document.querySelector(SCROLL_VIEWPORT_SELECTOR);
    if (scrollParent instanceof HTMLElement) {
      const parentTop = scrollParent.getBoundingClientRect().top;
      const headerBottom = header.getBoundingClientRect().bottom;
      return Math.ceil(headerBottom - parentTop + 12);
    }
    return Math.ceil(header.getBoundingClientRect().height + 12);
  }

  const rootStyle = getComputedStyle(document.documentElement);
  const safeTop = parseFloat(rootStyle.getPropertyValue("--safe-top")) || 0;
  const headerHeight =
    parseFloat(rootStyle.getPropertyValue("--back-header-height")) || 60;

  return Math.ceil(safeTop + headerHeight + 12);
}
