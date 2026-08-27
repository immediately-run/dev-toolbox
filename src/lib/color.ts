// Color parsing/conversion and WCAG contrast.

export interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}
export interface HSL {
  h: number;
  s: number;
  l: number;
  a: number;
}

const NAMED: Record<string, string> = {
  black: '#000000', white: '#ffffff', red: '#ff0000', lime: '#00ff00', blue: '#0000ff', yellow: '#ffff00',
  cyan: '#00ffff', aqua: '#00ffff', magenta: '#ff00ff', fuchsia: '#ff00ff', gray: '#808080', grey: '#808080',
  silver: '#c0c0c0', maroon: '#800000', olive: '#808000', green: '#008000', purple: '#800080', teal: '#008080',
  navy: '#000080', orange: '#ffa500', pink: '#ffc0cb', gold: '#ffd700', coral: '#ff7f50', salmon: '#fa8072',
  tomato: '#ff6347', violet: '#ee82ee', indigo: '#4b0082', crimson: '#dc143c', hotpink: '#ff69b4',
  rebeccapurple: '#663399', slategray: '#708090', steelblue: '#4682b4', skyblue: '#87ceeb', tan: '#d2b48c',
  khaki: '#f0e68c', beige: '#f5f5dc', ivory: '#fffff0', lavender: '#e6e6fa', turquoise: '#40e0d0',
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (NAMED[s]) return parseColor(NAMED[s]);
  let m = s.match(/^#?([0-9a-f]{3,4})$/);
  if (m) {
    const h = m[1];
    const [r, g, b, a] = h.split('').map((c) => parseInt(c + c, 16));
    return { r, g, b, a: h.length === 4 ? a / 255 : 1 };
  }
  m = s.match(/^#?([0-9a-f]{6})([0-9a-f]{2})?$/);
  if (m) {
    const h = m[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: m[2] ? parseInt(m[2], 16) / 255 : 1,
    };
  }
  m = s.match(/^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
  if (m) {
    const ch = (v: string) => (v.endsWith('%') ? (parseFloat(v) / 100) * 255 : parseFloat(v));
    const al = (v?: string) => (v === undefined ? 1 : v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v));
    return { r: clamp(Math.round(ch(m[1])), 0, 255), g: clamp(Math.round(ch(m[2])), 0, 255), b: clamp(Math.round(ch(m[3])), 0, 255), a: clamp(al(m[4]), 0, 1) };
  }
  m = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?(?:[\s,/]+([\d.]+%?))?\s*\)$/);
  if (m) {
    const al = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return hslToRgb({ h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]), a: clamp(al, 0, 1) });
  }
  // bare r,g,b
  m = s.match(/^(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})$/);
  if (m) return { r: clamp(+m[1], 0, 255), g: clamp(+m[2], 0, 255), b: clamp(+m[3], 0, 255), a: 1 };
  return null;
}

export function rgbToHsl({ r, g, b, a }: RGB): HSL {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h * 10) / 10, s: Math.round(s * 1000) / 10, l: Math.round(l * 1000) / 10, a };
}

export function hslToRgb({ h, s, l, a }: HSL): RGB {
  const S = clamp(s, 0, 100) / 100;
  const L = clamp(l, 0, 100) / 100;
  const H = (((h % 360) + 360) % 360) / 360;
  const hue = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number;
  let g: number;
  let b: number;
  if (S === 0) r = g = b = L;
  else {
    const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
    const p = 2 * L - q;
    r = hue(p, q, H + 1 / 3);
    g = hue(p, q, H);
    b = hue(p, q, H - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a };
}

const hex2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');

export function toHex(c: RGB, withAlpha = false): string {
  const base = `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
  return withAlpha || c.a < 1 ? base + hex2(c.a * 255) : base;
}
export function toRgbString(c: RGB): string {
  return c.a < 1 ? `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.round(c.a * 100) / 100})` : `rgb(${c.r}, ${c.g}, ${c.b})`;
}
export function toHslString(c: RGB): string {
  const h = rgbToHsl(c);
  return h.a < 1 ? `hsla(${h.h}, ${h.s}%, ${h.l}%, ${Math.round(h.a * 100) / 100})` : `hsl(${h.h}, ${h.s}%, ${h.l}%)`;
}

export function relativeLuminance({ r, g, b }: RGB): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export interface WcagResult {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
}

export function wcag(a: RGB, b: RGB): WcagResult {
  const ratio = contrastRatio(a, b);
  return { ratio, aaNormal: ratio >= 4.5, aaLarge: ratio >= 3, aaaNormal: ratio >= 7, aaaLarge: ratio >= 4.5 };
}

/** Mix two colors (0..1) — used for tint/shade ramps. */
export function mix(a: RGB, b: RGB, t: number): RGB {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, a: 1 };
}
