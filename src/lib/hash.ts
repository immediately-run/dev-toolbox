// SHA-* and HMAC via WebCrypto. `crypto.subtle` exists only in secure contexts;
// the app checks `subtleAvailable()` at runtime and explains when it is absent.
import { bytesToHex } from './encode';

export type ShaAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

export function subtleAvailable(): boolean {
  try {
    return typeof crypto !== 'undefined' && !!crypto.subtle && typeof crypto.subtle.digest === 'function';
  } catch {
    return false;
  }
}

export async function sha(alg: ShaAlgorithm, data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest(alg, data as BufferSource);
  return bytesToHex(new Uint8Array(buf));
}

export async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<string> {
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, data as BufferSource);
  return bytesToHex(new Uint8Array(sig));
}
