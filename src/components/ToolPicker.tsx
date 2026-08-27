import { useEffect, useRef, useState } from 'react';
import { searchTools, type ToolId } from '../data/tools';
import ToolList from './ToolList';

interface Props {
  sheet: boolean;
  active: ToolId;
  onPick: (id: ToolId) => void;
  onClose: () => void;
}

/** ⌘K palette on wide screens, bottom sheet on narrow ones. Same search.
 *  Mounted only while open, so the query resets naturally each time. */
function ToolPicker({ sheet, active, onPick, onClose }: Props) {
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const items = searchTools(q);

  useEffect(() => {
    const t = setTimeout(() => input.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHi((h) => Math.min(items.length - 1, h + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHi((h) => Math.max(0, h - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const t = items[hi] ?? items[0];
        if (t) onPick(t.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, hi, onPick, onClose]);

  return (
    <div className={`picker${sheet ? ' sheet' : ' palette'}`} onClick={onClose} role="presentation">
      <div className="picker-card" role="dialog" aria-modal="true" aria-label="Switch tool" onClick={(e) => e.stopPropagation()}>
        {sheet && <div className="grip" aria-hidden="true" />}
        <input
          ref={input}
          className="picker-in mono"
          placeholder="Search tools…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setHi(0);
          }}
          aria-label="Search tools"
        />
        <ToolList active={active} onPick={onPick} items={items} highlight={hi} />
        {!sheet && (
          <div className="picker-foot mono">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> open</span>
            <span><kbd>esc</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ToolPicker;
