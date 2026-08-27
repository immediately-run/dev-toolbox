import { useMemo } from 'react';
import { useToolState } from '../hooks/useToolState';
import { diffLines, diffStats, sideBySide, splitLines, unifiedDiff } from '../lib/diff';
import Field from '../components/Field';
import Segmented from '../components/Segmented';
import CopyButton from '../components/CopyButton';

interface State {
  a: string;
  b: string;
  view: 'side' | 'unified';
  ignoreWs: boolean;
}

const SAMPLE_A = `function greet(name) {
  console.log("Hello, " + name);
}

greet("world");
greet("dev");
`;
const SAMPLE_B = `function greet(name, punct = "!") {
  console.log(\`Hello, \${name}\${punct}\`);
}

greet("world");
greet("toolbox", "?");
`;

function DiffTool() {
  const [s, set] = useToolState<State>('diff', { a: SAMPLE_A, b: SAMPLE_B, view: 'side', ignoreWs: false });

  const ops = useMemo(() => {
    const norm = (t: string) => (s.ignoreWs ? t.replace(/[ \t]+$/gm, '') : t);
    return diffLines(splitLines(norm(s.a)), splitLines(norm(s.b)));
  }, [s.a, s.b, s.ignoreWs]);
  const stats = useMemo(() => diffStats(ops), [ops]);
  const unified = useMemo(() => unifiedDiff(ops, 'original', 'changed'), [ops]);
  const rows = useMemo(() => sideBySide(ops), [ops]);
  const identical = stats.added === 0 && stats.removed === 0;

  return (
    <div className="tool">
      <div className="tool-head">
        <h2>Text diff</h2>
        <p>Line-level Myers diff. Paste the original on the left and the changed text on the right.</p>
      </div>
      <div className="grid2">
        <Field label="Original" value={s.a} onChange={(a) => set((p) => ({ ...p, a }))} rows={10} placeholder="Original text…" />
        <Field
          label="Changed"
          value={s.b}
          onChange={(b) => set((p) => ({ ...p, b }))}
          rows={10}
          placeholder="Changed text…"
          actions={
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => set((p) => ({ ...p, a: p.b, b: p.a }))}>
              ⇄ Swap
            </button>
          }
        />
      </div>
      <div className="bar">
        <Segmented<'side' | 'unified'>
          label="View"
          value={s.view}
          onChange={(view) => set((p) => ({ ...p, view }))}
          options={[
            { value: 'side', label: 'Side by side' },
            { value: 'unified', label: 'Unified' },
          ]}
        />
        <label className="chip" style={{ marginLeft: 4 }}>
          <input type="checkbox" checked={s.ignoreWs} onChange={(e) => set((p) => ({ ...p, ignoreWs: e.target.checked }))} />
          <span className={`box`} aria-hidden="true">{s.ignoreWs ? '✓' : ''}</span>
          Ignore trailing whitespace
        </label>
        <span className="sp" />
        <div className="diff-stats">
          <span className="add">+{stats.added}</span>
          <span className="del">−{stats.removed}</span>
          <span className="muted">{stats.unchanged} unchanged</span>
        </div>
        <CopyButton text={unified} label="Copy unified diff" />
      </div>
      {identical ? (
        <div className="note">The two texts are identical{s.ignoreWs ? ' (ignoring trailing whitespace)' : ''}.</div>
      ) : s.view === 'unified' ? (
        <pre className="out-body uni" style={{ maxHeight: 600 }}>
          {unified.split('\n').map((l, i) => {
            const cls = l.startsWith('+++') || l.startsWith('---') ? 'hdr' : l.startsWith('@@') ? 'hunk' : l.startsWith('+') ? 'add' : l.startsWith('-') ? 'del' : '';
            return (
              <span key={i} className={`l ${cls}`}>
                {l || ' '}
              </span>
            );
          })}
        </pre>
      ) : (
        <div className="tbl-wrap" style={{ maxHeight: 600, overflow: 'auto' }}>
          <table className="sbs">
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className={`n ${r.left ? r.left.kind : 'gap'}`}>{r.left?.n ?? ''}</td>
                  <td className={`lc ${r.left ? r.left.kind : 'gap'}`}>{r.left?.text ?? ''}</td>
                  <td className={`n ${r.right ? r.right.kind : 'gap'}`}>{r.right?.n ?? ''}</td>
                  <td className={r.right ? r.right.kind : 'gap'}>{r.right?.text ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DiffTool;
