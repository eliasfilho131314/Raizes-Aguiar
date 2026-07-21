import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Baby, Check, Syringe, Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { calendarApi, healthApi, reproductionApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useFarm } from '../../auth/FarmContext';
import type { AgendaItemType } from '../../api/types';

type TimelineEntry = {
  key: string;
  data: string;
  label: string;
  icon: 'tarefa' | 'evento' | 'sanidade' | 'reproducao';
  concluido?: boolean;
  onToggle?: () => void;
  onDelete?: () => void;
};

function CreateAgendaForm({ farmId }: { farmId: string }) {
  const queryClient = useQueryClient();
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState<AgendaItemType>('tarefa');
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => calendarApi.create({ fazendaId: farmId, titulo: titulo.trim(), data, tipo }),
    onSuccess: () => {
      setTitulo('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['farm-data', 'agenda', farmId] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível criar o item.'),
  });

  return (
    <Card span="col-span-12" className="flex flex-col gap-sm">
      <h2 className="text-sm font-semibold uppercase text-text-secondary">Novo item</h2>
      <div className="flex flex-wrap items-end gap-sm">
        <TextField label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="min-w-[220px] flex-1" placeholder="Ex: Consertar cerca do pasto 3" />
        <Select
          label="Tipo"
          value={tipo}
          onChange={(v) => setTipo(v as AgendaItemType)}
          options={[
            { value: 'tarefa', label: 'Tarefa' },
            { value: 'evento', label: 'Evento' },
          ]}
        />
        <TextField label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        <Button label="Adicionar" onClick={() => titulo.trim() && create.mutate()} loading={create.isPending} className="mb-0.5 w-fit" />
      </div>
      {error ? <span className="text-caption text-danger">{error}</span> : null}
    </Card>
  );
}

export function CalendarPage() {
  const { selectedFarm } = useFarm();
  const farmId = selectedFarm!.id;
  const queryClient = useQueryClient();

  const { data: agendaItems } = useQuery({ queryKey: ['farm-data', 'agenda', farmId], queryFn: () => calendarApi.list(farmId) });
  const { data: healthRecords } = useQuery({ queryKey: ['farm-data', 'sanidade', farmId], queryFn: () => healthApi.listForFarm(farmId) });
  const { data: reproRecords } = useQuery({ queryKey: ['farm-data', 'reproducao', farmId], queryFn: () => reproductionApi.listForFarm(farmId) });

  const toggle = useMutation({
    mutationFn: ({ id, concluido }: { id: string; concluido: boolean }) => calendarApi.setConcluido(id, concluido),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-data', 'agenda', farmId] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => calendarApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-data', 'agenda', farmId] }),
  });

  const timeline: TimelineEntry[] = [
    ...(agendaItems ?? []).map((item) => ({
      key: `agenda-${item.id}`,
      data: item.data,
      label: item.titulo,
      icon: item.tipo,
      concluido: item.concluido,
      onToggle: () => toggle.mutate({ id: item.id, concluido: !item.concluido }),
      onDelete: () => remove.mutate(item.id),
    })),
    ...(healthRecords ?? [])
      .filter((r) => r.proximaAplicacao)
      .map((r) => ({
        key: `sanidade-${r.id}`,
        data: r.proximaAplicacao!,
        label: `${r.produto} — ${r.animalLabel}`,
        icon: 'sanidade' as const,
      })),
    ...(reproRecords ?? [])
      .filter((r) => r.dataPrevistaParto)
      .map((r) => ({
        key: `reproducao-${r.id}`,
        data: r.dataPrevistaParto!,
        label: `Parto previsto — ${r.animalLabel}`,
        icon: 'reproducao' as const,
      })),
  ].sort((a, b) => a.data.localeCompare(b.data));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Calendário</h1>
        <p className="text-caption text-text-secondary">Tarefas e eventos da fazenda, mais os próximos compromissos de Sanidade e Reprodução.</p>
      </div>

      <CreateAgendaForm farmId={farmId} />

      <div className="col-span-12">
        <h2 className="text-subtitle font-semibold text-text-primary">Agenda</h2>
      </div>

      {timeline.length === 0 ? (
        <Card span="col-span-12" className="py-lg text-center text-body text-text-secondary">
          Nada agendado ainda.
        </Card>
      ) : (
        timeline.map((entry) => {
          const overdue = entry.data < today && !entry.concluido && entry.icon !== 'sanidade' && entry.icon !== 'reproducao';
          return (
            <Card key={entry.key} span="col-span-12 lg:col-span-6" className="flex items-center gap-sm">
              {entry.icon === 'sanidade' ? <Syringe size={16} className="shrink-0 text-olive" /> : null}
              {entry.icon === 'reproducao' ? <Baby size={16} className="shrink-0 text-olive" /> : null}
              {entry.icon === 'tarefa' || entry.icon === 'evento' ? (
                <button
                  type="button"
                  onClick={entry.onToggle}
                  aria-label={entry.concluido ? 'Marcar como pendente' : 'Marcar como concluído'}
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${entry.concluido ? 'border-olive bg-olive text-white' : 'border-border'}`}
                >
                  {entry.concluido ? <Check size={12} /> : null}
                </button>
              ) : null}
              <div className="flex-1">
                <p className={`text-body ${entry.concluido ? 'text-text-secondary line-through' : 'text-text-primary'}`}>{entry.label}</p>
                <p className={`text-caption ${overdue ? 'text-danger' : 'text-text-secondary'}`}>{new Date(`${entry.data}T00:00:00`).toLocaleDateString('pt-BR')}</p>
              </div>
              {entry.onDelete ? (
                <button type="button" onClick={entry.onDelete} className="shrink-0 text-text-secondary hover:text-danger" aria-label="Remover item">
                  <Trash2 size={16} />
                </button>
              ) : null}
            </Card>
          );
        })
      )}
    </>
  );
}
