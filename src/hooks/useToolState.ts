import { useCallback, useEffect, useRef, useState } from 'react';
import { loadLast, peekLast, saveLast } from '../lib/persist';

/**
 * State that remembers itself: seeded from the in-memory cache synchronously,
 * hydrated from `<private>/last/<id>.json` on first mount, and written back
 * (debounced) on every change. Object states are shallow-merged over `initial`
 * so new fields added later still get defaults.
 */
export function useToolState<T extends object>(id: string, initial: T): [T, (u: T | ((p: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(() => {
    const m = peekLast<Partial<T>>(id);
    return m ? { ...initial, ...m } : initial;
  });
  const [ready, setReady] = useState<boolean>(() => peekLast(id) !== undefined);
  const dirty = useRef(false);
  const initialRef = useRef(initial);

  useEffect(() => {
    if (ready) return;
    let alive = true;
    void loadLast<Partial<T>>(id).then((v) => {
      if (!alive) return;
      if (v !== undefined && !dirty.current) setState({ ...initialRef.current, ...v });
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [id, ready]);

  const set = useCallback(
    (u: T | ((p: T) => T)) => {
      dirty.current = true;
      setState((p) => (typeof u === 'function' ? (u as (p: T) => T)(p) : u));
    },
    [],
  );

  useEffect(() => {
    if (dirty.current) saveLast(id, state);
  }, [id, state]);

  return [state, set, ready];
}
