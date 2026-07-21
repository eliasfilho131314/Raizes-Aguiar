import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { financeApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useFarm } from '../../auth/FarmContext';
import type { TransactionType } from '../../api/types';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function FinancePage() {
  const { selectedFarm } = useFarm();
  const farmId = selectedFarm!.id;
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({ queryKey: ['farm-data', 'finance-categories', farmId], queryFn: () => financeApi.listCategories(farmId) });
  const { data: transactions } = useQuery({ queryKey: ['farm-data', 'finance-transactions', farmId], queryFn: () => financeApi.listTransactions(farmId) });

  const [type, setType] = useState<TransactionType>('despesa');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      financeApi.createTransaction({
        fazendaId: farmId,
        type,
        categoryId: categoryId || undefined,
        amount: Number(amount),
        description: description.trim() || undefined,
        date,
      }),
    onSuccess: () => {
      setAmount('');
      setDescription('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'finance-transactions', farmId] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'dashboard', farmId] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível registrar o lançamento.'),
  });

  const deleteTx = useMutation({
    mutationFn: (id: string) => financeApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'finance-transactions', farmId] });
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'dashboard', farmId] });
    },
  });

  const filteredCategories = (categories ?? []).filter((c) => c.type === type);
  const totalIncome = (transactions ?? []).filter((t) => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  const totalExpense = (transactions ?? []).filter((t) => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Financeiro</h1>
      </div>

      <Card span="col-span-12 sm:col-span-6 lg:col-span-4" className="flex flex-col gap-1">
        <p className="text-title font-bold text-olive">{formatCurrency(totalIncome)}</p>
        <p className="text-caption text-text-secondary">Receitas (total)</p>
      </Card>
      <Card span="col-span-12 sm:col-span-6 lg:col-span-4" className="flex flex-col gap-1">
        <p className="text-title font-bold text-danger">{formatCurrency(totalExpense)}</p>
        <p className="text-caption text-text-secondary">Despesas (total)</p>
      </Card>
      <Card span="col-span-12 lg:col-span-4" className="flex flex-col gap-1">
        <p className={`text-title font-bold ${totalIncome - totalExpense < 0 ? 'text-danger' : 'text-primary'}`}>
          {formatCurrency(totalIncome - totalExpense)}
        </p>
        <p className="text-caption text-text-secondary">Saldo</p>
      </Card>

      <Card span="col-span-12" className="flex flex-col gap-sm">
        <h2 className="text-sm font-semibold uppercase text-text-secondary">Novo lançamento</h2>
        <div className="flex gap-sm">
          <button
            type="button"
            onClick={() => setType('receita')}
            className={`flex-1 rounded-button border py-sm text-caption font-bold ${type === 'receita' ? 'border-olive bg-olive text-white' : 'border-border bg-surface-alt text-text-primary'}`}
          >
            Receita
          </button>
          <button
            type="button"
            onClick={() => setType('despesa')}
            className={`flex-1 rounded-button border py-sm text-caption font-bold ${type === 'despesa' ? 'border-danger bg-danger text-white' : 'border-border bg-surface-alt text-text-primary'}`}
          >
            Despesa
          </button>
        </div>
        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Select
            label="Categoria"
            value={categoryId}
            onChange={setCategoryId}
            options={[{ value: '', label: 'Sem categoria' }, ...filteredCategories.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <TextField label="Valor (R$)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <TextField label="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error ? <span className="text-caption text-danger">{error}</span> : null}
        <Button label="Salvar lançamento" onClick={() => amount && create.mutate()} loading={create.isPending} className="w-fit" />
      </Card>

      <div className="col-span-12">
        <h2 className="text-subtitle font-semibold text-text-primary">Últimos lançamentos</h2>
      </div>

      {!transactions || transactions.length === 0 ? (
        <Card span="col-span-12" className="py-lg text-center text-body text-text-secondary">
          Nenhum lançamento ainda.
        </Card>
      ) : (
        transactions.map((t) => (
          <Card key={t.id} span="col-span-12 lg:col-span-6" className="flex items-center justify-between">
            <div>
              <p className="text-body font-semibold text-text-primary">{t.categoryName ?? (t.type === 'receita' ? 'Receita' : 'Despesa')}</p>
              {t.description ? <p className="text-caption text-text-secondary">{t.description}</p> : null}
              <p className="text-caption text-text-secondary">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="flex items-center gap-sm">
              <span className={`text-body font-bold ${t.type === 'receita' ? 'text-olive' : 'text-danger'}`}>
                {t.type === 'receita' ? '+' : '-'} {formatCurrency(t.amount)}
              </span>
              <button type="button" onClick={() => deleteTx.mutate(t.id)} className="text-text-secondary hover:text-danger" aria-label="Remover lançamento">
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))
      )}
    </>
  );
}
