// Per-tool "last input" persistence on top of the private store.
//
// Every tool's state lives at `<private>/last/<toolId>.json`. Writes are
// debounced per tool. When the store is unavailable (not signed in, host
// declined, no host at all) everything still works from an in-memory map —
// the tool just forgets on reload.
import { openPrivateStore, readJson, writeJson, type Store } from './store';

const mem = new Map<string, unknown>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let storeP: Promise<Store | null> | null = null;
let status: PersistStatus = 'pending';
const listeners = new Set<(s: PersistStatus) => void>();

export type PersistStatus = 'pending' | 'store' | 'read-only' | 'memory';

function setStatus(s: PersistStatus) {
  status = s;
  for (const l of listeners) l(s);
}

export function getPersistStatus(): PersistStatus {
  return status;
}

export function onPersistStatus(l: (s: PersistStatus) => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Open the private store once. Call at boot; safe to call repeatedly. */
export function bootStore(): Promise<Store | null> {
  storeP ??= openPrivateStore('data')
    .then((s) => {
      setStatus(s.mode === 'rw' ? 'store' : 'read-only');
      return s;
    })
    .catch(() => {
      setStatus('memory');
      return null;
    });
  return storeP;
}

const pathFor = (s: Store, id: string) => `${s.root}/last/${id}.json`;

export function peekLast<T>(id: string): T | undefined {
  return mem.get(id) as T | undefined;
}

export async function loadLast<T>(id: string): Promise<T | undefined> {
  if (mem.has(id)) return mem.get(id) as T;
  const s = await bootStore();
  if (!s) return undefined;
  const v = await readJson<T | undefined>(pathFor(s, id), undefined);
  if (v !== undefined && !mem.has(id)) mem.set(id, v);
  return mem.get(id) as T | undefined;
}

export function saveLast(id: string, value: unknown, delayMs = 500): void {
  mem.set(id, value);
  const t = timers.get(id);
  if (t) clearTimeout(t);
  timers.set(
    id,
    setTimeout(async () => {
      timers.delete(id);
      const s = await bootStore();
      if (!s || s.mode !== 'rw') return;
      try {
        await writeJson(pathFor(s, id), mem.get(id));
      } catch {
        /* best effort — memory copy still serves this session */
      }
    }, delayMs),
  );
}
