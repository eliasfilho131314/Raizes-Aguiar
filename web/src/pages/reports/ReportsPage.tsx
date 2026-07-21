import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../components/Card';
import { animalsApi, farmsApi, financeApi } from '../../api/endpoints';
import { useFarm } from '../../auth/FarmContext';

const CATEGORY_LABELS: Record<string, string> = {
  bezerro: 'Bezerro',
  bezerra: 'Bezerra',
  garrote: 'Garrote',
  novilha: 'Novilha',
  novilho: 'Novilho',
  boi: 'Boi',
  vaca: 'Vaca',
  touro: 'Touro',
  matriz: 'Matriz',
  reprodutor: 'Reprodutor',
};

// Categorias com job de identidade (não de magnitude) -- verde pra receita,
// terracota pra despesa. Cores testadas com o validador do skill de
// dataviz (checks de luminosidade/croma/CVD/contraste todos passando
// contra o fundo claro do app) -- não são exatamente os tokens de marca
// (--color-primary/--color-brown), que são escuros/dessaturados demais
// pra série de gráfico e falhavam o piso de separação CVD entre si.
const RECEITA_COLOR = '#2f8f6f';
const DESPESA_COLOR = '#b8622a';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

export function ReportsPage() {
  const { selectedFarm } = useFarm();
  const farmId = selectedFarm!.id;

  const { data: summary } = useQuery({ queryKey: ['farm-data', 'dashboard', farmId], queryFn: () => farmsApi.getDashboard(farmId) });
  const { data: animals } = useQuery({ queryKey: ['farm-data', 'animais', farmId], queryFn: () => animalsApi.list(farmId) });
  const { data: transactions } = useQuery({ queryKey: ['farm-data', 'finance-transactions', farmId], queryFn: () => financeApi.listTransactions(farmId) });

  const ativos = (animals ?? []).filter((a) => a.status === 'ativo');
  const porCategoria = ativos.reduce<Record<string, number>>((acc, a) => {
    acc[a.categoria] = (acc[a.categoria] ?? 0) + 1;
    return acc;
  }, {});

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const chartData = months.map((key) => {
    const inMonth = (transactions ?? []).filter((t) => t.date.slice(0, 7) === key);
    return {
      month: monthLabel(key),
      Receitas: inMonth.filter((t) => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0),
      Despesas: inMonth.filter((t) => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0),
    };
  });

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Relatórios</h1>
      </div>

      <Card span="col-span-12 md:col-span-3" className="flex flex-col gap-xs">
        <p className="text-caption text-text-secondary">Rebanho ativo</p>
        <p className="text-title font-bold text-text-primary">{summary?.ativos ?? 0}</p>
      </Card>
      <Card span="col-span-12 md:col-span-3" className="flex flex-col gap-xs">
        <p className="text-caption text-text-secondary">Receitas do mês</p>
        <p className="text-body font-semibold text-text-primary">{formatCurrency(summary?.receitas ?? 0)}</p>
      </Card>
      <Card span="col-span-12 md:col-span-3" className="flex flex-col gap-xs">
        <p className="text-caption text-text-secondary">Despesas do mês</p>
        <p className="text-body font-semibold text-text-primary">{formatCurrency(summary?.despesas ?? 0)}</p>
      </Card>
      <Card span="col-span-12 md:col-span-3" className="flex flex-col gap-xs">
        <p className="text-caption text-text-secondary">Lucro do mês</p>
        <p className={`text-body font-semibold ${(summary?.lucro ?? 0) >= 0 ? 'text-primary' : 'text-danger'}`}>{formatCurrency(summary?.lucro ?? 0)}</p>
      </Card>

      <Card span="col-span-12 lg:col-span-7" className="flex flex-col gap-sm">
        <h2 className="text-sm font-semibold uppercase text-text-secondary">Receitas x despesas (últimos 6 meses)</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap={16} barGap={2}>
              <CartesianGrid vertical={false} stroke="#e2e1d8" />
              <XAxis dataKey="month" tick={{ fill: '#6b6f64', fontSize: 12 }} axisLine={{ stroke: '#e2e1d8' }} tickLine={false} />
              <YAxis tick={{ fill: '#6b6f64', fontSize: 12 }} axisLine={false} tickLine={false} width={72} tickFormatter={(v) => formatCurrency(Number(v))} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderColor: '#e2e1d8', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Receitas" fill={RECEITA_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Despesas" fill={DESPESA_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card span="col-span-12 lg:col-span-5" className="flex flex-col gap-xs">
        <h2 className="text-sm font-semibold uppercase text-text-secondary">Rebanho ativo por categoria</h2>
        {Object.keys(porCategoria).length === 0 ? (
          <p className="text-body text-text-secondary">Nenhum animal ativo cadastrado.</p>
        ) : (
          Object.entries(porCategoria)
            .sort((a, b) => b[1] - a[1])
            .map(([categoria, count]) => (
              <div key={categoria} className="flex items-center justify-between border-b border-border py-1 last:border-0">
                <span className="text-body text-text-primary">{CATEGORY_LABELS[categoria] ?? categoria}</span>
                <span className="text-body font-semibold text-text-primary">{count}</span>
              </div>
            ))
        )}
      </Card>
    </>
  );
}
