import { Navigate, Outlet } from 'react-router';
import { useAuth } from './AuthContext';

export function RedirectIfAuthed() {
  const { user, isBootstrapping } = useAuth();
  // Evita um flash do formulário de login/cadastro pra quem recarrega a
  // página nessas rotas já autenticado (sessão ainda restaurando).
  if (isBootstrapping) return null;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
