import {
  Beef,
  Building2,
  Calendar,
  FileBarChart,
  FileSpreadsheet,
  Wallet,
  HeartPulse,
  LayoutDashboard,
  Package,
  Scale,
  Settings,
  Skull,
  Syringe,
  Trees,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import type { FarmRole } from '../api/types';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Se ausente, qualquer papel vê o item. */
  minRole?: FarmRole[];
  /** Módulos do prompt ainda sem implementação nesta fase. */
  comingSoon?: boolean;
}

// "Sem acesso financeiro" pro funcionário (PERFIS DE ACESSO do prompt) --
// por isso Financeiro/Fazendas exigem administrador/gerente.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Pecuária', path: '/animais', icon: Beef },
  { label: 'Pesagens', path: '/pesagens', icon: Scale, comingSoon: true },
  { label: 'Reprodução', path: '/reproducao', icon: HeartPulse },
  { label: 'Sanidade', path: '/sanidade', icon: Syringe },
  { label: 'Mortalidade', path: '/mortalidade', icon: Skull },
  { label: 'Financeiro', path: '/financeiro', icon: Wallet, minRole: ['administrador', 'gerente'] },
  { label: 'Estoque', path: '/estoque', icon: Package },
  { label: 'Funcionários', path: '/funcionarios', icon: Users, minRole: ['administrador', 'gerente'] },
  { label: 'Pastagens', path: '/pastagens', icon: Trees },
  { label: 'Confinamento', path: '/confinamento', icon: Warehouse },
  { label: 'Planilhas', path: '/planilhas', icon: FileSpreadsheet, comingSoon: true },
  { label: 'Relatórios', path: '/relatorios', icon: FileBarChart, minRole: ['administrador', 'gerente'] },
  { label: 'Calendário', path: '/calendario', icon: Calendar },
  { label: 'Fazendas', path: '/fazendas', icon: Building2, minRole: ['administrador'] },
  { label: 'Configurações', path: '/configuracoes', icon: Settings, comingSoon: true },
];
