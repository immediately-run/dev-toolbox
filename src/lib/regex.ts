// Regex tester helpers: safe compilation, match iteration (zero-length safe),
// and a replace preview that honours the user's own flags.

export interface MatchInfo {
  index: number;
  end: number;
  text: string;
  groups: (string | undefined)[];
  named: Record<string, string | undefined>;
}

export type CompileResult = { ok: true; re: RegExp } | { ok: false; error: string };

export function compileRegex(pattern: string, flags: string): CompileResult {
  try {
    return { ok: true, re: new RegExp(pattern, flags) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** All matches (or the first one when `g` is absent), capped. */
export function findMatches(re: RegExp, text: string, limit = 2000): MatchInfo[] {
  const out: MatchInfo[] = [];
  const global = re.flags.includes('g');
  const iter = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m: RegExpExecArray | null;
  while ((m = iter.exec(text)) !== null) {
    out.push({
      index: m.index,
      end: m.index + m[0].length,
      text: m[0],
      groups: m.slice(1),
      named: m.groups ? { ...m.groups } : {},
    });
    if (m[0].length === 0) iter.lastIndex++;
    if (!global || out.length >= limit) break;
  }
  return out;
}

export function replacePreview(re: RegExp, text: string, replacement: string): string {
  try {
    return text.replace(re, replacement);
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
