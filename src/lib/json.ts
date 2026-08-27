// JSON helpers: a position-reporting validator (JSON.parse's error messages
// differ per engine and often omit the offset), formatting, key sorting,
// JSON → TypeScript interfaces and JSON → CSV.

export interface JsonError {
  message: string;
  line: number;
  col: number;
  pos: number;
}

export type ParseResult = { ok: true; value: unknown } | { ok: false; error: JsonError };

function lineCol(text: string, pos: number): { line: number; col: number } {
  let line = 1;
  let last = 0;
  for (let i = 0; i < pos && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      last = i + 1;
    }
  }
  return { line, col: pos - last + 1 };
}

/** Strict RFC 8259 scan that reports the first offending offset. */
export function validateJson(text: string): JsonError | null {
  let i = 0;
  const n = text.length;
  const fail = (message: string, at = i): JsonError => ({ message, pos: at, ...lineCol(text, at) });
  const ws = () => {
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === 32 || c === 9 || c === 10 || c === 13) i++;
      else break;
    }
  };
  let err: JsonError | null = null;

  const value = (): boolean => {
    ws();
    if (i >= n) {
      err = fail('Unexpected end of input');
      return false;
    }
    const c = text[i];
    if (c === '{') return object();
    if (c === '[') return array();
    if (c === '"') return string();
    if (c === 't') return literal('true');
    if (c === 'f') return literal('false');
    if (c === 'n') return literal('null');
    if (c === '-' || (c >= '0' && c <= '9')) return number();
    err = fail(`Unexpected token '${c}'`);
    return false;
  };
  const literal = (word: string): boolean => {
    if (text.startsWith(word, i)) {
      i += word.length;
      return true;
    }
    err = fail(`Unexpected token '${text[i]}' (expected ${word})`);
    return false;
  };
  const number = (): boolean => {
    const start = i;
    if (text[i] === '-') i++;
    if (text[i] === '0') i++;
    else if (text[i] >= '1' && text[i] <= '9') while (i < n && text[i] >= '0' && text[i] <= '9') i++;
    else {
      err = fail('Invalid number');
      return false;
    }
    if (text[i] === '.') {
      i++;
      if (!(text[i] >= '0' && text[i] <= '9')) {
        err = fail('Digit expected after decimal point');
        return false;
      }
      while (i < n && text[i] >= '0' && text[i] <= '9') i++;
    }
    if (text[i] === 'e' || text[i] === 'E') {
      i++;
      if (text[i] === '+' || text[i] === '-') i++;
      if (!(text[i] >= '0' && text[i] <= '9')) {
        err = fail('Digit expected in exponent');
        return false;
      }
      while (i < n && text[i] >= '0' && text[i] <= '9') i++;
    }
    return i > start;
  };
  const string = (): boolean => {
    i++; // opening quote
    while (i < n) {
      const c = text[i];
      if (c === '"') {
        i++;
        return true;
      }
      if (c === '\\') {
        const e = text[i + 1];
        if ('"\\/bfnrt'.includes(e ?? '')) i += 2;
        else if (e === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) {
            err = fail('Bad unicode escape');
            return false;
          }
          i += 6;
        } else {
          err = fail(`Bad escape '\\${e ?? ''}'`);
          return false;
        }
      } else if (c.charCodeAt(0) < 0x20) {
        err = fail(c === '\n' ? 'Unterminated string (newline in string)' : 'Control character in string');
        return false;
      } else i++;
    }
    err = fail('Unterminated string');
    return false;
  };
  const array = (): boolean => {
    i++;
    ws();
    if (text[i] === ']') {
      i++;
      return true;
    }
    for (;;) {
      if (!value()) return false;
      ws();
      if (text[i] === ',') {
        const comma = i;
        i++;
        ws();
        if (text[i] === ']') {
          err = fail('Trailing comma in array', comma);
          return false;
        }
        continue;
      }
      if (text[i] === ']') {
        i++;
        return true;
      }
      err = fail(i >= n ? 'Unexpected end of input (unclosed array)' : `Expected ',' or ']' but found '${text[i]}'`);
      return false;
    }
  };
  const object = (): boolean => {
    i++;
    ws();
    if (text[i] === '}') {
      i++;
      return true;
    }
    let comma = -1;
    for (;;) {
      ws();
      if (text[i] !== '"') {
        if (text[i] === '}' && comma >= 0) err = fail('Trailing comma in object', comma);
        else err = fail(i >= n ? 'Unexpected end of input (unclosed object)' : 'Expected a double-quoted property name');
        return false;
      }
      if (!string()) return false;
      ws();
      if (text[i] !== ':') {
        err = fail(`Expected ':' after property name`);
        return false;
      }
      i++;
      if (!value()) return false;
      ws();
      if (text[i] === ',') {
        comma = i;
        i++;
        continue;
      }
      if (text[i] === '}') {
        i++;
        return true;
      }
      err = fail(i >= n ? 'Unexpected end of input (unclosed object)' : `Expected ',' or '}' but found '${text[i]}'`);
      return false;
    }
  };

  if (!value()) return err;
  ws();
  if (i < n) return fail(`Unexpected token '${text[i]}' after JSON value`);
  return null;
}

