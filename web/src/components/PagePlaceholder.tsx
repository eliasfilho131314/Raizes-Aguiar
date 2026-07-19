import type { LucideIcon } from 'lucide-react';
import { Clock } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
}

export function PagePlaceholder({ title, icon: Icon, comingSoon }: PagePlaceholderProps) {
  return (
    <div className="col-span-12 flex min-h-[50vh] flex-col items-center justify-center gap-md text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt text-text-secondary">
        {Icon ? <Icon size={28} /> : <Clock size={28} />}
      </div>
      <h1 className="text-subtitle font-semibold text-text-primary">{title}</h1>
      <p className="max-w-[384px] text-body text-text-secondary">
        {comingSoon ? 'Esse módulo ainda está sendo construído e chega numa fase futura.' : 'Página não encontrada.'}
      </p>
    </div>
  );
}
