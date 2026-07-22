import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Logo } from '../../components/Logo';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../auth/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-md">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[380px] flex-col gap-md rounded-card border border-border bg-surface p-lg">
        <div className="flex justify-center pb-sm">
          <Logo variant="badge" size={140} />
        </div>
        <TextField label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error ? <span className="text-caption text-danger">{error}</span> : null}
        <Button type="submit" label="Entrar" loading={loading} className="w-full" />
        <p className="text-center text-caption text-text-secondary">
          Não tem conta? <Link to="/signup" className="font-semibold text-primary">Criar conta</Link>
        </p>
      </form>
    </div>
  );
}
