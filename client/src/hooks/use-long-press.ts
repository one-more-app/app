import {
  useCallback,
  useRef,
  type MouseEvent,
  type MutableRefObject,
  type PointerEvent,
} from "react";

const DEFAULT_DELAY_MS = 400;
const DEFAULT_MOVE_THRESHOLD_PX = 10;

type UseLongPressOptions = {
  onLongPress: () => void;
  delayMs?: number;
  moveThresholdPx?: number;
  disabled?: boolean;
};

type LongPressHandlers = {
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: (event: PointerEvent) => void;
  onPointerCancel: (event: PointerEvent) => void;
  onContextMenu: (event: MouseEvent) => void;
};

export function useLongPress({
  onLongPress,
  delayMs = DEFAULT_DELAY_MS,
  moveThresholdPx = DEFAULT_MOVE_THRESHOLD_PX,
  disabled = false,
}: UseLongPressOptions): {
  handlers: LongPressHandlers;
  didLongPressRef: MutableRefObject<boolean>;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const didLongPressRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (disabled || event.button !== 0) return;
      didLongPressRef.current = false;
      startRef.current = { x: event.clientX, y: event.clientY };
      timerRef.current = setTimeout(() => {
        didLongPressRef.current = true;
        onLongPress();
        timerRef.current = null;
      }, delayMs);
    },
    [delayMs, disabled, onLongPress],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!startRef.current || !timerRef.current) return;
      const dx = Math.abs(event.clientX - startRef.current.x);
      const dy = Math.abs(event.clientY - startRef.current.y);
      if (dx > moveThresholdPx || dy > moveThresholdPx) {
        clear();
      }
    },
    [clear, moveThresholdPx],
  );

  const onPointerUp = useCallback(() => {
    clear();
  }, [clear]);

  const onPointerCancel = useCallback(() => {
    clear();
  }, [clear]);

  const onContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
  }, []);

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onContextMenu,
    },
    didLongPressRef,
  };
}
