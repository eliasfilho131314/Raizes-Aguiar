import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Scale, Syringe, Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { Badge } from '../../components/Badge';
import { animalsApi, healthApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useFarm } from '../../auth/FarmContext';
import type { Animal, AnimalCategory, AnimalSex, AnimalStatus, HealthRecordType } from '../../api/types';

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

// Categoria já implica o sexo biológico -- acoplar evita o caso real de um
// usuário cadastrar "touro" com sexo "fêmea" só porque o campo de sexo
// ficou com o valor do animal cadastrado antes (o formulário não reseta
// sexo/categoria entre cadastros, de propósito, pra agilizar lotes
// parecidos -- mas sexo sempre devia seguir a categoria escolhida).
const CATEGORY_SEXO: Record<AnimalCategory, AnimalSex> = {
  bezerro: 'macho',
  bezerra: 'femea',
  garrote: 'macho',
  novilha: 'femea',
  novilho: 'macho',
  boi: 'macho',
  vaca: 'femea',
  touro: 'macho',
  matriz: 'femea',
  reprodutor: 'macho',
};

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

const HEALTH_TYPES: { key: HealthRecordType; label: string }[] = [
  { key: 'vacina', label: 'Vacina' },
  { key: 'medicamento', label: 'Medicamento' },
  { key: 'vermifugo', label: 'Vermífugo' },
  { key: 'exame', label: 'Exame' },
  { key: 'outro', label: 'Outro' },
];

function animalLabel(animal: Pick<Animal, 'nome' | 'numero' | 'brinco'>): string {
  return animal.nome || animal.numero || animal.brinco || 'Sem identificação';
}

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
  const [origem, setOrigem] = useState('');
  const [valorCompra, setValorCompra] = useState('');
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
        origem: origem.trim() || undefined,
        valorCompra: valorCompra ? Number(valorCompra) : undefined,
      }),
    onSuccess: () => {
      setNumero('');
      setBrinco('');
      setNome('');
      setRaca('');
      setLote('');
      setDataNascimento('');
      setPesoNascimento('');
      setOrigem('');
      setValorCompra('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'animais', farmId] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'dashboard', farmId] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'finance-transactions', farmId] });
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
        <Select
          label="Categoria"
          value={categoria}
          onChange={(v) => {
            const nextCategoria = v as AnimalCategory;
            setCategoria(nextCategoria);
            setSexo(CATEGORY_SEXO[nextCategoria]);
          }}
          options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))}
        />
        <TextField label="Lote" value={lote} onChange={(e) => setLote(e.target.value)} />
        <TextField label="Data de nascimento" type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
        <TextField label="Peso ao nascer (kg)" type="number" value={pesoNascimento} onChange={(e) => setPesoNascimento(e.target.value)} />
        <TextField label="Origem (opcional)" value={origem} onChange={(e) => setOrigem(e.target.value)} placeholder="Ex: nascimento próprio, compra" />
        <TextField label="Valor de compra (R$, opcional)" type="number" value={valorCompra} onChange={(e) => setValorCompra(e.target.value)} />
      </div>
      {valorCompra ? (
        <span className="text-caption text-text-secondary">Vai lançar uma despesa de "Compra de gado" no Financeiro automaticamente.</span>
      ) : null}
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

