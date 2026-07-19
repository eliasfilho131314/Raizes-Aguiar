import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Logo } from '../../components/Logo';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../auth/AuthContext';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup({ name, email, password });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-md">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[380px] flex-col gap-md rounded-card border border-border bg-surface p-lg">
        <div className="flex justify-center pb-sm">
          <Logo size={32} />
        </div>
        <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextField label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField label="Senha (mínimo 8 caracteres)" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error ? <span className="text-caption text-danger">{error}</span> : null}
        <Button type="submit" label="Criar conta" loading={loading} className="w-full" />
        <p className="text-center text-caption text-text-secondary">
          Já tem conta? <Link to="/login" className="font-semibold text-primary">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
