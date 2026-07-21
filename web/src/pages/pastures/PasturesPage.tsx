import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { pasturesApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useFarm } from '../../auth/FarmContext';
import type { Pasture } from '../../api/types';

function CreatePastureForm({ farmId }: { farmId: string }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [areaHectares, setAreaHectares] = useState('');
  const [capacidadeSuporte, setCapacidadeSuporte] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      pasturesApi.create({
        fazendaId: farmId,
        nome: nome.trim(),
        areaHectares: areaHectares ? Number(areaHectares) : undefined,
        capacidadeSuporte: capacidadeSuporte ? Number(capacidadeSuporte) : undefined,
      }),
    onSuccess: () => {
      setNome('');
      setAreaHectares('');
      setCapacidadeSuporte('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'pastagens', farmId] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível cadastrar o piquete.'),
  });

  return (
    <Card span="col-span-12" className="flex flex-col gap-sm">
      <h2 className="text-sm font-semibold uppercase text-text-secondary">Novo piquete</h2>
      <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
        <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Piquete 3" />
        <TextField label="Área (hectares, opcional)" type="number" value={areaHectares} onChange={(e) => setAreaHectares(e.target.value)} />
        <TextField label="Capacidade de suporte (UA, opcional)" type="number" value={capacidadeSuporte} onChange={(e) => setCapacidadeSuporte(e.target.value)} />
      </div>
      {error ? <span className="text-caption text-danger">{error}</span> : null}
      <Button label="Cadastrar piquete" onClick={() => nome.trim() && create.mutate()} loading={create.isPending} className="w-fit" />
    </Card>
  );
}

function RotateForm({ pasture, farmId, onDone }: { pasture: Pasture; farmId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [loteAtual, setLoteAtual] = useState(pasture.loteAtual ?? '');

  const rotate = useMutation({
    mutationFn: () => pasturesApi.update(pasture.id, { loteAtual: loteAtual.trim() || null, status: 'em_uso' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'pastagens', farmId] });
      onDone();
    },
  });

  return (
    <div className="mt-sm flex flex-wrap items-end gap-sm border-t border-border pt-sm">
      <TextField label="Lote atual" value={loteAtual} onChange={(e) => setLoteAtual(e.target.value)} placeholder="Ex: Lote das novilhas" className="min-w-[200px] flex-1" />
      <Button label="Confirmar" onClick={() => rotate.mutate()} loading={rotate.isPending} className="mb-0.5 w-fit" />
      <Button label="Cancelar" variant="secondary" onClick={onDone} className="mb-0.5 w-fit" />
    </div>
  );
}

export function PasturesPage() {
  const { selectedFarm } = useFarm();
  const farmId = selectedFarm!.id;
  const queryClient = useQueryClient();
  const [rotatingId, setRotatingId] = useState<string | null>(null);

  const { data: pastures } = useQuery({ queryKey: ['farm-data', 'pastagens', farmId], queryFn: () => pasturesApi.list(farmId) });

  const setDescanso = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'em_uso' | 'descanso' }) => pasturesApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-data', 'pastagens', farmId] }),
  });

  const deletePasture = useMutation({
    mutationFn: (id: string) => pasturesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-data', 'pastagens', farmId] }),
  });

  const canDelete = selectedFarm!.myRole === 'administrador' || selectedFarm!.myRole === 'gerente';

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Pastagens</h1>
      </div>

      <CreatePastureForm farmId={farmId} />

      {!pastures || pastures.length === 0 ? (
        <Card span="col-span-12" className="py-lg text-center text-body text-text-secondary">
          Nenhum piquete cadastrado ainda.
        </Card>
      ) : (
        pastures.map((pasture) => (
          <Card key={pasture.id} span="col-span-12 lg:col-span-6">
            <div className="flex items-start justify-between gap-sm">
              <div>
                <p className="text-body font-semibold text-text-primary">{pasture.nome}</p>
                <p className="text-caption text-text-secondary">
                  {pasture.areaHectares ? `${pasture.areaHectares} ha` : 'Área não informada'}
                  {pasture.capacidadeSuporte ? ` · até ${pasture.capacidadeSuporte} UA` : ''}
                  {pasture.loteAtual ? ` · ${pasture.loteAtual}` : ' · sem lote'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-sm">
                <button
                  type="button"
                  onClick={() => setDescanso.mutate({ id: pasture.id, status: pasture.status === 'em_uso' ? 'descanso' : 'em_uso' })}
                >
                  <Badge label={pasture.status === 'em_uso' ? 'Em uso' : 'Descanso'} tone={pasture.status === 'em_uso' ? 'olive' : 'neutral'} />
                </button>
                {canDelete ? (
                  <button type="button" onClick={() => deletePasture.mutate(pasture.id)} className="text-text-secondary hover:text-danger" aria-label="Remover piquete">
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
            </div>

            {rotatingId !== pasture.id ? (
              <button type="button" onClick={() => setRotatingId(pasture.id)} className="mt-sm text-caption text-primary hover:underline">
                Rotacionar lote
              </button>
            ) : (
              <RotateForm pasture={pasture} farmId={farmId} onDone={() => setRotatingId(null)} />
            )}
          </Card>
        ))
      )}
    </>
  );
}
