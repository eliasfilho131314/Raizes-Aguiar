import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { confinementApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useFarm } from '../../auth/FarmContext';

function CreateBatchForm({ farmId }: { farmId: string }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().slice(0, 10));
  const [dataSaidaPrevista, setDataSaidaPrevista] = useState('');
  const [quantidadeAnimais, setQuantidadeAnimais] = useState('');
  const [pesoMedioEntrada, setPesoMedioEntrada] = useState('');
  const [consumoRacao, setConsumoRacao] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      confinementApi.create({
        fazendaId: farmId,
        nome: nome.trim(),
        dataEntrada,
        dataSaidaPrevista: dataSaidaPrevista || undefined,
        quantidadeAnimais: quantidadeAnimais ? Number(quantidadeAnimais) : 0,
        pesoMedioEntradaKg: pesoMedioEntrada ? Number(pesoMedioEntrada) : undefined,
        consumoRacaoKgDia: consumoRacao ? Number(consumoRacao) : undefined,
      }),
    onSuccess: () => {
      setNome('');
      setDataSaidaPrevista('');
      setQuantidadeAnimais('');
      setPesoMedioEntrada('');
      setConsumoRacao('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'confinamento', farmId] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível cadastrar o lote.'),
  });

  return (
    <Card span="col-span-12" className="flex flex-col gap-sm">
      <h2 className="text-sm font-semibold uppercase text-text-secondary">Novo lote de confinamento</h2>
      <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
        <TextField label="Nome do lote" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Curral 2 — engorda" />
        <TextField label="Quantidade de animais" type="number" value={quantidadeAnimais} onChange={(e) => setQuantidadeAnimais(e.target.value)} />
        <TextField label="Peso médio de entrada (kg, opcional)" type="number" value={pesoMedioEntrada} onChange={(e) => setPesoMedioEntrada(e.target.value)} />
        <TextField label="Consumo de ração (kg/dia, opcional)" type="number" value={consumoRacao} onChange={(e) => setConsumoRacao(e.target.value)} />
        <TextField label="Data de entrada" type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} />
        <TextField label="Previsão de saída (opcional)" type="date" value={dataSaidaPrevista} onChange={(e) => setDataSaidaPrevista(e.target.value)} />
      </div>
      {error ? <span className="text-caption text-danger">{error}</span> : null}
      <Button label="Cadastrar lote" onClick={() => nome.trim() && create.mutate()} loading={create.isPending} className="w-fit" />
    </Card>
  );
}

export function ConfinementPage() {
  const { selectedFarm } = useFarm();
  const farmId = selectedFarm!.id;
  const queryClient = useQueryClient();

  const { data: batches } = useQuery({ queryKey: ['farm-data', 'confinamento', farmId], queryFn: () => confinementApi.list(farmId) });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ativo' | 'finalizado' }) => confinementApi.setStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-data', 'confinamento', farmId] }),
  });

  const deleteBatch = useMutation({
    mutationFn: (id: string) => confinementApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-data', 'confinamento', farmId] }),
  });

  const canDelete = selectedFarm!.myRole === 'administrador' || selectedFarm!.myRole === 'gerente';
  const today = new Date();

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Confinamento</h1>
      </div>

      <CreateBatchForm farmId={farmId} />

      {!batches || batches.length === 0 ? (
        <Card span="col-span-12" className="py-lg text-center text-body text-text-secondary">
          Nenhum lote de confinamento cadastrado ainda.
        </Card>
      ) : (
        batches.map((batch) => {
          const dias = Math.max(0, Math.round((today.getTime() - new Date(`${batch.dataEntrada}T00:00:00`).getTime()) / 86_400_000));
          return (
            <Card key={batch.id} span="col-span-12 lg:col-span-6">
              <div className="flex items-start justify-between gap-sm">
                <div>
                  <p className="text-body font-semibold text-text-primary">{batch.nome}</p>
                  <p className="text-caption text-text-secondary">
                    {batch.quantidadeAnimais} animais · {dias} dias em confinamento
                    {batch.pesoMedioEntradaKg ? ` · entrada ${batch.pesoMedioEntradaKg}kg` : ''}
                    {batch.consumoRacaoKgDia ? ` · ${batch.consumoRacaoKgDia}kg ração/dia` : ''}
                    {batch.dataSaidaPrevista ? ` · previsão de saída ${new Date(`${batch.dataSaidaPrevista}T00:00:00`).toLocaleDateString('pt-BR')}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-sm">
                  <button
                    type="button"
                    onClick={() => setStatus.mutate({ id: batch.id, status: batch.status === 'ativo' ? 'finalizado' : 'ativo' })}
                  >
                    <Badge label={batch.status === 'ativo' ? 'Ativo' : 'Finalizado'} tone={batch.status === 'ativo' ? 'olive' : 'neutral'} />
                  </button>
                  {canDelete ? (
                    <button type="button" onClick={() => deleteBatch.mutate(batch.id)} className="text-text-secondary hover:text-danger" aria-label="Remover lote">
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })
      )}
    </>
  );
}
