interface LogoProps {
  variant?: 'mark' | 'wordmark' | 'badge';
  size?: number;
}

export function Logo({ variant = 'wordmark', size = 28 }: LogoProps) {
  const mark = (
    <div
      className="flex items-center justify-center rounded-lg bg-primary"
      style={{ width: size, height: size, padding: size * 0.16 }}
    >
      <img src="/logo-mark.png" alt="" className="h-full w-full object-contain" />
    </div>
  );

  if (variant === 'mark') return mark;

  // Lockup completo (bull + "RAIZES AGUIAR" + monograma RA) -- branco puro,
  // só lê bem sobre fundo escuro, por isso vai num painel próprio em vez de
  // direto no fundo claro do app.
  if (variant === 'badge') {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-primary-dark p-md" style={{ width: size, height: size }}>
        <img src="/logo-full.png" alt="Raízes Aguiar" className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {mark}
      <span className="font-bold text-text-primary" style={{ fontSize: size * 0.5 }}>
        Raízes Aguiar
      </span>
    </div>
  );
}
