import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Baby, Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { animalsApi, reproductionApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useFarm } from '../../auth/FarmContext';
import type { ReproductionResult, ReproductionType } from '../../api/types';

const REPRO_TYPES: { key: ReproductionType; label: string }[] = [
  { key: 'cio', label: 'Cio observado' },
  { key: 'inseminacao', label: 'Inseminação/monta' },
  { key: 'diagnostico', label: 'Diagnóstico de gestação' },
  { key: 'parto', label: 'Parto' },
];

// Gestação bovina gira em torno de 283 dias -- só um ponto de partida
// sugerido, o campo continua editável pelo usuário.
function suggestDueDate(fromDate: string): string {
  const d = new Date(`${fromDate}T00:00:00`);
  d.setDate(d.getDate() + 283);
  return d.toISOString().slice(0, 10);
}

export function ReproductionPage() {
  const { selectedFarm } = useFarm();
  const farmId = selectedFarm!.id;
  const queryClient = useQueryClient();

  const { data: animals } = useQuery({ queryKey: ['farm-data', 'animais', farmId], queryFn: () => animalsApi.list(farmId) });
  const { data: records } = useQuery({ queryKey: ['farm-data', 'reproducao', farmId], queryFn: () => reproductionApi.listForFarm(farmId) });

  const femeasAtivas = (animals ?? []).filter((a) => a.status === 'ativo' && a.sexo === 'femea');

  const [animalId, setAnimalId] = useState('');
  const [tipo, setTipo] = useState<ReproductionType>('cio');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [touroOuSemen, setTouroOuSemen] = useState('');
  const [resultado, setResultado] = useState<ReproductionResult>('prenha');
  const [dataPrevistaParto, setDataPrevistaParto] = useState('');
  const [criaIdentificacao, setCriaIdentificacao] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!animalId && femeasAtivas.length > 0) setAnimalId(femeasAtivas[0].id);
  }, [animalId, femeasAtivas]);

  useEffect(() => {
    if (tipo === 'diagnostico' && resultado === 'prenha' && !dataPrevistaParto) {
      setDataPrevistaParto(suggestDueDate(data));
    }
  }, [tipo, resultado, data, dataPrevistaParto]);

  const create = useMutation({
    mutationFn: () =>
      reproductionApi.create({
        animalId,
        tipo,
        data,
        touroOuSemen: tipo === 'inseminacao' ? touroOuSemen.trim() || undefined : undefined,
        resultado: tipo === 'diagnostico' ? resultado : undefined,
        dataPrevistaParto: tipo === 'diagnostico' && resultado === 'prenha' ? dataPrevistaParto || undefined : undefined,
        criaIdentificacao: tipo === 'parto' ? criaIdentificacao.trim() || undefined : undefined,
      }),
    onSuccess: () => {
      setTouroOuSemen('');
      setDataPrevistaParto('');
      setCriaIdentificacao('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'reproducao', farmId] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível registrar.'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => reproductionApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-data', 'reproducao', farmId] }),
  });

  const today = new Date().toISOString().slice(0, 10);
  const partosPrevistos = (records ?? []).filter((r) => r.dataPrevistaParto && r.dataPrevistaParto >= today);

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Reprodução</h1>
      </div>

      <Card span="col-span-12" className="flex flex-col gap-sm">
        <h2 className="text-sm font-semibold uppercase text-text-secondary">Novo registro</h2>
        {femeasAtivas.length === 0 ? (
          <p className="text-body text-text-secondary">Cadastre uma fêmea ativa em Pecuária antes de registrar reprodução.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
              <Select
                label="Fêmea"
                value={animalId}
                onChange={setAnimalId}
                options={femeasAtivas.map((a) => ({ value: a.id, label: a.nome || a.numero || a.brinco || a.id.slice(0, 8) }))}
              />
              <Select label="Tipo" value={tipo} onChange={(v) => setTipo(v as ReproductionType)} options={REPRO_TYPES.map((t) => ({ value: t.key, label: t.label }))} />
              <TextField label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
              {tipo === 'inseminacao' ? (
                <TextField label="Touro/sêmen" value={touroOuSemen} onChange={(e) => setTouroOuSemen(e.target.value)} />
              ) : null}
              {tipo === 'diagnostico' ? (
                <>
                  <Select
                    label="Resultado"
                    value={resultado}
                    onChange={(v) => setResultado(v as ReproductionResult)}
                    options={[
                      { value: 'prenha', label: 'Prenha' },
                      { value: 'vazia', label: 'Vazia' },
                    ]}
                  />
                  {resultado === 'prenha' ? (
                    <TextField label="Previsão de parto" type="date" value={dataPrevistaParto} onChange={(e) => setDataPrevistaParto(e.target.value)} />
                  ) : null}
                </>
              ) : null}
              {tipo === 'parto' ? (
                <TextField label="Identificação da cria (opcional)" value={criaIdentificacao} onChange={(e) => setCriaIdentificacao(e.target.value)} />
              ) : null}
            </div>
            {error ? <span className="text-caption text-danger">{error}</span> : null}
            <Button label="Registrar" onClick={() => animalId && create.mutate()} loading={create.isPending} disabled={!animalId} className="w-fit" />
          </>
        )}
      </Card>

      {partosPrevistos.length > 0 ? (
        <Card span="col-span-12" className="flex flex-col gap-xs">
          <h2 className="flex items-center gap-1 text-sm font-semibold uppercase text-olive">
            <Baby size={14} /> Partos previstos
          </h2>
          {partosPrevistos.map((r) => (
            <p key={r.id} className="text-caption text-text-primary">
              {new Date(r.dataPrevistaParto!).toLocaleDateString('pt-BR')} — {r.animalLabel}
            </p>
          ))}
        </Card>
      ) : null}

      <div className="col-span-12">
        <h2 className="text-subtitle font-semibold text-text-primary">Histórico</h2>
      </div>

      {!records || records.length === 0 ? (
        <Card span="col-span-12" className="py-lg text-center text-body text-text-secondary">
          Nenhum registro reprodutivo ainda.
        </Card>
      ) : (
        records.map((r) => (
          <Card key={r.id} span="col-span-12 lg:col-span-6" className="flex items-center justify-between">
            <div>
              <p className="text-body font-semibold text-text-primary">
                {REPRO_TYPES.find((t) => t.key === r.tipo)?.label} — {r.animalLabel}
              </p>
              <p className="text-caption text-text-secondary">
                {new Date(r.data).toLocaleDateString('pt-BR')}
                {r.touroOuSemen ? ` · ${r.touroOuSemen}` : ''}
                {r.resultado ? ` · ${r.resultado === 'prenha' ? 'Prenha' : 'Vazia'}` : ''}
                {r.dataPrevistaParto ? ` · previsão: ${new Date(r.dataPrevistaParto).toLocaleDateString('pt-BR')}` : ''}
                {r.criaIdentificacao ? ` · cria: ${r.criaIdentificacao}` : ''}
              </p>
            </div>
            <button type="button" onClick={() => remove.mutate(r.id)} className="text-text-secondary hover:text-danger" aria-label="Remover registro">
              <Trash2 size={16} />
            </button>
          </Card>
        ))
      )}
    </>
  );
}
