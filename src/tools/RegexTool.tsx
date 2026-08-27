import { useMemo, type ReactNode } from 'react';
import { useToolState } from '../hooks/useToolState';
import { compileRegex, findMatches, replacePreview, type MatchInfo } from '../lib/regex';
import { REGEX_RECIPES, REGEX_TOKENS } from '../data/regexCheatSheet';
import Field from '../components/Field';
import Output from '../components/Output';
import Check from '../components/Check';

interface State {
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
}

const FLAGS: [string, string][] = [
  ['g', 'global'],
  ['i', 'ignore case'],
  ['m', 'multiline'],
  ['s', 'dotAll'],
  ['u', 'unicode'],
];

function highlight(text: string, matches: MatchInfo[]): ReactNode[] {
  const out: ReactNode[] = [];
  let pos = 0;
  matches.forEach((m, i) => {
    if (m.index > pos) out.push(text.slice(pos, m.index));
    out.push(
      <mark key={i} className={m.text === '' ? 'empty' : ''} title={`match ${i + 1} @ ${m.index}`}>
        {m.text}
      </mark>,
    );
    pos = Math.max(pos, m.end);
  });
  if (pos < text.length) out.push(text.slice(pos));
  return out;
}

function RegexTool() {
  const [s, set] = useToolState<State>('regex', {
    pattern: '(?<user>[\\w.+-]+)@(?<host>[\\w-]+\\.[\\w.-]+)',
    flags: 'g',
    text: 'Contact ada@example.com or grace.h+dev@mail.co.uk today.',
    replacement: '<$<user> at $<host>>',
  });

  const compiled = useMemo(() => compileRegex(s.pattern, s.flags), [s.pattern, s.flags]);
  const matches = useMemo(() => (compiled.ok && s.pattern ? findMatches(compiled.re, s.text) : []), [compiled, s.pattern, s.text]);
  const replaced = useMemo(() => (compiled.ok && s.pattern ? replacePreview(compiled.re, s.text, s.replacement) : s.text), [compiled, s.pattern, s.text, s.replacement]);
  const groupCount = matches.reduce((n, m) => Math.max(n, m.groups.length), 0);
  const namedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const m of matches) for (const k of Object.keys(m.named)) keys.add(k);
    return [...keys];
  }, [matches]);

  const toggleFlag = (f: string, on: boolean) => set((p) => ({ ...p, flags: on ? (p.flags.includes(f) ? p.flags : p.flags + f) : p.flags.replace(f, '') }));

  return (
    <div className="tool">
      <div className="tool-head">
        <h2>Regex tester</h2>
        <p>JavaScript flavour. Matches highlight live; groups and replacements below.</p>
      </div>
      <section>
        <div className="field">
          <div className="field-bar">
            <span className="lbl">Pattern</span>
            <span className="acts">{compiled.ok && s.pattern ? <span className="ok">{matches.length} match{matches.length === 1 ? '' : 'es'}</span> : null}</span>
          </div>
          <div className="colorrow">
            <span className="mono muted">/</span>
            <input className="in mono" value={s.pattern} onChange={(e) => set((p) => ({ ...p, pattern: e.target.value }))} placeholder="pattern" spellCheck={false} aria-label="Pattern" />
            <span className="mono muted">/{s.flags}</span>
          </div>
          {!compiled.ok && <div className="err">{compiled.error}</div>}
        </div>
        <div className="bar">
          {FLAGS.map(([f, name]) => (
            <Check key={f} label={`${f} · ${name}`} checked={s.flags.includes(f)} onChange={(on) => toggleFlag(f, on)} />
          ))}
        </div>
      </section>
      <div className="grid2">
        <Field label="Test text" value={s.text} onChange={(text) => set((p) => ({ ...p, text }))} rows={8} placeholder="Text to search…" />
        <Output label="Matches highlighted" value={s.text} empty="Type some text.">
          {s.text ? <div className="hl mono">{highlight(s.text, matches)}</div> : undefined}
        </Output>
      </div>
      {matches.length > 0 && (
        <section>
          <h3>Match groups</h3>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>index</th>
                  <th>match</th>
                  {Array.from({ length: groupCount }, (_, i) => (
                    <th key={i}>${i + 1}</th>
                  ))}
                  {namedKeys.map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matches.slice(0, 200).map((m, i) => (
                  <tr key={i}>
                    <td className="num">{i + 1}</td>
                    <td className="num">{m.index}</td>
                    <td>{JSON.stringify(m.text)}</td>
                    {Array.from({ length: groupCount }, (_, g) => (
                      <td key={g}>{m.groups[g] === undefined ? <span className="muted">–</span> : JSON.stringify(m.groups[g])}</td>
                    ))}
                    {namedKeys.map((k) => (
                      <td key={k}>{m.named[k] === undefined ? <span className="muted">–</span> : JSON.stringify(m.named[k])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {matches.length > 200 && <span className="muted">Showing the first 200 of {matches.length}.</span>}
        </section>
      )}
      <div className="grid2">
        <Field label="Replacement ($1, $<name>, $&)" value={s.replacement} onChange={(replacement) => set((p) => ({ ...p, replacement }))} rows={3} />
        <Output label="Replace preview" value={replaced} wrap empty="—" />
      </div>
      <details className="cheat">
        <summary>Cheat sheet</summary>
        <div className="recipes">
          {REGEX_RECIPES.map((r) => (
            <button key={r.name} type="button" className="tag btn-like" onClick={() => set((p) => ({ ...p, pattern: r.pattern, flags: r.flags, text: r.sample }))}>
              {r.name}
            </button>
          ))}
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <tbody>
              {REGEX_TOKENS.map(([tok, desc]) => (
                <tr key={tok}>
                  <td style={{ whiteSpace: 'nowrap' }}>{tok}</td>
                  <td style={{ fontFamily: 'var(--sans)' }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export default RegexTool;
