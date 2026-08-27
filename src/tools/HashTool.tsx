import { useEffect, useMemo, useState } from 'react';
import { useToolState } from '../hooks/useToolState';
import { md5 } from '../lib/md5';
import { hmacSha256, sha, subtleAvailable, type ShaAlgorithm } from '../lib/hash';
import { utf8Bytes } from '../lib/encode';
import Field from '../components/Field';
import Check from '../components/Check';
import CopyButton from '../components/CopyButton';

interface State {
  input: string;
  key: string;
  upper: boolean;
}

const ALGS: ShaAlgorithm[] = ['SHA-1', 'SHA-256', 'SHA-512'];

function HashTool() {
  const [s, set] = useToolState<State>('hash', { input: 'The quick brown fox jumps over the lazy dog', key: '', upper: false });
  const [digests, setDigests] = useState<Record<string, string>>({});
  const hasSubtle = useMemo(() => subtleAvailable(), []);
  const bytes = useMemo(() => utf8Bytes(s.input), [s.input]);
  const md5Hex = useMemo(() => md5(bytes), [bytes]);

  useEffect(() => {
    if (!hasSubtle) return;
    let alive = true;
    const run = async () => {
      const out: Record<string, string> = {};
      for (const a of ALGS) out[a] = await sha(a, bytes);
      out.HMAC = s.key ? await hmacSha256(utf8Bytes(s.key), bytes) : '';
      if (alive) setDigests(out);
    };
    void run().catch(() => {
      if (alive) setDigests({});
    });
    return () => {
      alive = false;
    };
  }, [bytes, s.key, hasSubtle]);

  const fmt = (h: string | undefined) => (h ? (s.upper ? h.toUpperCase() : h) : '');
  const rows: [string, string, string?][] = [
    ['MD5', fmt(md5Hex), '128-bit · pure JS'],
    ...ALGS.map((a) => [a, fmt(digests[a]), 'WebCrypto'] as [string, string, string]),
    ['HMAC-SHA256', fmt(digests.HMAC), s.key ? 'keyed' : 'enter a key'],
  ];

  return (
    <div className="tool">
      <div className="tool-head">
        <h2>Hashes</h2>
        <p>Digests of the input text (UTF-8). Nothing is sent anywhere.</p>
      </div>
      <div className="grid2">
        <Field label="Input" value={s.input} onChange={(input) => set((p) => ({ ...p, input }))} rows={7} placeholder="Text to hash…" />
        <div className="tool" style={{ gap: 10 }}>
          <div className="field">
            <div className="field-bar">
              <span className="lbl">HMAC key</span>
            </div>
            <input className="in mono" value={s.key} onChange={(e) => set((p) => ({ ...p, key: e.target.value }))} placeholder="secret (for HMAC-SHA256)" spellCheck={false} aria-label="HMAC key" />
          </div>
          <div className="bar">
            <Check label="Uppercase hex" checked={s.upper} onChange={(upper) => set((p) => ({ ...p, upper }))} />
            <span className="muted mono small">{bytes.length} byte{bytes.length === 1 ? '' : 's'}</span>
          </div>
          {!hasSubtle && (
            <div className="note">
              <b>WebCrypto (crypto.subtle) is unavailable here</b>, so SHA-* and HMAC can't run — this happens when the app runs outside a secure context. MD5 still works because it is implemented in plain JavaScript.
            </div>
          )}
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <tbody>
            {rows.map(([name, hex, note]) => (
              <tr key={name}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <b>{name}</b>
                  <br />
                  <span className="muted">{note}</span>
                </td>
                <td style={{ wordBreak: 'break-all', width: '100%' }}>{hex || <span className="muted">{name === 'HMAC-SHA256' ? 'Add a key to compute.' : hasSubtle ? '…' : 'unavailable'}</span>}</td>
                <td>
                  <CopyButton text={hex} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HashTool;
