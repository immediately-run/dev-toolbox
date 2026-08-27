import type { ReactNode } from 'react';
import CopyButton from './CopyButton';

interface Props {
  label: string;
  value: string;
  actions?: ReactNode;
  empty?: string;
  error?: string | null;
  wrap?: boolean;
  maxHeight?: number;
  children?: ReactNode;
}

/** Read-only result box with a copy button. Pass `children` to render custom
 *  content (highlighted text, tables) instead of the plain value. */
function Output({ label, value, actions, empty = 'Nothing yet.', error, wrap, maxHeight = 420, children }: Props) {
  return (
    <div className="out">
      <div className="field-bar">
        <span className="lbl">{label}</span>
        <span className="acts">
          {actions}
          <CopyButton text={value} />
        </span>
      </div>
      {error ? (
        <div className="err">{error}</div>
      ) : children ? (
        <div className="out-body" style={{ maxHeight }}>
          {children}
        </div>
      ) : value ? (
        <pre className={`out-body${wrap ? ' wrap' : ''}`} style={{ maxHeight }}>
          {value}
        </pre>
      ) : (
        <div className="out-body muted">{empty}</div>
      )}
    </div>
  );
}

export default Output;
