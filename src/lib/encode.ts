// Encoders/decoders. All functions return a string; decoders throw on bad
// input (the tool surfaces the message). Everything is UTF-8 aware.

const enc = new TextEncoder();
const dec = new TextDecoder();

export function utf8Bytes(s: string): Uint8Array {
  return enc.encode(s);
}

export function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const b64 = btoa(bin);
  return urlSafe ? b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b64;
}

export function base64ToBytes(s: string): Uint8Array {
  let t = s.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(t)) throw new Error('Not valid Base64 (unexpected characters)');
  while (t.length % 4) t += '=';
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const base64Encode = (s: string, urlSafe = false) => bytesToBase64(utf8Bytes(s), urlSafe);
export const base64Decode = (s: string) => dec.decode(base64ToBytes(s));

export function urlEncode(s: string, component: boolean): string {
  return component ? encodeURIComponent(s) : encodeURI(s);
}
export function urlDecode(s: string, component: boolean): string {
  return component ? decodeURIComponent(s.replace(/\+/g, '%20')) : decodeURI(s);
}

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', trade: '™',
  hellip: '…', mdash: '—', ndash: '–', laquo: '«', raquo: '»', euro: '€', pound: '£', yen: '¥',
  cent: '¢', deg: '°', plusmn: '±', times: '×', divide: '÷', micro: 'µ', para: '¶', sect: '§',
  middot: '·', bull: '•', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', larr: '←', rarr: '→',
  uarr: '↑', darr: '↓', harr: '↔', hearts: '♥', infin: '∞', ne: '≠', le: '≤', ge: '≥',
};

export function htmlEncode(s: string, allNonAscii: boolean): string {
  let out = s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
  if (allNonAscii) out = out.replace(/[\u0080-\u{10ffff}]/gu, (c) => `&#x${(c.codePointAt(0) as number).toString(16).toUpperCase()};`);
  return out;
}

export function htmlDecode(s: string): string {
  try {
    const ta = document.createElement('textarea');
    ta.innerHTML = s;
    return ta.value;
  } catch {
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, body: string) => {
      if (body[0] === '#') {
        const cp = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
        return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
      }
      return NAMED[body] ?? m;
    });
  }
}

export function bytesToHex(bytes: Uint8Array, sep = ''): string {
  const parts: string[] = [];
  for (const b of bytes) parts.push(b.toString(16).padStart(2, '0'));
  return parts.join(sep);
}

export function hexToBytes(s: string): Uint8Array {
  const t = s.replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '');
  if (t.length % 2) throw new Error('Odd number of hex digits');
  const out = new Uint8Array(t.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(t.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export const hexEncode = (s: string, sep: string) => bytesToHex(utf8Bytes(s), sep);
export const hexDecode = (s: string) => dec.decode(hexToBytes(s));

export function unicodeEscape(s: string, allChars: boolean): string {
  let out = '';
  for (const ch of s) {
    const cp = ch.codePointAt(0) as number;
    if (!allChars && cp < 0x80) out += ch;
    else if (cp > 0xffff) out += `\\u{${cp.toString(16)}}`;
    else out += `\\u${cp.toString(16).padStart(4, '0')}`;
  }
  return out;
}

export function unicodeUnescape(s: string): string {
  return s
    .replace(/\\u\{([0-9a-f]+)\}/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\u([0-9a-f]{4})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\x([0-9a-f]{2})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/U\+([0-9a-f]{4,6})/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)));
}

// ── JWT ─────────────────────────────────────────────────────────────────────

export interface JwtDecoded {
  header: unknown;
  payload: unknown;
  signature: string;
  headerRaw: string;
  payloadRaw: string;
  claims: { name: string; value: number; date: Date }[];
}

export function decodeJwt(token: string): JwtDecoded {
  const parts = token.trim().split('.');
  if (parts.length < 2 || parts.length > 3) throw new Error('A JWT has 3 dot-separated parts (header.payload.signature)');
  const [h, p, s = ''] = parts;
  const headerRaw = base64Decode(h);
  const payloadRaw = base64Decode(p);
  let header: unknown;
  let payload: unknown;
  try {
    header = JSON.parse(headerRaw);
  } catch {
    throw new Error('Header is not valid JSON');
  }
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    throw new Error('Payload is not valid JSON');
  }
  const claims: JwtDecoded['claims'] = [];
  if (payload && typeof payload === 'object') {
    for (const name of ['iat', 'nbf', 'exp']) {
      const v = (payload as Record<string, unknown>)[name];
      if (typeof v === 'number') claims.push({ name, value: v, date: new Date(v * 1000) });
    }
  }
  return { header, payload, signature: s, headerRaw, payloadRaw, claims };
}
