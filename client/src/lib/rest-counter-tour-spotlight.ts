const SPOTLIGHT_ID = "rest-counter-tour-spotlight";
const SPOTLIGHT_PADDING = 8;

let syncFrameId: number | null = null;
let resizeObserver: ResizeObserver | null = null;

function getTriggerEl(): Element | null {
  return document.querySelector('[data-tour="rest-counter-target"]');
}

function getPanelEl(): Element | null {
  return document.querySelector('[data-tour="rest-counter-target-panel"]');
}

function ensureSpotlightEl(): HTMLDivElement {
  let el = document.getElementById(SPOTLIGHT_ID) as HTMLDivElement | null;
  if (el) return el;

  el = document.createElement("div");
  el.id = SPOTLIGHT_ID;
  el.setAttribute("data-tour", "rest-counter-target-zone");
  el.setAttribute("aria-hidden", "true");
  el.style.position = "fixed";
  el.style.pointerEvents = "none";
  el.style.zIndex = "119";
  document.body.appendChild(el);
  return el;
}

export function syncRestCounterTourSpotlight(): boolean {
  const trigger = getTriggerEl();
  const panel = getPanelEl();
  if (!trigger || !panel) return false;

  const triggerRect = trigger.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  if (triggerRect.width === 0 || panelRect.width === 0) return false;

  const top =
    Math.min(triggerRect.top, panelRect.top) - SPOTLIGHT_PADDING;
  const left =
    Math.min(triggerRect.left, panelRect.left) - SPOTLIGHT_PADDING;
  const right =
    Math.max(triggerRect.right, panelRect.right) + SPOTLIGHT_PADDING;
  const bottom =
    Math.max(triggerRect.bottom, panelRect.bottom) + SPOTLIGHT_PADDING;

  const el = ensureSpotlightEl();
  el.style.top = `${top}px`;
  el.style.left = `${left}px`;
  el.style.width = `${right - left}px`;
  el.style.height = `${bottom - top}px`;
  return true;
}

function scheduleSync(): void {
  if (syncFrameId != null) return;
  syncFrameId = requestAnimationFrame(() => {
    syncFrameId = null;
    syncRestCounterTourSpotlight();
  });
}

export function startRestCounterTourSpotlightSync(): void {
  syncRestCounterTourSpotlight();

  resizeObserver?.disconnect();
  resizeObserver = new ResizeObserver(() => scheduleSync());
  const trigger = getTriggerEl();
  const panel = getPanelEl();
  if (trigger) resizeObserver.observe(trigger);
  if (panel) resizeObserver.observe(panel);

  window.addEventListener("scroll", scheduleSync, true);
  window.addEventListener("resize", scheduleSync);
}

export function stopRestCounterTourSpotlightSync(): void {
  if (syncFrameId != null) {
    cancelAnimationFrame(syncFrameId);
    syncFrameId = null;
  }

  resizeObserver?.disconnect();
  resizeObserver = null;

  window.removeEventListener("scroll", scheduleSync, true);
  window.removeEventListener("resize", scheduleSync);

  document.getElementById(SPOTLIGHT_ID)?.remove();
}

export async function waitForRestCounterTourSpotlightReady(): Promise<void> {
  return new Promise((resolve) => {
    const deadline = Date.now() + 1200;
    const tick = () => {
      if (syncRestCounterTourSpotlight()) {
        resolve();
        return;
      }
      if (Date.now() > deadline) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}
