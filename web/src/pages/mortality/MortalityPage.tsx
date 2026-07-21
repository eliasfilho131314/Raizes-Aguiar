import { useQuery } from '@tanstack/react-query';
import { Skull } from 'lucide-react';
import { Card } from '../../components/Card';
import { animalsApi } from '../../api/endpoints';
import { useFarm } from '../../auth/FarmContext';
import type { Animal } from '../../api/types';

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

function animalLabel(animal: Pick<Animal, 'nome' | 'numero' | 'brinco'>): string {
  return animal.nome || animal.numero || animal.brinco || 'Sem identificação';
}

export function MortalityPage() {
  const { selectedFarm } = useFarm();
  const farmId = selectedFarm!.id;

  const { data: animals } = useQuery({ queryKey: ['farm-data', 'animais', farmId], queryFn: () => animalsApi.list(farmId) });

  const total = animals?.length ?? 0;
  const mortos = (animals ?? []).filter((a) => a.status === 'morto').sort((a, b) => (b.dataSaida ?? '').localeCompare(a.dataSaida ?? ''));

  const now = new Date();
  const mortesEsteMes = mortos.filter((a) => {
    if (!a.dataSaida) return false;
    const d = new Date(`${a.dataSaida}T00:00:00`);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const taxaMortalidade = total > 0 ? ((mortos.length / total) * 100).toFixed(1) : '0.0';

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Mortalidade</h1>
      </div>

      <Card span="col-span-12 md:col-span-4" className="flex flex-col gap-xs">
        <p className="text-caption text-text-secondary">Total de mortes</p>
        <p className="text-title font-bold text-danger">{mortos.length}</p>
      </Card>
      <Card span="col-span-12 md:col-span-4" className="flex flex-col gap-xs">
        <p className="text-caption text-text-secondary">Mortes este mês</p>
        <p className="text-title font-bold text-text-primary">{mortesEsteMes.length}</p>
      </Card>
      <Card span="col-span-12 md:col-span-4" className="flex flex-col gap-xs">
        <p className="text-caption text-text-secondary">Taxa de mortalidade</p>
        <p className="text-title font-bold text-text-primary">{taxaMortalidade}%</p>
      </Card>

      <div className="col-span-12">
        <h2 className="text-subtitle font-semibold text-text-primary">Histórico</h2>
      </div>

      {mortos.length === 0 ? (
        <Card span="col-span-12" className="py-lg text-center text-body text-text-secondary">
          Nenhuma morte registrada.
        </Card>
      ) : (
        mortos.map((animal) => (
          <Card key={animal.id} span="col-span-12 lg:col-span-6" className="flex items-center gap-sm">
            <Skull size={18} className="shrink-0 text-danger" />
            <div>
              <p className="text-body font-semibold text-text-primary">{animalLabel(animal)}</p>
              <p className="text-caption text-text-secondary">
                {CATEGORY_LABELS[animal.categoria] ?? animal.categoria}
                {animal.dataSaida ? ` · ${new Date(animal.dataSaida).toLocaleDateString('pt-BR')}` : ''}
                {animal.observacoesSaida ? ` · ${animal.observacoesSaida}` : ''}
              </p>
            </div>
          </Card>
        ))
      )}
    </>
  );
}
