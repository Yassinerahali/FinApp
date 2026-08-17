import { useEffect, useRef, useState } from "react";

/**
 * Animates a number tweening from its previous value to a new one
 * whenever it changes, instead of snapping instantly. Purely visual —
 * returns the current animated value to render in place of the real one.
 * If the value changes again mid-tween, it continues smoothly from
 * wherever it currently is rather than jumping.
 */
export function useCountUp(value, durationMs = 500) {
  const [display, setDisplay] = useState(value);
  const currentRef = useRef(value);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = currentRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const next = from + (to - from) * eased;
      currentRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs]);

  return display;
}
