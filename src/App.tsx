// Root component — immediately.run renders the default export of THIS file.
// Global CSS is imported here (not in main.tsx) because immediately.run's
// runtime never loads main.tsx; anything the rendered tree needs must be
// reachable from App.tsx.
import './index.css';
import './App.css';
import { useCallback, useEffect, useState } from 'react';
import { TOOL_BY_ID, type ToolId } from './data/tools';
import { useToolState } from './hooks/useToolState';
import { useIsNarrow } from './hooks/useIsNarrow';
import { usePersistStatus } from './hooks/usePersistStatus';
import ThemeSwitch from './components/ThemeSwitch';
import ToolList from './components/ToolList';
import ToolPicker from './components/ToolPicker';
import ToolPane from './components/ToolPane';

const STATUS_TEXT = {
  pending: 'Opening your private space…',
  store: 'Last inputs saved to your private space.',
  'read-only': 'Private space is read-only — inputs kept for this session.',
  memory: 'No private space — inputs kept for this session only.',
} as const;

function App() {
  const [shell, setShell] = useToolState<{ tool: ToolId }>('_shell', { tool: 'json' });
  const [pickerOpen, setPickerOpen] = useState(false);
  const narrow = useIsNarrow();
  const persist = usePersistStatus();
  const tool = TOOL_BY_ID[shell.tool] ?? TOOL_BY_ID.json;

  const pick = useCallback(
    (id: ToolId) => {
      setShell({ tool: id });
      setPickerOpen(false);
    },
    [setShell],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPickerOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="shell" data-narrow={narrow ? '' : undefined}>
      <header className="top">
        <div className="logo">
          <span className="mark" aria-hidden="true" />
          <span className="word">Dev toolbox</span>
        </div>
        {narrow && (
          <button type="button" className="curtool" onClick={() => setPickerOpen(true)} aria-haspopup="dialog">
            <span className="glyph">{tool.glyph}</span>
            <span>{tool.name}</span>
            <span className="caret">▾</span>
          </button>
        )}
        <div className="cta">
          {!narrow && (
            <button type="button" className="khint" onClick={() => setPickerOpen(true)}>
              Switch tool <kbd>⌘K</kbd>
            </button>
          )}
          <ThemeSwitch />
        </div>
      </header>
      <div className="body">
        {!narrow && (
          <aside className="side">
            <ToolList active={tool.id} onPick={pick} />
            <div className="foot">
              <span className="persist" data-s={persist}>
                {STATUS_TEXT[persist]}
              </span>
              <br />
              Everything runs in this tab.
            </div>
          </aside>
        )}
        <main className="pane">
          <ToolPane key={tool.id} id={tool.id} />
          {narrow && (
            <p className="foot muted small mono" style={{ marginTop: 28 }}>
              <span className="persist" data-s={persist}>
                {STATUS_TEXT[persist]}
              </span>
            </p>
          )}
        </main>
      </div>
      {pickerOpen && <ToolPicker sheet={narrow} active={tool.id} onPick={pick} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

export default App;
