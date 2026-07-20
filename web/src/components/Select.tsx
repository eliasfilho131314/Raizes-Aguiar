interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

export function Select({ label, value, onChange, options, className = '' }: SelectProps) {
  const selectId = label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      {label ? (
        <label htmlFor={selectId} className="text-caption text-text-secondary">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-button border border-border bg-surface px-md text-body text-text-primary outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
