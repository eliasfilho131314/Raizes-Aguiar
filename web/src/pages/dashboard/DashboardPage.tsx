import { useQuery } from '@tanstack/react-query';
import { Beef, DollarSign, Skull, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '../../components/Card';
import { farmsApi } from '../../api/endpoints';
import { useFarm } from '../../auth/FarmContext';
import { useAuth } from '../../auth/AuthContext';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function DashboardPage() {
  const { user } = useAuth();
  const { selectedFarm } = useFarm();

  const { data: summary } = useQuery({
    queryKey: ['farm-data', 'dashboard', selectedFarm?.id],
    queryFn: () => farmsApi.getDashboard(selectedFarm!.id),
    enabled: Boolean(selectedFarm),
  });

  const showFinance = selectedFarm?.myRole !== 'funcionario';
  const firstName = user?.name?.split(' ')[0];

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Olá, {firstName}</h1>
        <p className="mt-1 text-body text-text-secondary">{selectedFarm?.name}</p>
      </div>

      <Card span="col-span-6 lg:col-span-2" className="flex flex-col items-center gap-1 text-center">
        <Beef size={20} className="text-primary" />
        <p className="text-title font-bold text-text-primary">{summary?.totalAnimals ?? 0}</p>
        <p className="text-caption text-text-secondary">Total de animais</p>
      </Card>
      <Card span="col-span-6 lg:col-span-2" className="flex flex-col items-center gap-1 text-center">
        <p className="text-title font-bold text-text-primary">{summary?.machos ?? 0}</p>
        <p className="text-caption text-text-secondary">Machos</p>
      </Card>
      <Card span="col-span-6 lg:col-span-2" className="flex flex-col items-center gap-1 text-center">
        <p className="text-title font-bold text-text-primary">{summary?.femeas ?? 0}</p>
        <p className="text-caption text-text-secondary">Fêmeas</p>
      </Card>
      <Card span="col-span-6 lg:col-span-2" className="flex flex-col items-center gap-1 text-center">
        <p className="text-title font-bold text-olive">{summary?.ativos ?? 0}</p>
        <p className="text-caption text-text-secondary">Ativos</p>
      </Card>
      <Card span="col-span-6 lg:col-span-2" className="flex flex-col items-center gap-1 text-center">
        <p className="text-title font-bold text-brown">{summary?.vendidos ?? 0}</p>
        <p className="text-caption text-text-secondary">Vendidos</p>
      </Card>
      <Card span="col-span-6 lg:col-span-2" className="flex flex-col items-center gap-1 text-center">
        <Skull size={18} className="text-danger" />
        <p className="text-title font-bold text-danger">{summary?.mortos ?? 0}</p>
        <p className="text-caption text-text-secondary">Mortos</p>
      </Card>

      {showFinance ? (
        <>
          <Card span="col-span-12 lg:col-span-4" className="flex items-center gap-sm">
            <TrendingUp size={22} className="text-olive" />
            <div>
              <p className="text-body font-semibold text-text-primary">{formatCurrency(summary?.receitas ?? 0)}</p>
              <p className="text-caption text-text-secondary">Receitas do mês</p>
            </div>
          </Card>
          <Card span="col-span-12 lg:col-span-4" className="flex items-center gap-sm">
            <TrendingDown size={22} className="text-danger" />
            <div>
              <p className="text-body font-semibold text-text-primary">{formatCurrency(summary?.despesas ?? 0)}</p>
              <p className="text-caption text-text-secondary">Despesas do mês</p>
            </div>
          </Card>
          <Card span="col-span-12 lg:col-span-4" className="flex items-center gap-sm">
            <DollarSign size={22} className="text-primary" />
            <div>
              <p className={`text-body font-semibold ${(summary?.lucro ?? 0) < 0 ? 'text-danger' : 'text-text-primary'}`}>
                {formatCurrency(summary?.lucro ?? 0)}
              </p>
              <p className="text-caption text-text-secondary">Lucro do mês</p>
            </div>
          </Card>
        </>
      ) : null}
    </>
  );
}
