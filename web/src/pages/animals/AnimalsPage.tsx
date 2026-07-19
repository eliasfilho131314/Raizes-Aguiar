import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Scale, Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { Badge } from '../../components/Badge';
import { animalsApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useFarm } from '../../auth/FarmContext';
import type { Animal, AnimalCategory, AnimalSex, AnimalStatus } from '../../api/types';

const CATEGORIES: { key: AnimalCategory; label: string }[] = [
  { key: 'bezerro', label: 'Bezerro' },
  { key: 'bezerra', label: 'Bezerra' },
  { key: 'garrote', label: 'Garrote' },
  { key: 'novilha', label: 'Novilha' },
  { key: 'novilho', label: 'Novilho' },
  { key: 'boi', label: 'Boi' },
  { key: 'vaca', label: 'Vaca' },
  { key: 'touro', label: 'Touro' },
  { key: 'matriz', label: 'Matriz' },
  { key: 'reprodutor', label: 'Reprodutor' },
];

const STATUS_LABELS: Record<AnimalStatus, string> = {
  ativo: 'Ativo',
  vendido: 'Vendido',
  abatido: 'Abatido',
  morto: 'Morto',
};

const STATUS_TONE: Record<AnimalStatus, 'olive' | 'brown' | 'danger' | 'neutral'> = {
  ativo: 'olive',
  vendido: 'brown',
  abatido: 'neutral',
  morto: 'danger',
};

function CreateAnimalForm({ farmId }: { farmId: string }) {
  const queryClient = useQueryClient();
  const [numero, setNumero] = useState('');
  const [brinco, setBrinco] = useState('');
  const [nome, setNome] = useState('');
  const [sexo, setSexo] = useState<AnimalSex>('femea');
  const [categoria, setCategoria] = useState<AnimalCategory>('bezerra');
  const [raca, setRaca] = useState('');
  const [lote, setLote] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [pesoNascimento, setPesoNascimento] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      animalsApi.create({
        fazendaId: farmId,
        numero: numero.trim() || undefined,
        brinco: brinco.trim() || undefined,
        nome: nome.trim() || undefined,
        sexo,
        categoria,
        raca: raca.trim() || undefined,
        lote: lote.trim() || undefined,
        dataNascimento: dataNascimento || undefined,
        pesoNascimentoKg: pesoNascimento ? Number(pesoNascimento) : undefined,
      }),
    onSuccess: () => {
      setNumero('');
      setBrinco('');
      setNome('');
      setRaca('');
      setLote('');
      setDataNascimento('');
      setPesoNascimento('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'animais', farmId] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'dashboard', farmId] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível cadastrar o animal.'),
  });

  return (
    <Card span="col-span-12" className="flex flex-col gap-sm">
      <h2 className="text-sm font-semibold uppercase text-text-secondary">Novo animal</h2>
      <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
        <TextField label="Número" value={numero} onChange={(e) => setNumero(e.target.value)} />
        <TextField label="Brinco" value={brinco} onChange={(e) => setBrinco(e.target.value)} />
        <TextField label="Nome (opcional)" value={nome} onChange={(e) => setNome(e.target.value)} />
        <TextField label="Raça" value={raca} onChange={(e) => setRaca(e.target.value)} />
        <Select
          label="Sexo"
          value={sexo}
          onChange={(v) => setSexo(v as AnimalSex)}
          options={[
            { value: 'femea', label: 'Fêmea' },
            { value: 'macho', label: 'Macho' },
          ]}
        />
        <Select label="Categoria" value={categoria} onChange={(v) => setCategoria(v as AnimalCategory)} options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))} />
        <TextField label="Lote" value={lote} onChange={(e) => setLote(e.target.value)} />
        <TextField label="Data de nascimento" type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
        <TextField label="Peso ao nascer (kg)" type="number" value={pesoNascimento} onChange={(e) => setPesoNascimento(e.target.value)} />
      </div>
      {error ? <span className="text-caption text-danger">{error}</span> : null}
      <Button label="Cadastrar animal" onClick={() => create.mutate()} loading={create.isPending} className="w-fit" />
    </Card>
  );
}

