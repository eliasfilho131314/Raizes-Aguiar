import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

export function RequireAuth() {
  const { user, isBootstrapping } = useAuth();
  const location = useLocation();

  // Ao recarregar a página numa rota profunda, a sessão ainda está sendo
  // restaurada nesse ponto -- redirecionar pro /login aqui (mesmo que só
  // por um instante) manda um usuário JÁ autenticado pro /login, que por
  // sua vez o devolve pra "/" (RedirectIfAuthed), perdendo a rota original.
  if (isBootstrapping) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
