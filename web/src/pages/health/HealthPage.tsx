import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { animalsApi, healthApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useFarm } from '../../auth/FarmContext';
import type { HealthRecordType } from '../../api/types';

const HEALTH_TYPES: { key: HealthRecordType; label: string }[] = [
  { key: 'vacina', label: 'Vacina' },
  { key: 'medicamento', label: 'Medicamento' },
  { key: 'vermifugo', label: 'Vermífugo' },
  { key: 'exame', label: 'Exame' },
  { key: 'outro', label: 'Outro' },
];

export function HealthPage() {
  const { selectedFarm } = useFarm();
  const farmId = selectedFarm!.id;
  const queryClient = useQueryClient();

  const { data: animals } = useQuery({ queryKey: ['farm-data', 'animais', farmId], queryFn: () => animalsApi.list(farmId) });
  const { data: records } = useQuery({ queryKey: ['farm-data', 'sanidade', farmId], queryFn: () => healthApi.listForFarm(farmId) });

  const [animalId, setAnimalId] = useState('');
  const [tipo, setTipo] = useState<HealthRecordType>('vacina');
  const [produto, setProduto] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [proximaAplicacao, setProximaAplicacao] = useState('');
  const [veterinario, setVeterinario] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeAnimals = (animals ?? []).filter((a) => a.status === 'ativo');

  // O <select> já mostra o primeiro animal ativo mesmo sem o usuário
  // mexer nele -- sem isso, o estado ficava vazio até uma escolha manual
  // e o registro ia com animalId='' (falhava a insert sem nenhum aviso).
  useEffect(() => {
    if (!animalId && activeAnimals.length > 0) setAnimalId(activeAnimals[0].id);
  }, [animalId, activeAnimals]);

  const create = useMutation({
    mutationFn: () =>
      healthApi.create({
        animalId,
        tipo,
        produto: produto.trim(),
        data,
        proximaAplicacao: proximaAplicacao || undefined,
        veterinario: veterinario.trim() || undefined,
      }),
    onSuccess: () => {
      setProduto('');
      setProximaAplicacao('');
      setVeterinario('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'sanidade', farmId] });
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível registrar.'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => healthApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-data', 'sanidade', farmId] }),
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (records ?? []).filter((r) => r.proximaAplicacao && r.proximaAplicacao >= today);

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Sanidade</h1>
      </div>

      <Card span="col-span-12" className="flex flex-col gap-sm">
        <h2 className="text-sm font-semibold uppercase text-text-secondary">Novo registro</h2>
        {activeAnimals.length === 0 ? (
          <p className="text-body text-text-secondary">Cadastre um animal ativo em Pecuária antes de registrar sanidade.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
              <Select
                label="Animal"
                value={animalId}
                onChange={setAnimalId}
                options={activeAnimals.map((a) => ({ value: a.id, label: a.nome || a.numero || a.brinco || a.id.slice(0, 8) }))}
              />
              <Select label="Tipo" value={tipo} onChange={(v) => setTipo(v as HealthRecordType)} options={HEALTH_TYPES.map((t) => ({ value: t.key, label: t.label }))} />
              <TextField label="Produto/procedimento" value={produto} onChange={(e) => setProduto(e.target.value)} />
              <TextField label="Veterinário (opcional)" value={veterinario} onChange={(e) => setVeterinario(e.target.value)} />
              <TextField label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
              <TextField label="Próxima aplicação (opcional)" type="date" value={proximaAplicacao} onChange={(e) => setProximaAplicacao(e.target.value)} />
            </div>
            {error ? <span className="text-caption text-danger">{error}</span> : null}
            <Button
              label="Registrar"
              onClick={() => produto.trim() && animalId && create.mutate()}
              loading={create.isPending}
              disabled={!animalId}
              className="w-fit"
            />
          </>
        )}
      </Card>

      {upcoming.length > 0 ? (
        <Card span="col-span-12" className="flex flex-col gap-xs">
          <h2 className="flex items-center gap-1 text-sm font-semibold uppercase text-olive">
            <Clock size={14} /> Próximas aplicações
          </h2>
          {upcoming.map((r) => (
            <p key={r.id} className="text-caption text-text-primary">
              {new Date(r.proximaAplicacao!).toLocaleDateString('pt-BR')} — {r.animalLabel}: {r.produto}
            </p>
          ))}
        </Card>
      ) : null}

      <div className="col-span-12">
        <h2 className="text-subtitle font-semibold text-text-primary">Histórico</h2>
      </div>

      {!records || records.length === 0 ? (
        <Card span="col-span-12" className="py-lg text-center text-body text-text-secondary">
          Nenhum registro sanitário ainda.
        </Card>
      ) : (
        records.map((r) => (
          <Card key={r.id} span="col-span-12 lg:col-span-6" className="flex items-center justify-between">
            <div>
              <p className="text-body font-semibold text-text-primary">
                {HEALTH_TYPES.find((t) => t.key === r.tipo)?.label} — {r.produto}
              </p>
              <p className="text-caption text-text-secondary">
                {r.animalLabel} · {new Date(r.data).toLocaleDateString('pt-BR')}
                {r.veterinario ? ` · ${r.veterinario}` : ''}
                {r.proximaAplicacao ? ` · próxima: ${new Date(r.proximaAplicacao).toLocaleDateString('pt-BR')}` : ''}
              </p>
            </div>
            <button type="button" onClick={() => remove.mutate(r.id)} className="text-text-secondary hover:text-danger" aria-label="Remover registro">
              <Trash2 size={16} />
            </button>
          </Card>
        ))
      )}
    </>
  );
}
