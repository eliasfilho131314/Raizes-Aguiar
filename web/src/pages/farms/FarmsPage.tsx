import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserPlus } from 'lucide-react';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { Badge } from '../../components/Badge';
import { farmsApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useFarm } from '../../auth/FarmContext';
import type { FarmRole } from '../../api/types';

const ROLE_LABELS: Record<FarmRole, string> = {
  administrador: 'Administrador',
  gerente: 'Gerente',
  funcionario: 'Funcionário',
};

function CreateFarmForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [areaHectares, setAreaHectares] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const farm = await farmsApi.create({
        name: name.trim(),
        location: location.trim() || undefined,
        areaHectares: areaHectares ? Number(areaHectares) : undefined,
      });
      await farmsApi.seedDefaultFinanceCategories(farm.id);
      return farm;
    },
    onSuccess: () => {
      setName('');
      setLocation('');
      setAreaHectares('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['farms'] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível criar a fazenda.'),
  });

  return (
    <Card span="col-span-12 lg:col-span-5" className="flex flex-col gap-sm">
      <h2 className="text-sm font-semibold uppercase text-text-secondary">Nova fazenda</h2>
      <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Fazenda Santa Helena" />
      <TextField label="Localização (opcional)" value={location} onChange={(e) => setLocation(e.target.value)} />
      <TextField label="Área em hectares (opcional)" type="number" value={areaHectares} onChange={(e) => setAreaHectares(e.target.value)} />
      {error ? <span className="text-caption text-danger">{error}</span> : null}
      <Button label="Criar fazenda" onClick={() => name.trim() && create.mutate()} loading={create.isPending} className="w-fit" />
    </Card>
  );
}

function MembersSection({ farmId, myRole }: { farmId: string; myRole: FarmRole }) {
  const queryClient = useQueryClient();
  const { data: members } = useQuery({ queryKey: ['farm-members', farmId], queryFn: () => farmsApi.listMembers(farmId) });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<FarmRole>('funcionario');
  const [error, setError] = useState<string | null>(null);

  const invite = useMutation({
    mutationFn: () => farmsApi.inviteMember(farmId, email.trim(), role),
    onSuccess: () => {
      setEmail('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['farm-members', farmId] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível convidar esse e-mail.'),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => farmsApi.removeMember(farmId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-members', farmId] }),
  });

  if (myRole !== 'administrador') return null;

  return (
    <Card span="col-span-12 lg:col-span-7" className="flex flex-col gap-sm">
      <h2 className="text-sm font-semibold uppercase text-text-secondary">Equipe</h2>
      <div className="flex flex-wrap items-end gap-sm">
        <TextField label="E-mail da pessoa (já precisa ter conta)" value={email} onChange={(e) => setEmail(e.target.value)} className="min-w-[220px] flex-1" />
        <Select
          label="Papel"
          value={role}
          onChange={(v) => setRole(v as FarmRole)}
          options={[
            { value: 'gerente', label: 'Gerente' },
            { value: 'funcionario', label: 'Funcionário' },
          ]}
        />
        <Button label="Convidar" onClick={() => email.trim() && invite.mutate()} loading={invite.isPending} className="mb-0.5 w-fit" />
      </div>
      {error ? <span className="text-caption text-danger">{error}</span> : null}
      <div className="flex flex-col gap-xs">
        {(members ?? []).map((m) => (
          <div key={m.userId} className="flex items-center justify-between rounded-button border border-border bg-surface-alt px-md py-sm">
            <div>
              <p className="text-sm font-medium text-text-primary">{m.name}</p>
              <p className="text-caption text-text-secondary">{m.email}</p>
            </div>
            <div className="flex items-center gap-sm">
              <Badge label={ROLE_LABELS[m.role]} tone={m.role === 'administrador' ? 'primary' : 'neutral'} />
              {m.role !== 'administrador' ? (
                <button type="button" onClick={() => remove.mutate(m.userId)} className="text-text-secondary hover:text-danger" aria-label="Remover membro">
                  <Trash2 size={16} />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function FarmsPage() {
  const { farms } = useFarm();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const deleteFarm = useMutation({
    mutationFn: (id: string) => farmsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farms'] }),
  });

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Fazendas</h1>
      </div>

      <CreateFarmForm />

      <div className="col-span-12 flex flex-col gap-sm lg:col-span-7">
        {farms.map((farm) => (
          <Card key={farm.id} className="flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body font-semibold text-text-primary">{farm.name}</p>
                <p className="text-caption text-text-secondary">{farm.location ?? 'Sem localização cadastrada'}</p>
              </div>
              <div className="flex items-center gap-sm">
                <Badge label={ROLE_LABELS[farm.myRole]} tone={farm.myRole === 'administrador' ? 'primary' : 'neutral'} />
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === farm.id ? null : farm.id)}
                  className="rounded-button border border-border px-sm py-1 text-caption text-text-primary hover:bg-surface-alt"
                >
                  <UserPlus size={14} className="inline" /> Equipe
                </button>
                {farm.myRole === 'administrador' ? (
                  <button
                    type="button"
                    onClick={() => deleteFarm.mutate(farm.id)}
                    className="text-text-secondary hover:text-danger"
                    aria-label="Excluir fazenda"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
            </div>
            {expandedId === farm.id ? <MembersSection farmId={farm.id} myRole={farm.myRole} /> : null}
          </Card>
        ))}
      </div>
    </>
  );
}
