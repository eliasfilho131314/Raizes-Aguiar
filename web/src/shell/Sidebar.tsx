import { NavLink } from 'react-router';
import { useFarm } from '../auth/FarmContext';
import { NAV_ITEMS } from './navItems';

interface SidebarProps {
  isOpen: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  const { selectedFarm } = useFarm();
  const role = selectedFarm?.myRole;

  const items = NAV_ITEMS.filter((item) => !item.minRole || (role && item.minRole.includes(role)));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-1 overflow-y-auto border-r border-border bg-surface p-sm transition-transform lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-sm rounded-button px-md py-sm text-sm transition-colors ${
              isActive ? 'bg-primary/10 font-semibold text-primary' : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'
            }`
          }
        >
          <item.icon size={18} />
          <span className="flex-1">{item.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}
