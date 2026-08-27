interface Props {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Check({ label, checked, onChange }: Props) {
  return (
    <label className={`chip${checked ? ' on' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="box" aria-hidden="true">{checked ? '✓' : ''}</span>
      {label}
    </label>
  );
}

export default Check;
