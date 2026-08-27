import { TOOLS, type ToolId, type ToolMeta } from '../data/tools';

interface Props {
  active: ToolId;
  onPick: (id: ToolId) => void;
  items?: ToolMeta[];
  highlight?: number;
}

function ToolList({ active, onPick, items = TOOLS, highlight = -1 }: Props) {
  return (
    <ul className="toollist" role="listbox" aria-label="Tools">
      {items.map((t, i) => (
        <li key={t.id}>
          <button
            type="button"
            role="option"
            aria-selected={t.id === active}
            className={`toolbtn${t.id === active ? ' on' : ''}${i === highlight ? ' hi' : ''}`}
            onClick={() => onPick(t.id)}
          >
            <span className="glyph">{t.glyph}</span>
            <span className="txt">
              <span className="nm">{t.name}</span>
              <span className="bl">{t.blurb}</span>
            </span>
          </button>
        </li>
      ))}
      {items.length === 0 && <li className="muted pad">No tool matches.</li>}
    </ul>
  );
}

export default ToolList;
