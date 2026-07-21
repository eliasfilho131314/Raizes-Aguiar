import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { RedirectIfAuthed } from './auth/RedirectIfAuthed';
import { RequireAuth } from './auth/RequireAuth';
import { AppShell } from './shell/AppShell';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { PagePlaceholder } from './components/PagePlaceholder';

const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AnimalsPage = lazy(() => import('./pages/animals/AnimalsPage').then((m) => ({ default: m.AnimalsPage })));
const FinancePage = lazy(() => import('./pages/finance/FinancePage').then((m) => ({ default: m.FinancePage })));
const FarmsPage = lazy(() => import('./pages/farms/FarmsPage').then((m) => ({ default: m.FarmsPage })));
const HealthPage = lazy(() => import('./pages/health/HealthPage').then((m) => ({ default: m.HealthPage })));
const ReproductionPage = lazy(() => import('./pages/reproduction/ReproductionPage').then((m) => ({ default: m.ReproductionPage })));
const MortalityPage = lazy(() => import('./pages/mortality/MortalityPage').then((m) => ({ default: m.MortalityPage })));
const StockPage = lazy(() => import('./pages/stock/StockPage').then((m) => ({ default: m.StockPage })));
const EmployeesPage = lazy(() => import('./pages/employees/EmployeesPage').then((m) => ({ default: m.EmployeesPage })));
const CalendarPage = lazy(() => import('./pages/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));

// Módulos do prompt ainda não implementados nesta fase -- placeholder
// "em breve" em vez de 404, pra já aparecerem no menu com o nome certo.
// "ia" saiu de vez -- usuário confirmou que Raízes IA não entra no escopo.
const COMING_SOON_ROUTES = [
  'pesagens',
  'pastagens',
  'confinamento',
  'planilhas',
  'configuracoes',
  'perfil',
];

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RedirectIfAuthed />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="animais" element={<AnimalsPage />} />
          <Route path="financeiro" element={<FinancePage />} />
          <Route path="fazendas" element={<FarmsPage />} />
          <Route path="sanidade" element={<HealthPage />} />
          <Route path="reproducao" element={<ReproductionPage />} />
          <Route path="mortalidade" element={<MortalityPage />} />
          <Route path="estoque" element={<StockPage />} />
          <Route path="funcionarios" element={<EmployeesPage />} />
          <Route path="calendario" element={<CalendarPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
          {COMING_SOON_ROUTES.map((path) => (
            <Route key={path} path={path} element={<PagePlaceholder title="Módulo em construção" comingSoon />} />
          ))}
          <Route path="*" element={<PagePlaceholder title="Página não encontrada" />} />
        </Route>
      </Route>
    </Routes>
  );
}
