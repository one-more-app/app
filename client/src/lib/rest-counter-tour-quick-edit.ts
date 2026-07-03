const REST_COUNTER_TOUR_STEP2_EVENT = "one-more:rest-counter-tour-step2";

let step2Active = false;

export function isRestCounterTourQuickEditStep2Active(): boolean {
  return step2Active;
}

export function setRestCounterTourQuickEditStep2Active(active: boolean): void {
  if (step2Active === active) return;
  step2Active = active;
  window.dispatchEvent(
    new CustomEvent(REST_COUNTER_TOUR_STEP2_EVENT, { detail: { active } }),
  );
}

export function subscribeRestCounterTourQuickEditStep2(
  listener: (active: boolean) => void,
): () => void {
  const handler = (event: Event) => {
    listener((event as CustomEvent<{ active: boolean }>).detail.active);
  };
  window.addEventListener(REST_COUNTER_TOUR_STEP2_EVENT, handler);
  return () => window.removeEventListener(REST_COUNTER_TOUR_STEP2_EVENT, handler);
}
