// Generators: UUID v4, passwords, lorem ipsum, and timestamp conversion.
import { LOREM_WORDS } from '../data/loremWords';

function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

export function uuidV4(): string {
  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Uniform integer in [0, n) via rejection sampling (no modulo bias). */
export function randomInt(n: number): number {
  if (n <= 0) return 0;
  const limit = Math.floor(0x100000000 / n) * n;
  const u = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(u);
    if (u[0] < limit) return u[0] % n;
  }
}

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~',
};
const AMBIGUOUS = /[O0Il1|`'"]/g;

export function generatePassword(o: PasswordOptions): string {
  const pools = (['lower', 'upper', 'digits', 'symbols'] as const)
    .filter((k) => o[k])
    .map((k) => (o.excludeAmbiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k]))
    .filter((p) => p.length > 0);
  if (!pools.length) return '';
  const all = pools.join('');
  const len = Math.max(pools.length, Math.min(256, Math.floor(o.length) || 0));
  const chars: string[] = pools.map((p) => p[randomInt(p.length)]);
  while (chars.length < len) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export function passwordEntropyBits(o: PasswordOptions): number {
  const pool = (['lower', 'upper', 'digits', 'symbols'] as const)
    .filter((k) => o[k])
    .map((k) => (o.excludeAmbiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k]).length)
    .reduce((a, b) => a + b, 0);
  return pool ? Math.round(Math.log2(pool) * o.length) : 0;
}

export type LoremUnit = 'paragraphs' | 'sentences' | 'words';

function loremSentence(): string {
  const len = 6 + randomInt(10);
  const words: string[] = [];
  for (let i = 0; i < len; i++) words.push(LOREM_WORDS[randomInt(LOREM_WORDS.length)]);
  if (len > 9) words[3 + randomInt(len - 6)] += ',';
  const s = words.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}

export function lorem(count: number, unit: LoremUnit, classic: boolean): string {
  const n = Math.max(1, Math.min(200, Math.floor(count) || 1));
  const intro = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';
  if (unit === 'words') {
    const words: string[] = [];
    while (words.length < n) words.push(LOREM_WORDS[randomInt(LOREM_WORDS.length)]);
    const s = words.join(' ');
    return classic ? (intro + ' ' + s).split(' ').slice(0, n).join(' ') : s;
  }
  if (unit === 'sentences') {
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(i === 0 && classic ? intro + '.' : loremSentence());
    return out.join(' ');
  }
  const paras: string[] = [];
  for (let p = 0; p < n; p++) {
    const sentences: string[] = [];
    const cnt = 4 + randomInt(4);
    for (let i = 0; i < cnt; i++) sentences.push(p === 0 && i === 0 && classic ? intro + '.' : loremSentence());
    paras.push(sentences.join(' '));
  }
  return paras.join('\n\n');
}

export interface TimeInfo {
  date: Date;
  unixSeconds: number;
  unixMillis: number;
  iso: string;
  utc: string;
  local: string;
  relative: string;
  interpretedAs: string;
}

export function relativeTime(date: Date, now = Date.now()): string {
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  const units: [string, number][] = [
    ['year', 31557600000],
    ['month', 2629800000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
    ['second', 1000],
  ];
  for (const [name, ms] of units) {
    if (abs >= ms || name === 'second') {
      const v = Math.round(abs / ms);
      const label = `${v} ${name}${v === 1 ? '' : 's'}`;
      return diff < 0 ? `${label} ago` : `in ${label}`;
    }
  }
  return 'now';
}

export function parseTime(input: string, now = Date.now()): TimeInfo | { error: string } {
  const t = input.trim();
  let date: Date;
  let interpretedAs: string;
  if (t === '' || /^now$/i.test(t)) {
    date = new Date(now);
    interpretedAs = 'now';
  } else if (/^-?\d+(\.\d+)?$/.test(t)) {
    const n = Number(t);
    if (Math.abs(n) < 1e11) {
      date = new Date(n * 1000);
      interpretedAs = 'Unix seconds';
    } else if (Math.abs(n) < 1e14) {
      date = new Date(n);
      interpretedAs = 'Unix milliseconds';
    } else if (Math.abs(n) < 1e17) {
      date = new Date(n / 1000);
      interpretedAs = 'Unix microseconds';
    } else {
      date = new Date(n / 1e6);
      interpretedAs = 'Unix nanoseconds';
    }
  } else {
    date = new Date(t);
    interpretedAs = 'date string';
  }
  if (Number.isNaN(date.getTime())) return { error: 'Could not parse that as a timestamp or date.' };
  return {
    date,
    unixSeconds: Math.floor(date.getTime() / 1000),
    unixMillis: date.getTime(),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' }),
    relative: relativeTime(date, now),
    interpretedAs,
  };
}
