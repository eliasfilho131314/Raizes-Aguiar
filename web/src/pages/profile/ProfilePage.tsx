import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { usersApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => usersApi.updateName(name.trim()),
    onSuccess: async () => {
      setError(null);
      setSaved(true);
      await refreshUser();
    },
    onError: (e) => {
      setSaved(false);
      setError(e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    },
  });

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Perfil</h1>
      </div>

      <Card span="col-span-12 lg:col-span-6" className="flex flex-col gap-sm">
        <TextField label="Nome" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
        <TextField label="E-mail" value={user?.email ?? ''} disabled />
        {error ? <span className="text-caption text-danger">{error}</span> : null}
        {saved ? <span className="text-caption text-primary">Salvo.</span> : null}
        <Button label="Salvar" onClick={() => name.trim() && save.mutate()} loading={save.isPending} className="w-fit" />
      </Card>
    </>
  );
}