function HealthSection({ animal }: { animal: Animal }) {
  const queryClient = useQueryClient();
  const { data: records } = useQuery({ queryKey: ['health-records', animal.id], queryFn: () => healthApi.listForAnimal(animal.id) });
  const [tipo, setTipo] = useState<HealthRecordType>('vacina');
  const [produto, setProduto] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [proximaAplicacao, setProximaAplicacao] = useState('');

  const addRecord = useMutation({
    mutationFn: () => healthApi.create({ animalId: animal.id, tipo, produto: produto.trim(), data, proximaAplicacao: proximaAplicacao || undefined }),
    onSuccess: () => {
      setProduto('');
      setProximaAplicacao('');
      queryClient.invalidateQueries({ queryKey: ['health-records', animal.id] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'sanidade'] });
    },
  });

  return (
    <div className="mt-sm flex flex-col gap-sm border-t border-border pt-sm">
      <div className="flex flex-wrap items-end gap-sm">
        <Select label="Tipo" value={tipo} onChange={(v) => setTipo(v as HealthRecordType)} options={HEALTH_TYPES.map((t) => ({ value: t.key, label: t.label }))} />
        <TextField label="Produto/procedimento" value={produto} onChange={(e) => setProduto(e.target.value)} />
        <TextField label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        <TextField label="Próxima aplicação (opcional)" type="date" value={proximaAplicacao} onChange={(e) => setProximaAplicacao(e.target.value)} />
        <Button label="Registrar" variant="secondary" onClick={() => produto.trim() && addRecord.mutate()} loading={addRecord.isPending} className="mb-0.5 w-fit" />
      </div>
      {records && records.length > 0 ? (
        <div className="flex flex-col gap-1">
          {records.map((r) => (
            <p key={r.id} className="text-caption text-text-primary">
              {HEALTH_TYPES.find((t) => t.key === r.tipo)?.label} — {r.produto} ({new Date(r.data).toLocaleDateString('pt-BR')})
              {r.proximaAplicacao ? ` · próxima: ${new Date(r.proximaAplicacao).toLocaleDateString('pt-BR')}` : ''}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-caption text-text-secondary">Nenhum registro sanitário ainda.</p>
      )}
    </div>
  );
}

function ExitForm({ animal, status, farmId, onDone }: { animal: Animal; status: AnimalStatus; farmId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [valor, setValor] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const needsValue = status === 'vendido' || status === 'abatido';

  const confirm = useMutation({
    mutationFn: () =>
      animalsApi.registerExit({
        id: animal.id,
        fazendaId: farmId,
        status: status as 'vendido' | 'abatido' | 'morto',
        dataSaida: data,
        valorSaida: valor ? Number(valor) : undefined,
        observacoesSaida: observacoes.trim() || undefined,
        animalLabel: animalLabel(animal),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'animais', farmId] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'dashboard', farmId] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'finance-transactions', farmId] });
      onDone();
    },
  });

  const titles: Record<string, string> = { vendido: 'Confirmar venda', abatido: 'Confirmar abate', morto: 'Registrar morte' };

  return (
    <div className="mt-sm flex flex-col gap-sm border-t border-border pt-sm">
      <p className="text-caption font-semibold text-text-secondary">{titles[status]}</p>
      <div className="flex flex-wrap items-end gap-sm">
        <TextField label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        {needsValue ? <TextField label="Valor (R$)" type="number" value={valor} onChange={(e) => setValor(e.target.value)} /> : null}
        <TextField
          label={status === 'morto' ? 'Motivo (opcional)' : 'Comprador/observações (opcional)'}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="min-w-[220px] flex-1"
        />
      </div>
      <div className="flex gap-sm">
        <Button label="Confirmar" variant={status === 'morto' ? 'danger' : 'primary'} onClick={() => confirm.mutate()} loading={confirm.isPending} className="w-fit" />
        <Button label="Cancelar" variant="secondary" onClick={onDone} className="w-fit" />
      </div>
    </div>
  );
}