function WeighingSection({ animal }: { animal: Animal }) {
  const queryClient = useQueryClient();
  const { data: weighings } = useQuery({ queryKey: ['weighings', animal.id], queryFn: () => animalsApi.listWeighings(animal.id) });
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [pesoKg, setPesoKg] = useState('');

  const addWeighing = useMutation({
    mutationFn: () => animalsApi.addWeighing({ animalId: animal.id, data, pesoKg: Number(pesoKg) }),
    onSuccess: () => {
      setPesoKg('');
      queryClient.invalidateQueries({ queryKey: ['weighings', animal.id] });
    },
  });

  return (
    <div className="mt-sm flex flex-col gap-sm border-t border-border pt-sm">
      <div className="flex flex-wrap items-end gap-sm">
        <TextField label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        <TextField label="Peso (kg)" type="number" value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} />
        <Button label="Registrar pesagem" variant="secondary" onClick={() => pesoKg && addWeighing.mutate()} loading={addWeighing.isPending} className="mb-0.5 w-fit" />
      </div>
      {weighings && weighings.length > 0 ? (
        <div className="flex flex-wrap gap-xs">
          {weighings.map((w) => (
            <span key={w.id} className="rounded-full border border-border bg-surface-alt px-3 py-1 text-caption text-text-primary">
              {new Date(w.data).toLocaleDateString('pt-BR')}: {w.pesoKg}kg
            </span>
          ))}
        </div>
      ) : (
        <p className="text-caption text-text-secondary">Nenhuma pesagem registrada ainda.</p>
      )}
    </div>
  );
}

export function AnimalsPage() {
  const { selectedFarm } = useFarm();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const farmId = selectedFarm!.id;

  const { data: animals } = useQuery({ queryKey: ['farm-data', 'animais', farmId], queryFn: () => animalsApi.list(farmId) });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AnimalStatus }) => animalsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'animais', farmId] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'dashboard', farmId] });
    },
  });

  const deleteAnimal = useMutation({
    mutationFn: (id: string) => animalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'animais', farmId] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'dashboard', farmId] });
    },
  });

  const canManage = selectedFarm!.myRole === 'administrador' || selectedFarm!.myRole === 'gerente';

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Pecuária</h1>
      </div>

      <CreateAnimalForm farmId={farmId} />

      {!animals || animals.length === 0 ? (
        <Card span="col-span-12" className="py-lg text-center text-body text-text-secondary">
          Nenhum animal cadastrado ainda.
        </Card>
      ) : (
        animals.map((animal) => (
          <Card key={animal.id} span="col-span-12 lg:col-span-6">
            <div className="flex items-start justify-between gap-sm">
              <div>
                <p className="text-body font-semibold text-text-primary">
                  {animal.nome || animal.numero || animal.brinco || 'Sem identificação'}
                </p>
                <p className="text-caption text-text-secondary">
                  {CATEGORIES.find((c) => c.key === animal.categoria)?.label ?? animal.categoria} · {animal.sexo === 'macho' ? 'Macho' : 'Fêmea'}
                  {animal.raca ? ` · ${animal.raca}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-sm">
                <Badge label={STATUS_LABELS[animal.status]} tone={STATUS_TONE[animal.status]} />
                {canManage ? (
                  <button type="button" onClick={() => deleteAnimal.mutate(animal.id)} className="text-text-secondary hover:text-danger" aria-label="Remover animal">
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
            </div>

            {canManage && animal.status === 'ativo' ? (
              <div className="mt-sm flex flex-wrap gap-xs">
                <button type="button" onClick={() => updateStatus.mutate({ id: animal.id, status: 'vendido' })} className="rounded-button border border-border px-sm py-1 text-caption text-text-primary hover:bg-surface-alt">
                  Marcar vendido
                </button>
                <button type="button" onClick={() => updateStatus.mutate({ id: animal.id, status: 'abatido' })} className="rounded-button border border-border px-sm py-1 text-caption text-text-primary hover:bg-surface-alt">
                  Marcar abatido
                </button>
                <button type="button" onClick={() => updateStatus.mutate({ id: animal.id, status: 'morto' })} className="rounded-button border border-border px-sm py-1 text-caption text-danger hover:bg-surface-alt">
                  Registrar morte
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setExpandedId(expandedId === animal.id ? null : animal.id)}
              className="mt-sm flex items-center gap-1 text-caption text-primary hover:underline"
            >
              <Scale size={14} /> {expandedId === animal.id ? 'Ocultar pesagens' : 'Ver pesagens'}
            </button>

            {expandedId === animal.id ? <WeighingSection animal={animal} /> : null}
          </Card>
        ))
      )}
    </>
  );
}
