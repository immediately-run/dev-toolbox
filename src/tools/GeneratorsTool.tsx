import { useEffect, useMemo, useState } from 'react';
import { useToolState } from '../hooks/useToolState';
import { generatePassword, lorem, parseTime, passwordEntropyBits, uuidV4, type LoremUnit, type PasswordOptions } from '../lib/generators';
import CopyButton from '../components/CopyButton';
import Check from '../components/Check';
import Segmented from '../components/Segmented';
import Output from '../components/Output';

interface State {
  uuidCount: number;
  uuids: string[];
  pw: PasswordOptions;
  password: string;
  loremCount: number;
  loremUnit: LoremUnit;
  loremClassic: boolean;
  loremText: string;
  timeInput: string;
}

function GeneratorsTool() {
  const [s, set] = useToolState<State>('generate', {
    uuidCount: 5,
    uuids: [],
    pw: { length: 20, lower: true, upper: true, digits: true, symbols: true, excludeAmbiguous: false },
    password: '',
    loremCount: 3,
    loremUnit: 'paragraphs',
    loremClassic: true,
    loremText: '',
    timeInput: '',
  });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = useMemo(() => parseTime(s.timeInput, now), [s.timeInput, now]);
  const entropy = passwordEntropyBits(s.pw);

  const genUuids = () => set((p) => ({ ...p, uuids: Array.from({ length: Math.max(1, Math.min(100, p.uuidCount)) }, uuidV4) }));
  const genPw = () => set((p) => ({ ...p, password: generatePassword(p.pw) }));
  const genLorem = () => set((p) => ({ ...p, loremText: lorem(p.loremCount, p.loremUnit, p.loremClassic) }));
  const setPw = (patch: Partial<PasswordOptions>) => set((p) => ({ ...p, pw: { ...p.pw, ...patch } }));

  return (
    <div className="tool">
      <div className="tool-head">
        <h2>Generators</h2>
        <p>UUIDs, passwords and filler text from crypto.getRandomValues; timestamps either way.</p>
      </div>

      <section>
        <h3>UUID v4</h3>
        <div className="bar">
          <label className="inline">
            Count
            <input className="in sm num mono" type="number" min={1} max={100} value={s.uuidCount} onChange={(e) => set((p) => ({ ...p, uuidCount: Number(e.target.value) || 1 }))} />
          </label>
          <button type="button" className="btn btn-primary" onClick={genUuids}>
            Generate
          </button>
          <CopyButton text={s.uuids.join('\n')} label="Copy all" small={false} />
        </div>
        {s.uuids.length > 0 && (
          <div className="uuid-list">
            {s.uuids.map((u, i) => (
              <div className="row" key={i}>
                <code>{u}</code>
                <CopyButton text={u} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3>Password</h3>
        <div className="bar">
          <label className="inline" style={{ flex: '1 1 220px' }}>
            Length <b className="mono">{s.pw.length}</b>
            <input type="range" min={6} max={64} value={s.pw.length} onChange={(e) => setPw({ length: Number(e.target.value) })} aria-label="Password length" />
          </label>
        </div>
        <div className="bar">
          <Check label="a–z" checked={s.pw.lower} onChange={(lower) => setPw({ lower })} />
          <Check label="A–Z" checked={s.pw.upper} onChange={(upper) => setPw({ upper })} />
          <Check label="0–9" checked={s.pw.digits} onChange={(digits) => setPw({ digits })} />
          <Check label="!@#$%" checked={s.pw.symbols} onChange={(symbols) => setPw({ symbols })} />
          <Check label="No ambiguous (O0Il1|)" checked={s.pw.excludeAmbiguous} onChange={(excludeAmbiguous) => setPw({ excludeAmbiguous })} />
        </div>
        <div className="bar">
          <button type="button" className="btn btn-primary" onClick={genPw} disabled={!(s.pw.lower || s.pw.upper || s.pw.digits || s.pw.symbols)}>
            Generate password
          </button>
          <CopyButton text={s.password} small={false} />
          <span className="muted mono small">≈ {entropy} bits of entropy</span>
        </div>
        {s.password && <div className="pw">{s.password}</div>}
      </section>

      <section>
        <h3>Lorem ipsum</h3>
        <div className="bar">
          <input className="in sm num mono" type="number" min={1} max={200} value={s.loremCount} onChange={(e) => set((p) => ({ ...p, loremCount: Number(e.target.value) || 1 }))} aria-label="Amount" />
          <Segmented<LoremUnit>
            label="Unit"
            value={s.loremUnit}
            onChange={(loremUnit) => set((p) => ({ ...p, loremUnit }))}
            options={[
              { value: 'paragraphs', label: 'Paragraphs' },
              { value: 'sentences', label: 'Sentences' },
              { value: 'words', label: 'Words' },
            ]}
          />
          <Check label="Start with “Lorem ipsum…”" checked={s.loremClassic} onChange={(loremClassic) => set((p) => ({ ...p, loremClassic }))} />
          <button type="button" className="btn btn-primary" onClick={genLorem}>
            Generate text
          </button>
        </div>
        {s.loremText && <Output label="Text" value={s.loremText} wrap maxHeight={300} />}
      </section>

      <section>
        <h3>Timestamp converter</h3>
        <div className="now">
          <span>
            now <b>{Math.floor(now / 1000)}</b> s
          </span>
          <span>
            <b>{now}</b> ms
          </span>
          <span>
            <b>{new Date(now).toISOString()}</b>
          </span>
          <CopyButton text={String(Math.floor(now / 1000))} label="Copy seconds" />
        </div>
        <div className="colorrow">
          <input
            className="in mono"
            value={s.timeInput}
            onChange={(e) => set((p) => ({ ...p, timeInput: e.target.value }))}
            placeholder="1756288000 · 1756288000000 · 2026-08-27T12:00:00Z · Aug 27 2026 · now"
            spellCheck={false}
            aria-label="Timestamp or date"
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => set((p) => ({ ...p, timeInput: String(Math.floor(Date.now() / 1000)) }))}>
            Now
          </button>
        </div>
        {'error' in time ? (
          <div className="err">{time.error}</div>
        ) : (
          <div className="kv">
            <span className="k">read as</span>
            <span className="v">{time.interpretedAs}</span>
            <span />
            {(
              [
                ['unix seconds', String(time.unixSeconds)],
                ['unix millis', String(time.unixMillis)],
                ['ISO 8601', time.iso],
                ['UTC', time.utc],
                ['local', time.local],
                ['relative', time.relative],
              ] as [string, string][]
            ).map(([k, v]) => (
              <span key={k} style={{ display: 'contents' }}>
                <span className="k">{k}</span>
                <span className="v">{v}</span>
                <CopyButton text={v} />
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default GeneratorsTool;
