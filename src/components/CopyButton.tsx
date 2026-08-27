import { useCopy } from '../hooks/useCopy';

interface Props {
  text: string;
  label?: string;
  small?: boolean;
  disabled?: boolean;
}

function CopyButton({ text, label = 'Copy', small = true, disabled }: Props) {
  const [copied, copy] = useCopy();
  return (
    <button
      type="button"
      className={`btn btn-ghost${small ? ' btn-sm' : ''}${copied ? ' is-copied' : ''}`}
      onClick={() => void copy(text)}
      disabled={disabled || !text}
      aria-live="polite"
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}

export default CopyButton;
