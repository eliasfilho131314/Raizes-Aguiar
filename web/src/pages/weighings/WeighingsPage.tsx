import { useQuery } from '@tanstack/react-query';
import { Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '../../components/Card';
import { animalsApi } from '../../api/endpoints';
import { useFarm } from '../../auth/FarmContext';
import type { Weighing } from '../../api/types';

interface AnimalWeightSummary {
  animalId: string;
  animalLabel: string;
  ultimoPeso: number;
  ultimaData: string;
  gmdKgDia: number | null;
}

function summarizeByAnimal(weighings: Weighing[]): AnimalWeightSummary[] {
  const byAnimal = new Map<string, Weighing[]>();
  for (const w of weighings) {
    const list = byAnimal.get(w.animalId) ?? [];
    list.push(w);
    byAnimal.set(w.animalId, list);
  }

  const summaries: AnimalWeightSummary[] = [];
  for (const [animalId, records] of byAnimal) {
    const sorted = [...records].sort((a, b) => a.data.localeCompare(b.data));
    const last = sorted[sorted.length - 1];
    const first = sorted[0];
    let gmdKgDia: number | null = null;
    if (sorted.length > 1) {
      const dias = (new Date(`${last.data}T00:00:00`).getTime() - new Date(`${first.data}T00:00:00`).getTime()) / 86_400_000;
      if (dias > 0) gmdKgDia = (last.pesoKg - first.pesoKg) / dias;
    }
    summaries.push({ animalId, animalLabel: last.animalLabel ?? '—', ultimoPeso: last.pesoKg, ultimaData: last.data, gmdKgDia });
  }
  return summaries.sort((a, b) => b.ultimaData.localeCompare(a.ultimaData));
}

export function WeighingsPage() {
  const { selectedFarm } = useFarm();
  const farmId = selectedFarm!.id;

  const { data: weighings } = useQuery({ queryKey: ['farm-data', 'pesagens', farmId], queryFn: () => animalsApi.listWeighingsForFarm(farmId) });

  const summaries = summarizeByAnimal(weighings ?? []);
  const pesoMedio = summaries.length > 0 ? summaries.reduce((sum, s) => sum + s.ultimoPeso, 0) / summaries.length : 0;

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Pesagens</h1>
        <p className="text-caption text-text-secondary">Evolução de peso do rebanho. Registre uma pesagem em Pecuária, dentro do card de cada animal.</p>
      </div>

      <Card span="col-span-12 md:col-span-4" className="flex flex-col gap-xs">
        <p className="text-caption text-text-secondary">Animais pesados</p>
        <p className="text-title font-bold text-text-primary">{summaries.length}</p>
      </Card>
      <Card span="col-span-12 md:col-span-4" className="flex flex-col gap-xs">
        <p className="text-caption text-text-secondary">Peso médio (última pesagem)</p>
        <p className="text-title font-bold text-text-primary">{pesoMedio > 0 ? `${pesoMedio.toFixed(1)} kg` : '—'}</p>
      </Card>
      <Card span="col-span-12 md:col-span-4" className="flex flex-col gap-xs">
        <p className="text-caption text-text-secondary">Total de pesagens</p>
        <p className="text-title font-bold text-text-primary">{(weighings ?? []).length}</p>
      </Card>

      <div className="col-span-12">
        <h2 className="text-subtitle font-semibold text-text-primary">Por animal</h2>
      </div>

      {summaries.length === 0 ? (
        <Card span="col-span-12" className="py-lg text-center text-body text-text-secondary">
          Nenhuma pesagem registrada ainda.
        </Card>
      ) : (
        summaries.map((s) => (
          <Card key={s.animalId} span="col-span-12 lg:col-span-6" className="flex items-center gap-sm">
            <Scale size={18} className="shrink-0 text-text-secondary" />
            <div className="flex-1">
              <p className="text-body font-semibold text-text-primary">{s.animalLabel}</p>
              <p className="text-caption text-text-secondary">
                {s.ultimoPeso}kg em {new Date(`${s.ultimaData}T00:00:00`).toLocaleDateString('pt-BR')}
                {s.gmdKgDia != null ? (
                  <span className={s.gmdKgDia >= 0 ? 'text-primary' : 'text-danger'}>
                    {' · '}
                    {s.gmdKgDia >= 0 ? <TrendingUp size={12} className="inline" /> : <TrendingDown size={12} className="inline" />} GMD {s.gmdKgDia.toFixed(2)}kg/dia
                  </span>
                ) : null}
              </p>
            </div>
          </Card>
        ))
      )}
    </>
  );
}
