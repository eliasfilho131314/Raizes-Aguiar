import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, LogOut, Menu, Settings, User } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/Logo';
import { FarmSelector } from './FarmSelector';

interface TopBarProps {
  onToggleSidebar: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-16 items-center gap-md border-b border-border bg-surface px-md lg:px-lg">
      <button type="button" onClick={onToggleSidebar} className="text-text-secondary hover:text-text-primary lg:hidden" aria-label="Abrir menu">
        <Menu size={22} />
      </button>

      <div className="hidden lg:block">
        <Logo size={26} />
      </div>

      <FarmSelector />

      <div className="ml-auto flex items-center gap-sm">
        <button
          type="button"
          onClick={() => navigate('/calendario')}
          className="hidden rounded-button p-2 text-text-secondary hover:bg-surface-alt hover:text-text-primary sm:block"
          aria-label="Calendário"
        >
          <Calendar size={18} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
          >
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-button border border-border bg-surface shadow-lg">
              <div className="border-b border-border px-md py-sm">
                <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
                <p className="text-caption text-text-secondary">{user?.email}</p>
              </div>
              <button type="button" onClick={() => navigate('/configuracoes')} className="flex w-full items-center gap-sm px-md py-sm text-left text-sm text-text-primary hover:bg-surface-alt">
                <Settings size={16} /> Configurações
              </button>
              <button type="button" onClick={() => navigate('/perfil')} className="flex w-full items-center gap-sm px-md py-sm text-left text-sm text-text-primary hover:bg-surface-alt">
                <User size={16} /> Perfil
              </button>
              <button type="button" onClick={logout} className="flex w-full items-center gap-sm px-md py-sm text-left text-sm text-danger hover:bg-surface-alt">
                <LogOut size={16} /> Sair
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
