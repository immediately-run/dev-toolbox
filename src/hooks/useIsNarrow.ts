import { useEffect, useState } from 'react';
import { useFormFactor } from '@immediately-run/sdk/formFactor';

/** True when the layout should collapse to a single column: the host reports
 *  a mobile surface, or our own iframe viewport is narrow. */
export function useIsNarrow(maxWidth = 760): boolean {
  const ff = useFormFactor();
  const [narrow, setNarrow] = useState(() => {
    try {
      return window.matchMedia(`(max-width: ${maxWidth}px)`).matches;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [maxWidth]);
  return narrow || ff.class === 'mobile';
}
