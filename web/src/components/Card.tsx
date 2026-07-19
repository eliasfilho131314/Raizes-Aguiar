import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  span?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', span = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-card border border-border bg-surface p-md ${span} ${className}`}
    >
      {children}
    </div>
  );
}
