// Line diff: Myers' O(ND) algorithm with full backtracking, plus a unified
// formatter and a side-by-side row pairing. No dependencies.

export type DiffOp =
  | { type: 'eq'; a: number; b: number; text: string }
  | { type: 'del'; a: number; text: string }
  | { type: 'ins'; b: number; text: string };

export function splitLines(s: string): string[] {
  if (s === '') return [];
  const lines = s.split(/\r?\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** Myers diff on arrays of lines. Falls back to "replace everything" when the
 *  edit distance exceeds `maxD` (keeps pathological inputs bounded). */
export function diffLines(a: string[], b: string[], maxD = 4000): DiffOp[] {
  const n = a.length;
  const m = b.length;
  const max = Math.min(n + m, maxD);
  const off = max + 1;
  const size = 2 * max + 3;
  let v = new Int32Array(size).fill(0);
  const trace: Int32Array[] = [];
  let found = false;

  outer: for (let d = 0; d <= max; d++) {
    trace.push(v);
    const nv = new Int32Array(v);
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[off + k - 1] < v[off + k + 1])) x = v[off + k + 1];
      else x = v[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      nv[off + k] = x;
      if (x >= n && y >= m) {
        trace.push(nv);
        found = true;
        break outer;
      }
    }
    v = nv;
  }

  if (!found) {
    const ops: DiffOp[] = [];
    a.forEach((text, i) => ops.push({ type: 'del', a: i, text }));
    b.forEach((text, i) => ops.push({ type: 'ins', b: i, text }));
    return ops;
  }

  // Backtrack. trace[d] holds V *before* round d was computed; trace[d+1] after.
  const ops: DiffOp[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 2; d >= 0; d--) {
    const vd = trace[d];
    const k = x - y;
    let prevK: number;
    if (k === -d || (k !== d && vd[off + k - 1] < vd[off + k + 1])) prevK = k + 1;
    else prevK = k - 1;
    const prevX = vd[off + prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      x--;
      y--;
      ops.push({ type: 'eq', a: x, b: y, text: a[x] });
    }
    if (d > 0) {
      if (x === prevX) {
        y--;
        ops.push({ type: 'ins', b: y, text: b[y] });
      } else {
        x--;
        ops.push({ type: 'del', a: x, text: a[x] });
      }
    }
    x = prevX;
    y = prevY;
  }
  // d = 0 round: any remaining prefix is equal
  while (x > 0 && y > 0) {
    x--;
    y--;
    ops.push({ type: 'eq', a: x, b: y, text: a[x] });
  }
  return ops.reverse();
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

export function diffStats(ops: DiffOp[]): DiffStats {
  const s = { added: 0, removed: 0, unchanged: 0 };
  for (const op of ops) {
    if (op.type === 'ins') s.added++;
    else if (op.type === 'del') s.removed++;
    else s.unchanged++;
  }
  return s;
}

export function unifiedDiff(ops: DiffOp[], nameA = 'a', nameB = 'b', context = 3): string {
  const out: string[] = [`--- ${nameA}`, `+++ ${nameB}`];
  let i = 0;
  const changed = (op: DiffOp) => op.type !== 'eq';
  while (i < ops.length) {
    if (!changed(ops[i])) {
      i++;
      continue;
    }
    // hunk from i-context to the last change within `context` unchanged lines
    let start = Math.max(0, i - context);
    let end = i;
    let j = i;
    while (j < ops.length) {
      if (changed(ops[j])) {
        end = j + 1;
        j++;
      } else {
        let run = 0;
        while (j + run < ops.length && !changed(ops[j + run])) run++;
        if (run <= context * 2 && j + run < ops.length) j += run;
        else break;
      }
    }
    end = Math.min(ops.length, end + context);
    // trailing context might overlap: fine.
    const slice = ops.slice(start, end);
    let aStart = -1;
    let bStart = -1;
    let aLen = 0;
    let bLen = 0;
    for (const op of slice) {
      if (op.type !== 'ins') {
        if (aStart < 0) aStart = op.a;
        aLen++;
      }
      if (op.type !== 'del') {
        if (bStart < 0) bStart = op.b;
        bLen++;
      }
    }
    const firstA = aStart < 0 ? (slice.find((o) => o.type === 'ins') as { b: number } | undefined)?.b ?? 0 : aStart;
    const firstB = bStart < 0 ? (slice.find((o) => o.type === 'del') as { a: number } | undefined)?.a ?? 0 : bStart;
    out.push(`@@ -${aLen ? firstA + 1 : firstA},${aLen} +${bLen ? firstB + 1 : firstB},${bLen} @@`);
    for (const op of slice) out.push((op.type === 'eq' ? ' ' : op.type === 'del' ? '-' : '+') + op.text);
    i = end;
    start = end;
  }
  return out.join('\n');
}

export interface SideRow {
  left?: { n: number; text: string; kind: 'eq' | 'del' };
  right?: { n: number; text: string; kind: 'eq' | 'ins' };
}

/** Pair deletions with insertions so a replaced block sits on the same rows. */
export function sideBySide(ops: DiffOp[]): SideRow[] {
  const rows: SideRow[] = [];
  let i = 0;
  while (i < ops.length) {
    const op = ops[i];
    if (op.type === 'eq') {
      rows.push({ left: { n: op.a + 1, text: op.text, kind: 'eq' }, right: { n: op.b + 1, text: op.text, kind: 'eq' } });
      i++;
      continue;
    }
    const dels: DiffOp[] = [];
    const inss: DiffOp[] = [];
    while (i < ops.length && ops[i].type !== 'eq') {
      if (ops[i].type === 'del') dels.push(ops[i]);
      else inss.push(ops[i]);
      i++;
    }
    const len = Math.max(dels.length, inss.length);
    for (let r = 0; r < len; r++) {
      const d = dels[r] as { a: number; text: string } | undefined;
      const s = inss[r] as { b: number; text: string } | undefined;
      rows.push({
        left: d ? { n: d.a + 1, text: d.text, kind: 'del' } : undefined,
        right: s ? { n: s.b + 1, text: s.text, kind: 'ins' } : undefined,
      });
    }
  }
  return rows;
}
