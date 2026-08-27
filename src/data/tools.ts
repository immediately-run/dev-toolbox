// The tool registry: drives the sidebar, the picker and the ⌘K switcher.
export type ToolId = 'json' | 'regex' | 'encode' | 'hash' | 'diff' | 'generate' | 'text' | 'color' | 'chars';

export interface ToolMeta {
  id: ToolId;
  name: string;
  blurb: string;
  keywords: string[];
  /** Short mono glyph shown in the list. */
  glyph: string;
}

export const TOOLS: ToolMeta[] = [
  { id: 'json', name: 'JSON', blurb: 'Format, validate, tree, TypeScript, CSV', keywords: ['format', 'pretty', 'minify', 'validate', 'typescript', 'csv', 'tree'], glyph: '{ }' },
  { id: 'regex', name: 'Regex tester', blurb: 'Live matches, groups, replace', keywords: ['regexp', 'pattern', 'match', 'replace', 'groups'], glyph: '/•/' },
  { id: 'encode', name: 'Encode / decode', blurb: 'Base64, URL, HTML, hex, Unicode, JWT', keywords: ['base64', 'url', 'html', 'entities', 'hex', 'unicode', 'jwt', 'token'], glyph: '%2F' },
  { id: 'hash', name: 'Hashes', blurb: 'MD5, SHA-1/256/512, HMAC', keywords: ['md5', 'sha', 'sha256', 'hmac', 'digest', 'checksum'], glyph: '#' },
  { id: 'diff', name: 'Text diff', blurb: 'Line diff, unified and side-by-side', keywords: ['compare', 'patch', 'unified', 'myers'], glyph: '±' },
  { id: 'generate', name: 'Generators', blurb: 'UUID, passwords, lorem ipsum, timestamps', keywords: ['uuid', 'guid', 'password', 'random', 'lorem', 'timestamp', 'unix', 'epoch', 'date'], glyph: '∗' },
  { id: 'text', name: 'Text utils', blurb: 'Case, sort, dedupe, counts, trim', keywords: ['camel', 'snake', 'kebab', 'title', 'sort', 'dedupe', 'unique', 'count', 'words', 'trim'], glyph: 'Aa' },
  { id: 'color', name: 'Color', blurb: 'hex ↔ rgb ↔ hsl, WCAG contrast', keywords: ['hex', 'rgb', 'hsl', 'contrast', 'wcag', 'accessibility', 'palette'], glyph: '◐' },
  { id: 'chars', name: 'Character map', blurb: 'Arrows, math, box drawing, currency, Greek', keywords: ['unicode', 'symbol', 'arrow', 'greek', 'box', 'currency', 'copy'], glyph: '→' },
];

export const TOOL_BY_ID: Record<ToolId, ToolMeta> = Object.fromEntries(TOOLS.map((t) => [t.id, t])) as Record<ToolId, ToolMeta>;

export function searchTools(query: string): ToolMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOLS;
  const score = (t: ToolMeta) => {
    const name = t.name.toLowerCase();
    if (name.startsWith(q)) return 3;
    if (name.includes(q)) return 2;
    if (t.keywords.some((k) => k.startsWith(q))) return 1.5;
    if (t.keywords.some((k) => k.includes(q)) || t.blurb.toLowerCase().includes(q)) return 1;
    return 0;
  };
  return TOOLS.map((t) => [t, score(t)] as const)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);
}
