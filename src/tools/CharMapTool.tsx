import { useEffect, useMemo, useState } from 'react';
import { useToolState } from '../hooks/useToolState';
import { CHAR_GROUPS, codePointLabel, type CharEntry } from '../data/charMap';
import { copyText } from '../lib/clipboard';
import CopyButton from '../components/CopyButton';

interface State {
  query: string;
  group: string;
}

function CharMapTool() {
  const [s, set] = useToolState<State>('chars', { query: '', group: 'all' });
  const [sel, setSel] = useState<CharEntry | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [flash]);

  const items = useMemo(() => {
    const q = s.query.trim().toLowerCase();
    const groups = s.group === 'all' ? CHAR_GROUPS : CHAR_GROUPS.filter((g) => g.id === s.group);
    const out: (CharEntry & { group: string })[] = [];
    for (const g of groups) {
      for (const c of g.chars) {
        if (!q || c.name.includes(q) || c.ch === q || codePointLabel(c.ch).toLowerCase().includes(q)) out.push({ ...c, group: g.name });
      }
    }
    return out;
  }, [s.query, s.group]);

  const pick = async (c: CharEntry) => {
    setSel(c);
    if (await copyText(c.ch)) setFlash(c.ch);
  };

  return (
    <div className="tool">
      <div className="tool-head">
        <h2>Character map</h2>
        <p>Click any glyph to copy it. Search by name or code point.</p>
      </div>
      <div className="colorrow">
        <input className="in mono" value={s.query} onChange={(e) => set((p) => ({ ...p, query: e.target.value }))} placeholder="search: arrow, sigma, U+2192, double…" aria-label="Search characters" />
        <button type="button" className="btn btn-ghost btn-sm" disabled={!s.query} onClick={() => set((p) => ({ ...p, query: '' }))}>
          Clear
        </button>
      </div>
      <div className="groups">
        <button type="button" className={`tag btn-like${s.group === 'all' ? ' pass' : ''}`} onClick={() => set((p) => ({ ...p, group: 'all' }))}>
          All
        </button>
        {CHAR_GROUPS.map((g) => (
          <button key={g.id} type="button" className={`tag btn-like${s.group === g.id ? ' pass' : ''}`} onClick={() => set((p) => ({ ...p, group: g.id }))}>
            {g.name}
          </button>
        ))}
      </div>
      <div className="charinfo">
        {sel ? (
          <>
            <span className="big">{sel.ch}</span>
            <span>
              <b style={{ color: 'var(--ink)' }}>{sel.name}</b>
              <br />
              {codePointLabel(sel.ch)} · HTML {Array.from(sel.ch, (c) => `&#x${(c.codePointAt(0) as number).toString(16).toUpperCase()};`).join('')} · JS{' '}
              {Array.from(sel.ch, (c) => `\\u{${(c.codePointAt(0) as number).toString(16)}}`).join('')}
            </span>
            <CopyButton text={sel.ch} />
          </>
        ) : (
          <span className="muted">Select a character to see its name and code point.</span>
        )}
      </div>
      <div className="chars">
        {items.map((c, i) => (
          <button key={`${c.ch}-${i}`} type="button" className={flash === c.ch ? 'copied' : ''} title={`${c.name} (${codePointLabel(c.ch)})`} onClick={() => void pick(c)}>
            {c.ch.trim() === '' ? '␣' : c.ch}
          </button>
        ))}
      </div>
      {items.length === 0 && <div className="muted">No characters match “{s.query}”.</div>}
      <div className="muted small">{items.length} characters</div>
    </div>
  );
}

export default CharMapTool;
