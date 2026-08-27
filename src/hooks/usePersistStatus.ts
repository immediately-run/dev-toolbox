import { useEffect, useState } from 'react';
import { bootStore, getPersistStatus, onPersistStatus, type PersistStatus } from '../lib/persist';

/** Opens the private store at boot and reports where "last input" is kept. */
export function usePersistStatus(): PersistStatus {
  const [status, setStatus] = useState<PersistStatus>(getPersistStatus);
  useEffect(() => {
    const off = onPersistStatus(setStatus);
    void bootStore().then(() => setStatus(getPersistStatus()));
    return off;
  }, []);
  return status;
}
