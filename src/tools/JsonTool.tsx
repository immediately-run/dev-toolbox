import { useMemo, useRef } from 'react';
import { useToolState } from '../hooks/useToolState';
import { formatJson, jsonToCsv, jsonToTypeScript, minifyJson, parseJson } from '../lib/json';
import Field from '../components/Field';
import Output from '../components/Output';
import Segmented from '../components/Segmented';
import Check from '../components/Check';
import JsonTree from '../components/JsonTree';

type View = 'format' | 'minify' | 'tree' | 'ts' | 'csv';

interface State {
  input: string;
  indent: 2 | 4;
  sort: boolean;
  view: View;
  rootName: string;
}

const SAMPLE = `{
  "name": "dev-toolbox",
  "version": "1.0.0",
  "private": true,
  "tags": ["json", "regex", "hash"],
  "author": { "login": "ada", "id": 42 },
  "releases": [
    { "tag": "v1.0.0", "date": "2026-08-27", "stable": true },
    { "tag": "v1.1.0-beta", "date": "2026-09-10", "notes": "beta" }
  ]
}`;

function JsonTool() {
  const [s, set] = useToolState<State>('json', { input: '', indent: 2, sort: false, view: 'format', rootName: 'Root' });
  const ta = useRef<HTMLTextAreaElement>(null);

  const parsed = useMemo(() => parseJson(s.input), [s.input]);

  const output = useMemo(() => {
    if (!parsed.ok) return '';
    switch (s.view) {
      case 'format':
        return formatJson(parsed.value, s.indent, s.sort);
      case 'minify':
        return minifyJson(s.sort ? JSON.parse(formatJson(parsed.value, 0, true)) : parsed.value);
      case 'ts':
        return jsonToTypeScript(parsed.value, s.rootName || 'Root');
      case 'csv': {
        const r = jsonToCsv(parsed.value);
        return r.ok ? r.csv : '';
      }
      default:
        return '';
    }
  }, [parsed, s.view, s.indent, s.sort, s.rootName]);

  const csvError = useMemo(() => {
    if (s.view !== 'csv' || !parsed.ok) return null;
    const r = jsonToCsv(parsed.value);
    return r.ok ? null : r.reason;
  }, [parsed, s.view]);

  const describe = () => {
    if (!parsed.ok) return null;
    const v = parsed.value;
    if (Array.isArray(v)) return `array · ${v.length} item${v.length === 1 ? '' : 's'}`;
    if (v && typeof v === 'object') return `object · ${Object.keys(v).length} key${Object.keys(v).length === 1 ? '' : 's'}`;
    return typeof v;
  };

  const jump = () => {
    if (parsed.ok || !ta.current) return;
    ta.current.focus();
    ta.current.setSelectionRange(parsed.error.pos, Math.min(s.input.length, parsed.error.pos + 1));
  };

  return (
    <div className="tool">
      <div className="tool-head">
        <h2>JSON</h2>
        <p>Format, validate, browse as a tree, or turn it into TypeScript or CSV.</p>
      </div>
      <div className="grid2">
        <Field
          label="Input"
          value={s.input}
          onChange={(input) => set((p) => ({ ...p, input }))}
          placeholder="Paste JSON…"
          rows={16}
          textareaRef={ta}
          actions={
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set((p) => ({ ...p, input: SAMPLE }))}>
                Sample
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set((p) => ({ ...p, input: '' }))} disabled={!s.input}>
                Clear
              </button>
            </>
          }
        />
        <div className="tool" style={{ gap: 10 }}>
          <div className="bar">
            <Segmented<View>
              label="Output"
              value={s.view}
              onChange={(view) => set((p) => ({ ...p, view }))}
              options={[
                { value: 'format', label: 'Format' },
                { value: 'minify', label: 'Minify' },
                { value: 'tree', label: 'Tree' },
                { value: 'ts', label: 'TypeScript' },
                { value: 'csv', label: 'CSV' },
              ]}
            />
          </div>
          <div className="bar">
            {s.view === 'format' && (
              <Segmented<'2' | '4'>
                label="Indent"
                value={String(s.indent) as '2' | '4'}
                onChange={(v) => set((p) => ({ ...p, indent: v === '4' ? 4 : 2 }))}
                options={[
                  { value: '2', label: '2 spaces' },
                  { value: '4', label: '4 spaces' },
                ]}
              />
            )}
            {(s.view === 'format' || s.view === 'minify') && <Check label="Sort keys" checked={s.sort} onChange={(sort) => set((p) => ({ ...p, sort }))} />}
            {s.view === 'ts' && (
              <label className="inline">
                Root name
                <input className="in sm mono" style={{ width: 120 }} value={s.rootName} onChange={(e) => set((p) => ({ ...p, rootName: e.target.value }))} />
              </label>
            )}
          </div>
          <div className="status">
            {s.input.trim() === '' ? (
              <span className="muted">Waiting for input.</span>
            ) : parsed.ok ? (
              <span className="ok">✓ Valid JSON · {describe()}</span>
            ) : (
              <>
                <span className="bad">
                  ✕ Line {parsed.error.line}, column {parsed.error.col}: {parsed.error.message}
                </span>
                <button type="button" className="link" onClick={jump}>
                  jump to it
                </button>
              </>
            )}
          </div>
          {s.view === 'tree' ? (
            <Output label="Tree" value={parsed.ok ? formatJson(parsed.value, 2, false) : ''} empty="Valid JSON shows here as a collapsible tree.">
              {parsed.ok ? <JsonTree value={parsed.value} /> : undefined}
            </Output>
          ) : (
            <Output
              label={s.view === 'ts' ? 'interfaces.ts' : s.view === 'csv' ? 'output.csv' : 'Output'}
              value={output}
              error={csvError}
              wrap={s.view === 'minify'}
              empty={parsed.ok ? 'Nothing to show.' : 'Fix the input to see output.'}
              actions={
                s.view === 'format' || s.view === 'minify' ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => set((p) => ({ ...p, input: output }))} disabled={!output || output === s.input}>
                    Use as input
                  </button>
                ) : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default JsonTool;
