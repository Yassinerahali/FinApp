import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref to attach to an element and whether it has scrolled into
 * view yet. Fires once — once true, stays true (no re-hiding on scroll
 * back up), which reads better for a one-way reveal effect.
 */
export function useInView(options = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}
