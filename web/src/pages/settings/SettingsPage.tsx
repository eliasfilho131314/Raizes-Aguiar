import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { usersApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

function ChangePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => usersApi.updatePassword(password),
    onSuccess: () => {
      setPassword('');
      setConfirm('');
      setError(null);
      setSaved(true);
    },
    onError: (e) => {
      setSaved(false);
      setError(e instanceof ApiError ? e.message : 'Não foi possível trocar a senha.');
    },
  });

  function handleSubmit() {
    setSaved(false);
    if (password.length < 8) {
      setError('A senha precisa ter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setError(null);
    save.mutate();
  }

  return (
    <Card span="col-span-12 lg:col-span-6" className="flex flex-col gap-sm">
      <h2 className="text-sm font-semibold uppercase text-text-secondary">Trocar senha</h2>
      <TextField label="Nova senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <TextField label="Confirmar nova senha" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {error ? <span className="text-caption text-danger">{error}</span> : null}
      {saved ? <span className="text-caption text-primary">Senha atualizada.</span> : null}
      <Button label="Salvar nova senha" onClick={handleSubmit} loading={save.isPending} className="w-fit" />
    </Card>
  );
}

export function SettingsPage() {
  const { logout } = useAuth();

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Configurações</h1>
      </div>

      <ChangePasswordForm />

      <Card span="col-span-12 lg:col-span-6" className="flex flex-col gap-sm">
        <h2 className="text-sm font-semibold uppercase text-text-secondary">Sessão</h2>
        <p className="text-caption text-text-secondary">Encerra sua sessão neste dispositivo.</p>
        <Button label="Sair" variant="danger" onClick={logout} className="w-fit" />
      </Card>
    </>
  );
}
