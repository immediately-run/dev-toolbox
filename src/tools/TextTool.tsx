import { useMemo, useState } from 'react';
import { useToolState } from '../hooks/useToolState';
import {
  countText, dedupeLines, numberLines, perLine, removeEmptyLines, reverseLines, shuffleLines, sortLines,
  toCamel, toConstant, toDot, toKebab, toPascal, toSentence, toSnake, toTitle, trimLines, trimTrailing,
} from '../lib/text';
import Field from '../components/Field';
import Output from '../components/Output';
import Check from '../components/Check';

interface State {
  input: string;
  caseInsensitive: boolean;
}

type Op = { name: string; run: (s: string, ci: boolean) => string };

const CASES: Op[] = [
  { name: 'camelCase', run: (s) => perLine(s, toCamel) },
  { name: 'PascalCase', run: (s) => perLine(s, toPascal) },
  { name: 'snake_case', run: (s) => perLine(s, toSnake) },
  { name: 'kebab-case', run: (s) => perLine(s, toKebab) },
  { name: 'CONSTANT_CASE', run: (s) => perLine(s, toConstant) },
  { name: 'dot.case', run: (s) => perLine(s, toDot) },
  { name: 'Title Case', run: (s) => perLine(s, toTitle) },
  { name: 'Sentence case', run: (s) => perLine(s, toSentence) },
  { name: 'UPPER', run: (s) => s.toUpperCase() },
  { name: 'lower', run: (s) => s.toLowerCase() },
];

const LINES: Op[] = [
  { name: 'Sort A→Z', run: (s, ci) => sortLines(s, 'asc', { caseInsensitive: ci }) },
  { name: 'Sort Z→A', run: (s, ci) => sortLines(s, 'desc', { caseInsensitive: ci }) },
  { name: 'Dedupe', run: (s, ci) => dedupeLines(s, { caseInsensitive: ci }) },
  { name: 'Reverse', run: (s) => reverseLines(s) },
  { name: 'Shuffle', run: (s) => shuffleLines(s) },
  { name: 'Remove empty lines', run: (s) => removeEmptyLines(s) },
  { name: 'Trim trailing whitespace', run: (s) => trimTrailing(s) },
  { name: 'Trim both ends', run: (s) => trimLines(s) },
  { name: 'Number lines', run: (s) => numberLines(s) },
];

function TextTool() {
  const [s, set] = useToolState<State>('text', { input: 'hello world\nDev Toolbox\nimmediately run\nhello world\n  trailing spaces   ', caseInsensitive: true });
  const [op, setOp] = useState<Op | null>(null);
  const output = useMemo(() => (op ? op.run(s.input, s.caseInsensitive) : ''), [op, s.input, s.caseInsensitive]);
  const counts = useMemo(() => countText(s.input), [s.input]);

  return (
    <div className="tool">
      <div className="tool-head">
        <h2>Text utils</h2>
        <p>Case conversion, line operations and counts. Pick an operation; the result updates as you type.</p>
      </div>
      <div className="counts">
        {(
          [
            ['characters', counts.chars],
            ['without spaces', counts.charsNoSpaces],
            ['words', counts.words],
            ['lines', counts.lines],
            ['sentences', counts.sentences],
            ['paragraphs', counts.paragraphs],
            ['UTF-8 bytes', counts.bytes],
          ] as [string, number][]
        ).map(([k, v]) => (
          <div className="c" key={k}>
            <b>{v.toLocaleString()}</b>
            <span>{k}</span>
          </div>
        ))}
      </div>
      <div className="grid2">
        <Field label="Input" value={s.input} onChange={(input) => set((p) => ({ ...p, input }))} rows={12} placeholder="Paste text…" />
        <Output
          label={op ? `Output · ${op.name}` : 'Output'}
          value={output}
          wrap
          empty="Pick an operation below."
          actions={
            <button type="button" className="btn btn-ghost btn-sm" disabled={!output || output === s.input} onClick={() => set((p) => ({ ...p, input: output }))}>
              ← Replace input
            </button>
          }
        />
      </div>
      <section>
        <h3>Case</h3>
        <div className="bar">
          {CASES.map((c) => (
            <button key={c.name} type="button" className={`btn btn-sm ${op?.name === c.name ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOp(c)}>
              {c.name}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3>Lines</h3>
        <div className="bar">
          {LINES.map((c) => (
            <button key={c.name} type="button" className={`btn btn-sm ${op?.name === c.name ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOp(c)}>
              {c.name}
            </button>
          ))}
          <Check label="Case-insensitive sort/dedupe" checked={s.caseInsensitive} onChange={(caseInsensitive) => set((p) => ({ ...p, caseInsensitive }))} />
        </div>
      </section>
    </div>
  );
}

export default TextTool;