export function AnimalsPage() {
  const { selectedFarm } = useFarm();
  const queryClient = useQueryClient();
  const [expandedSection, setExpandedSection] = useState<{ animalId: string; section: 'pesagens' | 'sanidade' } | null>(null);
  const [pendingExit, setPendingExit] = useState<{ animalId: string; status: AnimalStatus } | null>(null);
  const farmId = selectedFarm!.id;

  const { data: animals } = useQuery({ queryKey: ['farm-data', 'animais', farmId], queryFn: () => animalsApi.list(farmId) });

  const deleteAnimal = useMutation({
    mutationFn: (id: string) => animalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'animais', farmId] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'dashboard', farmId] });
    },
  });

  const canManage = selectedFarm!.myRole === 'administrador' || selectedFarm!.myRole === 'gerente';

  function toggleSection(animalId: string, section: 'pesagens' | 'sanidade') {
    setExpandedSection((current) => (current?.animalId === animalId && current.section === section ? null : { animalId, section }));
  }

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
                <p className="text-body font-semibold text-text-primary">{animalLabel(animal)}</p>
                <p className="text-caption text-text-secondary">
                  {CATEGORIES.find((c) => c.key === animal.categoria)?.label ?? animal.categoria} · {animal.sexo === 'macho' ? 'Macho' : 'Fêmea'}
                  {animal.raca ? ` · ${animal.raca}` : ''}
                  {animal.brinco ? ` · Brinco ${animal.brinco}` : ''}
                </p>
                {animal.origem || animal.valorCompra ? (
                  <p className="text-caption text-text-secondary">
                    {animal.origem ? animal.origem : 'Compra'}
                    {animal.valorCompra ? ` · R$ ${animal.valorCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                  </p>
                ) : null}
                {animal.status !== 'ativo' && animal.dataSaida ? (
                  <p className="text-caption text-text-secondary">
                    {STATUS_LABELS[animal.status]} em {new Date(animal.dataSaida).toLocaleDateString('pt-BR')}
                    {animal.valorSaida ? ` · R$ ${animal.valorSaida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                    {animal.observacoesSaida ? ` · ${animal.observacoesSaida}` : ''}
                  </p>
                ) : null}
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

            {animal.status === 'ativo' && pendingExit?.animalId !== animal.id ? (
              <div className="mt-sm flex flex-wrap gap-xs">
                {canManage ? (
                  <>
                    <button type="button" onClick={() => setPendingExit({ animalId: animal.id, status: 'vendido' })} className="rounded-button border border-border px-sm py-1 text-caption text-text-primary hover:bg-surface-alt">
                      Marcar vendido
                    </button>
                    <button type="button" onClick={() => setPendingExit({ animalId: animal.id, status: 'abatido' })} className="rounded-button border border-border px-sm py-1 text-caption text-text-primary hover:bg-surface-alt">
                      Marcar abatido
                    </button>
                  </>
                ) : null}
                {/* Funcionário registra mortalidade por conta própria (PERFIS DE ACESSO) --
                    venda/abate ficam restritos a admin/gerente por gerarem lançamento financeiro. */}
                <button type="button" onClick={() => setPendingExit({ animalId: animal.id, status: 'morto' })} className="rounded-button border border-border px-sm py-1 text-caption text-danger hover:bg-surface-alt">
                  Registrar morte
                </button>
              </div>
            ) : null}

            {pendingExit?.animalId === animal.id ? (
              <ExitForm animal={animal} status={pendingExit.status} farmId={farmId} onDone={() => setPendingExit(null)} />
            ) : null}

            <div className="mt-sm flex gap-md">
              <button
                type="button"
                onClick={() => toggleSection(animal.id, 'pesagens')}
                className="flex items-center gap-1 text-caption text-primary hover:underline"
              >
                <Scale size={14} /> {expandedSection?.animalId === animal.id && expandedSection.section === 'pesagens' ? 'Ocultar pesagens' : 'Ver pesagens'}
              </button>
              <button
                type="button"
                onClick={() => toggleSection(animal.id, 'sanidade')}
                className="flex items-center gap-1 text-caption text-primary hover:underline"
              >
                <Syringe size={14} /> {expandedSection?.animalId === animal.id && expandedSection.section === 'sanidade' ? 'Ocultar sanidade' : 'Ver sanidade'}
              </button>
            </div>

            {expandedSection?.animalId === animal.id && expandedSection.section === 'pesagens' ? <WeighingSection animal={animal} /> : null}
            {expandedSection?.animalId === animal.id && expandedSection.section === 'sanidade' ? <HealthSection animal={animal} /> : null}
          </Card>
        ))
      )}
    </>
  );
}
