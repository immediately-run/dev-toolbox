import { useState } from 'react';

interface Props {
  name: string | null;
  value: unknown;
  depth: number;
  last: boolean;
}

function preview(v: unknown): string {
  if (Array.isArray(v)) return `[…] ${v.length} item${v.length === 1 ? '' : 's'}`;
  const n = Object.keys(v as object).length;
  return `{…} ${n} key${n === 1 ? '' : 's'}`;
}

function JsonTreeNode({ name, value, depth, last }: Props) {
  const [open, setOpen] = useState(depth < 2);
  const isObj = value !== null && typeof value === 'object';
  const key = name === null ? null : <span className="k">{JSON.stringify(name)}: </span>;
  const comma = last ? '' : ',';

  if (!isObj) {
    const t = value === null ? 'null' : typeof value;
    return (
      <div className="tn" style={{ paddingLeft: depth * 16 }}>
        <span className="tw" />
        {key}
        <span className={`v ${t}`}>{JSON.stringify(value)}</span>
        {comma}
      </div>
    );
  }

  const arr = Array.isArray(value);
  const entries = arr ? (value as unknown[]).map((v, i) => [String(i), v] as const) : Object.entries(value as object);
  const openCh = arr ? '[' : '{';
  const closeCh = arr ? ']' : '}';

  return (
    <div>
      <div className="tn" style={{ paddingLeft: depth * 16 }}>
        <button type="button" className="tw tog" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Collapse' : 'Expand'}>
          {open ? '▾' : '▸'}
        </button>
        {key}
        {open ? (
          <span className="p">{openCh}{entries.length === 0 ? closeCh + comma : ''}</span>
        ) : (
          <button type="button" className="p summary" onClick={() => setOpen(true)}>
            {preview(value)}
            {comma}
          </button>
        )}
      </div>
      {open && entries.length > 0 && (
        <>
          {entries.map(([k, v], i) => (
            <JsonTreeNode key={k} name={arr ? null : k} value={v} depth={depth + 1} last={i === entries.length - 1} />
          ))}
          <div className="tn" style={{ paddingLeft: depth * 16 }}>
            <span className="tw" />
            <span className="p">
              {closeCh}
              {comma}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default JsonTreeNode;
