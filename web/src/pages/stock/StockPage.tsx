import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { stockApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useFarm } from '../../auth/FarmContext';
import type { StockCategory, StockItem, StockMovementType } from '../../api/types';

const CATEGORIES: { key: StockCategory; label: string }[] = [
  { key: 'racao', label: 'Ração e suplementos' },
  { key: 'medicamento', label: 'Medicamentos e vacinas' },
  { key: 'combustivel', label: 'Combustível' },
  { key: 'outro', label: 'Outro' },
];

function CreateItemForm({ farmId }: { farmId: string }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<StockCategory>('racao');
  const [unidade, setUnidade] = useState('kg');
  const [quantidadeMinima, setQuantidadeMinima] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      stockApi.createItem({
        fazendaId: farmId,
        nome: nome.trim(),
        categoria,
        unidade: unidade.trim() || 'un',
        quantidadeMinima: quantidadeMinima ? Number(quantidadeMinima) : undefined,
      }),
    onSuccess: () => {
      setNome('');
      setUnidade('kg');
      setQuantidadeMinima('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'estoque', farmId] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível cadastrar o item.'),
  });

  return (
    <Card span="col-span-12" className="flex flex-col gap-sm">
      <h2 className="text-sm font-semibold uppercase text-text-secondary">Novo item</h2>
      <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
        <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Sal mineral" />
        <Select label="Categoria" value={categoria} onChange={(v) => setCategoria(v as StockCategory)} options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))} />
        <TextField label="Unidade" value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="kg, l, sc, un" />
        <TextField label="Estoque mínimo (opcional)" type="number" value={quantidadeMinima} onChange={(e) => setQuantidadeMinima(e.target.value)} />
      </div>
      {error ? <span className="text-caption text-danger">{error}</span> : null}
      <Button label="Cadastrar item" onClick={() => nome.trim() && create.mutate()} loading={create.isPending} className="w-fit" />
    </Card>
  );
}

function MovementSection({ item, farmId }: { item: StockItem; farmId: string }) {
  const queryClient = useQueryClient();
  const { data: movements } = useQuery({ queryKey: ['stock-movements', item.id], queryFn: () => stockApi.listMovements(item.id) });
  const [tipo, setTipo] = useState<StockMovementType>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const addMovement = useMutation({
    mutationFn: () =>
      stockApi.addMovement({
        itemId: item.id,
        fazendaId: farmId,
        itemNome: item.nome,
        itemCategoria: item.categoria,
        tipo,
        quantidade: Number(quantidade),
        valorTotal: tipo === 'entrada' && valorTotal ? Number(valorTotal) : undefined,
        data,
      }),
    onSuccess: () => {
      setQuantidade('');
      setValorTotal('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['stock-movements', item.id] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'estoque', farmId] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'finance-transactions', farmId] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível registrar a movimentação.'),
  });

  return (
    <div className="mt-sm flex flex-col gap-sm border-t border-border pt-sm">
      <div className="flex flex-wrap items-end gap-sm">
        <Select
          label="Tipo"
          value={tipo}
          onChange={(v) => setTipo(v as StockMovementType)}
          options={[
            { value: 'entrada', label: 'Entrada (compra)' },
            { value: 'saida', label: 'Saída (uso)' },
          ]}
        />
        <TextField label={`Quantidade (${item.unidade})`} type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        {tipo === 'entrada' ? (
          <TextField label="Valor total (R$, opcional)" type="number" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} />
        ) : null}
        <TextField label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        <Button
          label="Registrar"
          variant="secondary"
          onClick={() => Number(quantidade) > 0 && addMovement.mutate()}
          loading={addMovement.isPending}
          className="mb-0.5 w-fit"
        />
      </div>
      {tipo === 'entrada' && valorTotal ? (
        <span className="text-caption text-text-secondary">Vai lançar uma despesa no Financeiro automaticamente.</span>
      ) : null}
      {error ? <span className="text-caption text-danger">{error}</span> : null}
      {movements && movements.length > 0 ? (
        <div className="flex flex-col gap-1">
          {movements.map((m) => (
            <p key={m.id} className="flex items-center gap-1 text-caption text-text-primary">
              {m.tipo === 'entrada' ? <ArrowUpCircle size={14} className="text-olive" /> : <ArrowDownCircle size={14} className="text-text-secondary" />}
              {new Date(m.data).toLocaleDateString('pt-BR')} · {m.tipo === 'entrada' ? '+' : '-'}
              {m.quantidade} {item.unidade}
              {m.valorTotal ? ` · R$ ${m.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-caption text-text-secondary">Nenhuma movimentação ainda.</p>
      )}
    </div>
  );
}

export function StockPage() {
  const { selectedFarm } = useFarm();
  const farmId = selectedFarm!.id;
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: items } = useQuery({ queryKey: ['farm-data', 'estoque', farmId], queryFn: () => stockApi.listItems(farmId) });

  const deleteItem = useMutation({
    mutationFn: (id: string) => stockApi.deleteItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-data', 'estoque', farmId] }),
  });

  const canManage = selectedFarm!.myRole === 'administrador' || selectedFarm!.myRole === 'gerente';

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Estoque</h1>
      </div>

      {canManage ? <CreateItemForm farmId={farmId} /> : null}

      {!items || items.length === 0 ? (
        <Card span="col-span-12" className="py-lg text-center text-body text-text-secondary">
          Nenhum item cadastrado ainda.
        </Card>
      ) : (
        items.map((item) => {
          const low = item.quantidadeMinima != null && item.quantidadeAtual <= item.quantidadeMinima;
          return (
            <Card key={item.id} span="col-span-12 lg:col-span-6">
              <div className="flex items-start justify-between gap-sm">
                <div>
                  <p className="flex items-center gap-1 text-body font-semibold text-text-primary">
                    {low ? <AlertTriangle size={14} className="text-danger" /> : null}
                    {item.nome}
                  </p>
                  <p className={`text-caption ${low ? 'text-danger' : 'text-text-secondary'}`}>
                    {CATEGORIES.find((c) => c.key === item.categoria)?.label} · {item.quantidadeAtual} {item.unidade}
                    {item.quantidadeMinima != null ? ` (mínimo: ${item.quantidadeMinima} ${item.unidade})` : ''}
                  </p>
                </div>
                {canManage ? (
                  <button type="button" onClick={() => deleteItem.mutate(item.id)} className="text-text-secondary hover:text-danger" aria-label="Remover item">
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="mt-sm text-caption text-primary hover:underline"
              >
                {expandedId === item.id ? 'Ocultar movimentações' : 'Ver movimentações'}
              </button>

              {expandedId === item.id && canManage ? <MovementSection item={item} farmId={farmId} /> : null}
            </Card>
          );
        })
      )}
    </>
  );
}
