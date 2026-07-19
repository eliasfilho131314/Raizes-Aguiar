import { Sprout } from 'lucide-react';

interface LogoProps {
  variant?: 'mark' | 'wordmark';
  size?: number;
}

export function Logo({ variant = 'wordmark', size = 28 }: LogoProps) {
  const mark = (
    <div
      className="flex items-center justify-center rounded-lg bg-primary text-white"
      style={{ width: size, height: size }}
    >
      <Sprout size={size * 0.62} />
    </div>
  );

  if (variant === 'mark') return mark;

  return (
    <div className="flex items-center gap-2">
      {mark}
      <span className="font-bold text-text-primary" style={{ fontSize: size * 0.5 }}>
        Raízes Aguiar
      </span>
    </div>
  );
}