export function parseJson(text: string): ParseResult {
  if (text.trim() === '') return { ok: false, error: { message: 'Empty input', line: 1, col: 1, pos: 0 } };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    const error = validateJson(text) ?? { message: e instanceof Error ? e.message : String(e), line: 1, col: 1, pos: 0 };
    return { ok: false, error };
  }
}

export function sortKeysDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).sort()) out[k] = sortKeysDeep((v as Record<string, unknown>)[k]);
    return out;
  }
  return v;
}

export function formatJson(value: unknown, indent: number, sort: boolean): string {
  return JSON.stringify(sort ? sortKeysDeep(value) : value, null, indent);
}

export function minifyJson(value: unknown): string {
  return JSON.stringify(value);
}

// ── JSON → TypeScript ───────────────────────────────────────────────────────

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function pascal(name: string): string {
  const s = name
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return /^[A-Za-z_]/.test(s) ? s : `T${s}`;
}

function singular(name: string): string {
  if (/ies$/i.test(name)) return name.replace(/ies$/i, 'y');
  if (/(sses|xes|shes|ches)$/i.test(name)) return name.replace(/es$/i, '');
  if (/s$/i.test(name) && !/ss$/i.test(name)) return name.slice(0, -1);
  return name;
}

export function jsonToTypeScript(value: unknown, rootName = 'Root'): string {
  const out: string[] = [];
  const used = new Set<string>();
  const uniq = (base: string) => {
    let n = base || 'T';
    let k = 2;
    while (used.has(n)) n = `${base}${k++}`;
    used.add(n);
    return n;
  };

  const shapeOf = (objs: Record<string, unknown>[], name: string): string => {
    const iface = uniq(pascal(name));
    const keys: string[] = [];
    for (const o of objs) for (const k of Object.keys(o)) if (!keys.includes(k)) keys.push(k);
    const lines: string[] = [];
    for (const k of keys) {
      const present = objs.filter((o) => Object.prototype.hasOwnProperty.call(o, k));
      const t = unionOf(present.map((o) => o[k]), k);
      const opt = present.length < objs.length ? '?' : '';
      const key = IDENT.test(k) ? k : JSON.stringify(k);
      lines.push(`  ${key}${opt}: ${t};`);
    }
    out.push(`export interface ${iface} {\n${lines.join('\n')}\n}`);
    return iface;
  };

  const unionOf = (values: unknown[], name: string): string => {
    const prims = new Set<string>();
    const objs: Record<string, unknown>[] = [];
    const arrays: unknown[][] = [];
    for (const v of values) {
      if (v === null) prims.add('null');
      else if (Array.isArray(v)) arrays.push(v);
      else if (typeof v === 'object') objs.push(v as Record<string, unknown>);
      else prims.add(typeof v);
    }
    const parts: string[] = [...prims];
    if (objs.length) parts.push(shapeOf(objs, name));
    if (arrays.length) {
      const items = arrays.flat(1);
      const inner = items.length ? unionOf(items, singular(name)) : 'unknown';
      parts.push(inner.includes(' | ') ? `(${inner})[]` : `${inner}[]`);
    }
    if (!parts.length) return 'unknown';
    return parts.sort((a, b) => (a === 'null' ? 1 : b === 'null' ? -1 : 0)).join(' | ');
  };

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    shapeOf([value as Record<string, unknown>], rootName);
  } else {
    const t = unionOf([value], rootName);
    out.push(`export type ${uniq(pascal(rootName))} = ${t};`);
  }
  return out.reverse().join('\n\n') + '\n';
}

// ── JSON → CSV ──────────────────────────────────────────────────────────────

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function jsonToCsv(value: unknown): { ok: true; csv: string } | { ok: false; reason: string } {
  if (!Array.isArray(value)) return { ok: false, reason: 'CSV needs a top-level array (of objects or values).' };
  if (value.length === 0) return { ok: true, csv: '' };
  if (value.every((r) => r && typeof r === 'object' && !Array.isArray(r))) {
    const cols: string[] = [];
    for (const r of value as Record<string, unknown>[]) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
    const lines = [cols.map(csvCell).join(',')];
    for (const r of value as Record<string, unknown>[]) lines.push(cols.map((c) => csvCell(r[c])).join(','));
    return { ok: true, csv: lines.join('\n') };
  }
  if (value.every((r) => Array.isArray(r))) {
    return { ok: true, csv: (value as unknown[][]).map((r) => r.map(csvCell).join(',')).join('\n') };
  }
  return { ok: true, csv: value.map((v) => csvCell(v)).join('\n') };
}
