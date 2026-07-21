import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { employeesApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useFarm } from '../../auth/FarmContext';
import type { Employee } from '../../api/types';

function CreateEmployeeForm({ farmId }: { farmId: string }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [salario, setSalario] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      employeesApi.create({
        fazendaId: farmId,
        nome: nome.trim(),
        cargo: cargo.trim() || undefined,
        salario: salario ? Number(salario) : undefined,
        telefone: telefone.trim() || undefined,
        dataAdmissao: dataAdmissao || undefined,
      }),
    onSuccess: () => {
      setNome('');
      setCargo('');
      setSalario('');
      setTelefone('');
      setDataAdmissao('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'funcionarios', farmId] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível cadastrar o funcionário.'),
  });

  return (
    <Card span="col-span-12" className="flex flex-col gap-sm">
      <h2 className="text-sm font-semibold uppercase text-text-secondary">Novo funcionário</h2>
      <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
        <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <TextField label="Cargo (opcional)" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Vaqueiro" />
        <TextField label="Salário (R$, opcional)" type="number" value={salario} onChange={(e) => setSalario(e.target.value)} />
        <TextField label="Telefone (opcional)" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        <TextField label="Data de admissão (opcional)" type="date" value={dataAdmissao} onChange={(e) => setDataAdmissao(e.target.value)} />
      </div>
      {error ? <span className="text-caption text-danger">{error}</span> : null}
      <Button label="Cadastrar funcionário" onClick={() => nome.trim() && create.mutate()} loading={create.isPending} className="w-fit" />
    </Card>
  );
}

function PaymentForm({ employee, farmId, onDone }: { employee: Employee; farmId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(employee.salario ? String(employee.salario) : '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const pay = useMutation({
    mutationFn: () =>
      employeesApi.registerPayment({
        fazendaId: farmId,
        employeeName: employee.nome,
        amount: Number(amount),
        date,
        competencia: new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'finance-transactions', farmId] });
      onDone();
    },
  });

  return (
    <div className="mt-sm flex flex-wrap items-end gap-sm border-t border-border pt-sm">
      <TextField label="Valor (R$)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Button label="Confirmar pagamento" onClick={() => Number(amount) > 0 && pay.mutate()} loading={pay.isPending} className="mb-0.5 w-fit" />
      <Button label="Cancelar" variant="secondary" onClick={onDone} className="mb-0.5 w-fit" />
    </div>
  );
}

export function EmployeesPage() {
  const { selectedFarm } = useFarm();
  const farmId = selectedFarm!.id;
  const queryClient = useQueryClient();
  const [payingId, setPayingId] = useState<string | null>(null);

  const { data: employees } = useQuery({ queryKey: ['farm-data', 'funcionarios', farmId], queryFn: () => employeesApi.list(farmId) });

  const setAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => employeesApi.setAtivo(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-data', 'funcionarios', farmId] }),
  });

  const deleteEmployee = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-data', 'funcionarios', farmId] }),
  });

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Funcionários</h1>
      </div>

      <CreateEmployeeForm farmId={farmId} />

      {!employees || employees.length === 0 ? (
        <Card span="col-span-12" className="py-lg text-center text-body text-text-secondary">
          Nenhum funcionário cadastrado ainda.
        </Card>
      ) : (
        employees.map((employee) => (
          <Card key={employee.id} span="col-span-12 lg:col-span-6">
            <div className="flex items-start justify-between gap-sm">
              <div>
                <p className="text-body font-semibold text-text-primary">{employee.nome}</p>
                <p className="text-caption text-text-secondary">
                  {employee.cargo ?? 'Sem cargo definido'}
                  {employee.salario ? ` · R$ ${employee.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                  {employee.telefone ? ` · ${employee.telefone}` : ''}
                  {employee.dataAdmissao ? ` · desde ${new Date(employee.dataAdmissao).toLocaleDateString('pt-BR')}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-sm">
                <button
                  type="button"
                  onClick={() => setAtivo.mutate({ id: employee.id, ativo: !employee.ativo })}
                  className="cursor-pointer"
                >
                  <Badge label={employee.ativo ? 'Ativo' : 'Inativo'} tone={employee.ativo ? 'olive' : 'neutral'} />
                </button>
                <button type="button" onClick={() => deleteEmployee.mutate(employee.id)} className="text-text-secondary hover:text-danger" aria-label="Remover funcionário">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {payingId !== employee.id ? (
              <button type="button" onClick={() => setPayingId(employee.id)} className="mt-sm text-caption text-primary hover:underline">
                Registrar pagamento
              </button>
            ) : (
              <PaymentForm employee={employee} farmId={farmId} onDone={() => setPayingId(null)} />
            )}
          </Card>
        ))
      )}
    </>
  );
}
