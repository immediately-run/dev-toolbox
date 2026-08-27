import { useMemo } from 'react';
import { useToolState } from '../hooks/useToolState';
import { hslToRgb, mix, parseColor, rgbToHsl, toHex, toHslString, toRgbString, wcag, type RGB } from '../lib/color';
import CopyButton from '../components/CopyButton';

interface State {
  color: string;
  fg: string;
  bg: string;
}

const WHITE: RGB = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: RGB = { r: 0, g: 0, b: 0, a: 1 };

function ColorTool() {
  const [s, set] = useToolState<State>('color', { color: '#b285f2', fg: '#ecebf4', bg: '#0a0b11' });
  const c = useMemo(() => parseColor(s.color), [s.color]);
  const hsl = c ? rgbToHsl(c) : null;
  const fg = useMemo(() => parseColor(s.fg), [s.fg]);
  const bg = useMemo(() => parseColor(s.bg), [s.bg]);
  const result = fg && bg ? wcag(fg, bg) : null;

  const setHsl = (patch: Partial<{ h: number; s: number; l: number }>) => {
    if (!hsl) return;
    const next = hslToRgb({ ...hsl, ...patch });
    set((p) => ({ ...p, color: toHex(next) }));
  };

  const ramp = useMemo(() => {
    if (!c) return [];
    const out: RGB[] = [];
    for (let i = 5; i >= 1; i--) out.push(mix(c, WHITE, i / 6));
    out.push(c);
    for (let i = 1; i <= 5; i++) out.push(mix(c, BLACK, i / 6));
    return out;
  }, [c]);

  const formats: [string, string][] = c
    ? [
        ['hex', toHex(c)],
        ['rgb', toRgbString(c)],
        ['hsl', toHslString(c)],
        ['hex8', toHex(c, true)],
        ['css rgb', `rgb(${c.r} ${c.g} ${c.b}${c.a < 1 ? ` / ${Math.round(c.a * 100)}%` : ''})`],
      ]
    : [];

  return (
    <div className="tool">
      <div className="tool-head">
        <h2>Color</h2>
        <p>Convert between hex, rgb and hsl; check text contrast against WCAG.</p>
      </div>
      <div className="grid2">
        <section>
          <h3>Convert</h3>
          <div className="colorrow">
            <input type="color" value={c ? toHex(c).slice(0, 7) : '#000000'} onChange={(e) => set((p) => ({ ...p, color: e.target.value }))} aria-label="Pick color" />
            <input className="in mono" value={s.color} onChange={(e) => set((p) => ({ ...p, color: e.target.value }))} placeholder="#b285f2 · rgb(178,133,242) · hsl(265,80%,74%) · violet" spellCheck={false} aria-label="Color" />
          </div>
          {!c && s.color.trim() && <div className="err">Can't parse that color. Try #hex, rgb(), hsl(), or a CSS name.</div>}
          {c && (
            <>
              <div className="swatch" style={{ ['--sw' as string]: toRgbString(c) }} />
              <div className="kv">
                {formats.map(([k, v]) => (
                  <span key={k} style={{ display: 'contents' }}>
                    <span className="k">{k}</span>
                    <span className="v">{v}</span>
                    <CopyButton text={v} />
                  </span>
                ))}
              </div>
              {hsl && (
                <div className="sliders">
                  <span>H</span>
                  <input type="range" min={0} max={360} step={1} value={Math.round(hsl.h)} onChange={(e) => setHsl({ h: Number(e.target.value) })} aria-label="Hue" />
                  <span>{Math.round(hsl.h)}°</span>
                  <span>S</span>
                  <input type="range" min={0} max={100} step={1} value={Math.round(hsl.s)} onChange={(e) => setHsl({ s: Number(e.target.value) })} aria-label="Saturation" />
                  <span>{Math.round(hsl.s)}%</span>
                  <span>L</span>
                  <input type="range" min={0} max={100} step={1} value={Math.round(hsl.l)} onChange={(e) => setHsl({ l: Number(e.target.value) })} aria-label="Lightness" />
                  <span>{Math.round(hsl.l)}%</span>
                </div>
              )}
              <div className="lbl">Tints and shades (click to use)</div>
              <div className="ramp">
                {ramp.map((r, i) => (
                  <button key={i} type="button" style={{ background: toRgbString(r) }} title={toHex(r)} aria-label={toHex(r)} onClick={() => set((p) => ({ ...p, color: toHex(r) }))} />
                ))}
              </div>
            </>
          )}
        </section>
        <section>
          <h3>Contrast checker</h3>
          <div className="colorrow">
            <input type="color" value={fg ? toHex(fg).slice(0, 7) : '#000000'} onChange={(e) => set((p) => ({ ...p, fg: e.target.value }))} aria-label="Pick text color" />
            <input className="in mono" value={s.fg} onChange={(e) => set((p) => ({ ...p, fg: e.target.value }))} placeholder="text color" spellCheck={false} aria-label="Text color" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => set((p) => ({ ...p, fg: p.bg, bg: p.fg }))} aria-label="Swap colors">
              ⇄
            </button>
            <input type="color" value={bg ? toHex(bg).slice(0, 7) : '#ffffff'} onChange={(e) => set((p) => ({ ...p, bg: e.target.value }))} aria-label="Pick background color" />
            <input className="in mono" value={s.bg} onChange={(e) => set((p) => ({ ...p, bg: e.target.value }))} placeholder="background" spellCheck={false} aria-label="Background color" />
          </div>
          {result && fg && bg ? (
            <>
              <div className="bar">
                <span className="ratio">{result.ratio.toFixed(2)}:1</span>
                <span className="sp" />
                <span className={`tag ${result.aaNormal ? 'pass' : 'fail'}`}>AA text</span>
                <span className={`tag ${result.aaLarge ? 'pass' : 'fail'}`}>AA large</span>
                <span className={`tag ${result.aaaNormal ? 'pass' : 'fail'}`}>AAA text</span>
                <span className={`tag ${result.aaaLarge ? 'pass' : 'fail'}`}>AAA large</span>
              </div>
              <div className="contrast-prev" style={{ background: toRgbString(bg), color: toRgbString(fg) }}>
                <span className="big">Large text (24px) looks like this.</span>
                <span className="sm">Body copy at 14px: the quick brown fox jumps over the lazy dog. 0123456789.</span>
              </div>
              <div className="muted small">
                WCAG 2.x: normal text needs 4.5:1 for AA and 7:1 for AAA; large text (≥24px, or ≥18.7px bold) needs 3:1 and 4.5:1.
              </div>
            </>
          ) : (
            <div className="muted">Enter two parseable colors.</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ColorTool;
