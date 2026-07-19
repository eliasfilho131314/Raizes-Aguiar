type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'bg-surface-alt border border-border text-text-primary hover:brightness-95',
  danger: 'bg-danger text-white hover:brightness-110',
};

export function Button({ label, onClick, type = 'button', variant = 'primary', loading, disabled, className = '' }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`h-11 rounded-button px-5 text-sm font-semibold transition-all duration-150 ${VARIANT_CLASSES[variant]} ${
        isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-[0.98]'
      } ${className}`}
    >
      {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : label}
    </button>
  );
}
