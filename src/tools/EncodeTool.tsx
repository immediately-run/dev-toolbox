import { useEffect, useMemo, useState } from 'react';
import { useToolState } from '../hooks/useToolState';
import {
  base64Decode, base64Encode, decodeJwt, hexDecode, hexEncode, htmlDecode, htmlEncode,
  unicodeEscape, unicodeUnescape, urlDecode, urlEncode, type JwtDecoded,
} from '../lib/encode';
import { relativeTime } from '../lib/generators';
import Field from '../components/Field';
import Output from '../components/Output';
import Segmented from '../components/Segmented';
import Check from '../components/Check';
import JsonTree from '../components/JsonTree';

type Mode = 'base64' | 'url' | 'html' | 'hex' | 'unicode' | 'jwt';

interface State {
  mode: Mode;
  input: string;
  urlSafe: boolean;
  component: boolean;
  allNonAscii: boolean;
  hexSpaced: boolean;
  allChars: boolean;
}

type Attempt = { ok: true; value: string } | { ok: false; error: string };
const attempt = (f: () => string): Attempt => {
  try {
    return { ok: true, value: f() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
};

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTc4NzgyNDAwMCwiZXhwIjoxODE5MzYwMDAwfQ.Xw6dXvIrzYzQ0ZQb3nX1xWzq7B5x2T2i5c7c9m3O0Jk';

function EncodeTool() {
  const [s, set] = useToolState<State>('encode', {
    mode: 'base64',
    input: 'Hello, immediately.run → ⌘K',
    urlSafe: false,
    component: true,
    allNonAscii: false,
    hexSpaced: true,
    allChars: false,
  });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (s.mode !== 'jwt') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [s.mode]);

  const encoded = useMemo<Attempt>(() => {
    switch (s.mode) {
      case 'base64':
        return attempt(() => base64Encode(s.input, s.urlSafe));
      case 'url':
        return attempt(() => urlEncode(s.input, s.component));
      case 'html':
        return attempt(() => htmlEncode(s.input, s.allNonAscii));
      case 'hex':
        return attempt(() => hexEncode(s.input, s.hexSpaced ? ' ' : ''));
      case 'unicode':
        return attempt(() => unicodeEscape(s.input, s.allChars));
      default:
        return { ok: true, value: '' };
    }
  }, [s]);

  const decoded = useMemo<Attempt>(() => {
    switch (s.mode) {
      case 'base64':
        return attempt(() => base64Decode(s.input));
      case 'url':
        return attempt(() => urlDecode(s.input, s.component));
      case 'html':
        return attempt(() => htmlDecode(s.input));
      case 'hex':
        return attempt(() => hexDecode(s.input));
      case 'unicode':
        return attempt(() => unicodeUnescape(s.input));
      default:
        return { ok: true, value: '' };
    }
  }, [s]);

  const jwt = useMemo<{ ok: true; value: JwtDecoded } | { ok: false; error: string } | null>(() => {
    if (s.mode !== 'jwt') return null;
    if (!s.input.trim()) return null;
    try {
      return { ok: true, value: decodeJwt(s.input) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }, [s.mode, s.input]);

  const swap = (a: Attempt) => {
    if (a.ok && a.value) set((p) => ({ ...p, input: a.value }));
  };

  return (
    <div className="tool">
      <div className="tool-head">
        <h2>Encode / decode</h2>
        <p>Both directions at once — paste either form and read the other.</p>
      </div>
      <div className="bar">
        <Segmented<Mode>
          label="Codec"
          value={s.mode}
          onChange={(mode) => set((p) => ({ ...p, mode }))}
          options={[
            { value: 'base64', label: 'Base64' },
            { value: 'url', label: 'URL' },
            { value: 'html', label: 'HTML entities' },
            { value: 'hex', label: 'Hex' },
            { value: 'unicode', label: 'Unicode escapes' },
            { value: 'jwt', label: 'JWT' },
          ]}
        />
      </div>
      <div className="bar">
        {s.mode === 'base64' && <Check label="URL-safe alphabet (-_ no padding)" checked={s.urlSafe} onChange={(urlSafe) => set((p) => ({ ...p, urlSafe }))} />}
        {s.mode === 'url' && (
          <Segmented<'component' | 'uri'>
            label="URL mode"
            value={s.component ? 'component' : 'uri'}
            onChange={(v) => set((p) => ({ ...p, component: v === 'component' }))}
            options={[
              { value: 'component', label: 'Component (encode everything)' },
              { value: 'uri', label: 'Whole URI (keep :/?#&=)' },
            ]}
          />
        )}
        {s.mode === 'html' && <Check label="Escape all non-ASCII as &#x…;" checked={s.allNonAscii} onChange={(allNonAscii) => set((p) => ({ ...p, allNonAscii }))} />}
        {s.mode === 'hex' && <Check label="Space between bytes" checked={s.hexSpaced} onChange={(hexSpaced) => set((p) => ({ ...p, hexSpaced }))} />}
        {s.mode === 'unicode' && <Check label="Escape ASCII too" checked={s.allChars} onChange={(allChars) => set((p) => ({ ...p, allChars }))} />}
        {s.mode === 'jwt' && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => set((p) => ({ ...p, input: SAMPLE_JWT }))}>
            Sample token
          </button>
        )}
      </div>
      {s.mode === 'jwt' ? (
        <>
          <Field label="Token" value={s.input} onChange={(input) => set((p) => ({ ...p, input }))} rows={5} placeholder="eyJhbGciOi…" />
          {jwt && !jwt.ok && <div className="err">{jwt.error}</div>}
          {jwt?.ok && (
            <>
              <div className="note">Decoded only — the signature is <b>not</b> verified (that needs the secret or public key, which never leaves your server).</div>
              {jwt.value.claims.length > 0 && (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>claim</th>
                        <th>value</th>
                        <th>date</th>
                        <th>relative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jwt.value.claims.map((c) => {
                        const expired = c.name === 'exp' && c.date.getTime() < now;
                        return (
                          <tr key={c.name}>
                            <td>{c.name}</td>
                            <td>{c.value}</td>
                            <td>{c.date.toISOString()}</td>
                            <td className={expired ? 'bad' : ''} style={expired ? { color: 'var(--accent-pink)' } : undefined}>
                              {c.name === 'exp' ? (expired ? `expired ${relativeTime(c.date, now)}` : `expires ${relativeTime(c.date, now)}`) : relativeTime(c.date, now)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="grid2">
                <Output label="Header" value={JSON.stringify(jwt.value.header, null, 2)}>
                  <JsonTree value={jwt.value.header} />
                </Output>
                <Output label="Payload" value={JSON.stringify(jwt.value.payload, null, 2)}>
                  <JsonTree value={jwt.value.payload} />
                </Output>
              </div>
              <Output label="Signature (base64url)" value={jwt.value.signature} wrap empty="No signature part." />
            </>
          )}
        </>
      ) : (
        <>
          <Field label="Input" value={s.input} onChange={(input) => set((p) => ({ ...p, input }))} rows={6} placeholder="Text, or an encoded string…" />
          <div className="grid2">
            <Output
              label="Encoded"
              value={encoded.ok ? encoded.value : ''}
              error={encoded.ok ? null : encoded.error}
              wrap
              actions={
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => swap(encoded)} disabled={!encoded.ok || !encoded.value}>
                  ↑ Use as input
                </button>
              }
            />
            <Output
              label="Decoded"
              value={decoded.ok ? decoded.value : ''}
              error={decoded.ok ? null : `Can't decode: ${decoded.error}`}
              wrap
              actions={
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => swap(decoded)} disabled={!decoded.ok || !decoded.value}>
                  ↑ Use as input
                </button>
              }
            />
          </div>
        </>
      )}
    </div>
  );
}

export default EncodeTool;
