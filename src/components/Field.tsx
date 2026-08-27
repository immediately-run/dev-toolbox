import type { ReactNode, RefObject } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
  actions?: ReactNode;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  grow?: boolean;
}

function Field({ label, value, onChange, placeholder, rows = 8, mono = true, actions, textareaRef, grow }: Props) {
  return (
    <div className={`field${grow ? ' grow' : ''}`}>
      <div className="field-bar">
        <span className="lbl">{label}</span>
        <span className="acts">{actions}</span>
      </div>
      <textarea
        ref={textareaRef}
        className={mono ? 'mono' : ''}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  );
}

export default Field;
