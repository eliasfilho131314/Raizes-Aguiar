import React from 'react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export function TextField({ label, error, className = '', id, ...rest }: TextFieldProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      {label ? (
        <label htmlFor={inputId} className="text-caption text-text-secondary">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className="h-11 rounded-button border border-border bg-surface px-md text-body text-text-primary placeholder:text-text-secondary outline-none focus:border-primary transition-colors"
        {...rest}
      />
      {error ? <span className="text-caption text-danger">{error}</span> : null}
    </div>
  );
}
