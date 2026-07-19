import { Suspense, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { FarmProvider, useFarm } from '../auth/FarmContext';
import { PageLoadingFallback } from '../components/PageLoadingFallback';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Button } from '../components/Button';

export function AppShell() {
  return (
    <FarmProvider>
      <ShellLayout />
    </FarmProvider>
  );
}

function ShellLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { farms, isLoading, selectedFarm } = useFarm();
  const navigate = useNavigate();
  const location = useLocation();
  // /fazendas é a própria página que tira o usuário do estado "sem
  // fazenda nenhuma" -- não pode ser bloqueada pelas duas checagens
  // abaixo (senão o botão "Criar minha primeira fazenda" leva a lugar
  // nenhum, e o usuário nunca sai da tela de boas-vindas).
  const isFarmsPage = location.pathname === '/fazendas';

  if (!isFarmsPage && !isLoading && farms.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-md bg-background px-md text-center">
        <h1 className="text-title font-bold text-text-primary">Bem-vindo ao Raízes Aguiar</h1>
        <p className="max-w-[420px] text-body text-text-secondary">
          Você ainda não tem nenhuma fazenda cadastrada. Crie a primeira pra começar a usar o sistema.
        </p>
        <Button label="Criar minha primeira fazenda" onClick={() => navigate('/fazendas')} />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen ? (
          <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        ) : null}
        <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <main className="grid flex-1 auto-rows-min grid-cols-12 gap-md overflow-y-auto p-md lg:gap-lg lg:p-lg lg:pl-[280px]">
          {selectedFarm || isFarmsPage ? (
            <Suspense fallback={<PageLoadingFallback />}>
              <Outlet />
            </Suspense>
          ) : (
            <PageLoadingFallback />
          )}
        </main>
      </div>
    </div>
  );
}
