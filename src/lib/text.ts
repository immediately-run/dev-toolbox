// Text utilities: case conversion, line operations and counts.

/** Split an identifier or phrase into lowercase words. Handles camelCase,
 *  PascalCase, snake_case, kebab-case, CONSTANT_CASE and free text. */
export function words(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

export const toCamel = (s: string) => words(s).map((w, i) => (i ? cap(w) : w)).join('');
export const toPascal = (s: string) => words(s).map(cap).join('');
export const toSnake = (s: string) => words(s).join('_');
export const toKebab = (s: string) => words(s).join('-');
export const toConstant = (s: string) => words(s).join('_').toUpperCase();
export const toDot = (s: string) => words(s).join('.');

const SMALL = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'at', 'by', 'in', 'of', 'on', 'to', 'up', 'as', 'vs']);
export function toTitle(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((w, i, arr) => {
      if (/^\s+$/.test(w) || !w) return w;
      const isEdge = i === 0 || i === arr.length - 1;
      return !isEdge && SMALL.has(w) ? w : cap(w);
    })
    .join('');
}
export const toSentence = (s: string) =>
  s.toLowerCase().replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (m) => m.toUpperCase());

/** Apply a per-line converter, preserving line structure. */
export function perLine(s: string, f: (line: string) => string): string {
  return s.split('\n').map((l) => (l.trim() ? f(l) : l)).join('\n');
}

export interface LineOptions {
  caseInsensitive: boolean;
}

export function sortLines(s: string, dir: 'asc' | 'desc', o: LineOptions): string {
  const lines = s.split('\n');
  const key = (l: string) => (o.caseInsensitive ? l.toLowerCase() : l);
  const cmp = new Intl.Collator(undefined, { numeric: true, sensitivity: o.caseInsensitive ? 'base' : 'variant' });
  lines.sort((a, b) => cmp.compare(key(a), key(b)));
  if (dir === 'desc') lines.reverse();
  return lines.join('\n');
}

export function dedupeLines(s: string, o: LineOptions): string {
  const seen = new Set<string>();
  return s
    .split('\n')
    .filter((l) => {
      const k = o.caseInsensitive ? l.toLowerCase() : l;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .join('\n');
}

export const reverseLines = (s: string) => s.split('\n').reverse().join('\n');
export const shuffleLines = (s: string) => {
  const lines = s.split('\n');
  for (let i = lines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lines[i], lines[j]] = [lines[j], lines[i]];
  }
  return lines.join('\n');
};
export const trimTrailing = (s: string) => s.replace(/[ \t]+$/gm, '');
export const trimLines = (s: string) => s.split('\n').map((l) => l.trim()).join('\n');
export const removeEmptyLines = (s: string) => s.split('\n').filter((l) => l.trim()).join('\n');
export const numberLines = (s: string) => {
  const lines = s.split('\n');
  const w = String(lines.length).length;
  return lines.map((l, i) => `${String(i + 1).padStart(w)}  ${l}`).join('\n');
};

export interface TextCounts {
  chars: number;
  charsNoSpaces: number;
  words: number;
  lines: number;
  bytes: number;
  sentences: number;
  paragraphs: number;
}

export function countText(s: string): TextCounts {
  const chars = [...s].length;
  return {
    chars,
    charsNoSpaces: [...s.replace(/\s/g, '')].length,
    words: s.trim() ? s.trim().split(/\s+/).length : 0,
    lines: s === '' ? 0 : s.split('\n').length,
    bytes: new TextEncoder().encode(s).length,
    sentences: (s.match(/[^.!?]+[.!?]+/g) ?? []).length,
    paragraphs: s.trim() ? s.trim().split(/\n\s*\n/).length : 0,
  };
}
