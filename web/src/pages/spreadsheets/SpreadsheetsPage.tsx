import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { animalsApi, financeApi } from '../../api/endpoints';
import { downloadCsv, parseCsv } from '../../lib/csv';
import { useFarm } from '../../auth/FarmContext';
import type { AnimalCategory, AnimalSex } from '../../api/types';

const ANIMAL_HEADERS = [
  'numero',
  'brinco',
  'nome',
  'sexo',
  'categoria',
  'raca',
  'lote',
  'dataNascimento',
  'pesoNascimentoKg',
  'origem',
  'valorCompra',
  'status',
  'observacoes',
];

const VALID_SEXO: AnimalSex[] = ['macho', 'femea'];
const VALID_CATEGORIA: AnimalCategory[] = [
  'bezerro',
  'bezerra',
  'garrote',
  'novilha',
  'novilho',
  'boi',
  'vaca',
  'touro',
  'matriz',
  'reprodutor',
];

export function SpreadsheetsPage() {
  const { selectedFarm } = useFarm();
  const farmId = selectedFarm!.id;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const { data: animals } = useQuery({ queryKey: ['farm-data', 'animais', farmId], queryFn: () => animalsApi.list(farmId) });
  const canManage = selectedFarm!.myRole === 'administrador' || selectedFarm!.myRole === 'gerente';

  const exportAnimals = useMutation({
    mutationFn: async () => {
      const rows = [
        ANIMAL_HEADERS,
        ...(animals ?? []).map((a) => [
          a.numero ?? '',
          a.brinco ?? '',
          a.nome ?? '',
          a.sexo,
          a.categoria,
          a.raca ?? '',
          a.lote ?? '',
          a.dataNascimento ?? '',
          a.pesoNascimentoKg != null ? String(a.pesoNascimentoKg) : '',
          a.origem ?? '',
          a.valorCompra != null ? String(a.valorCompra) : '',
          a.status,
          a.observacoes ?? '',
        ]),
      ];
      downloadCsv(`animais-${selectedFarm!.name}.csv`, rows);
    },
  });

  const exportFinance = useMutation({
    mutationFn: async () => {
      const transactions = await financeApi.listTransactions(farmId);
      const rows = [
        ['data', 'tipo', 'categoria', 'valor', 'descricao'],
        ...transactions.map((t) => [t.date, t.type, t.categoryName ?? '', String(t.amount), t.description ?? '']),
      ];
      downloadCsv(`financeiro-${selectedFarm!.name}.csv`, rows);
    },
  });

  async function handleImportFile(file: File) {
    setImporting(true);
    setImportResult(null);
    const text = await file.text();
    const rows = parseCsv(text);
    const [header, ...dataRows] = rows;
    const col = (name: string) => header.indexOf(name);

    let imported = 0;
    const errors: string[] = [];

    for (const [i, row] of dataRows.entries()) {
      const sexo = row[col('sexo')]?.trim() as AnimalSex;
      const categoria = row[col('categoria')]?.trim() as AnimalCategory;
      const numero = row[col('numero')]?.trim();
      const brinco = row[col('brinco')]?.trim();

      if (!VALID_SEXO.includes(sexo) || !VALID_CATEGORIA.includes(categoria)) {
        errors.push(`Linha ${i + 2}: sexo ou categoria inválido (${numero || brinco || 'sem identificação'}).`);
        continue;
      }

      try {
        await animalsApi.create({
          fazendaId: farmId,
          numero: numero || undefined,
          brinco: brinco || undefined,
          nome: row[col('nome')]?.trim() || undefined,
          sexo,
          categoria,
          raca: row[col('raca')]?.trim() || undefined,
          lote: row[col('lote')]?.trim() || undefined,
          dataNascimento: row[col('dataNascimento')]?.trim() || undefined,
          pesoNascimentoKg: row[col('pesoNascimentoKg')] ? Number(row[col('pesoNascimentoKg')]) : undefined,
          origem: row[col('origem')]?.trim() || undefined,
          valorCompra: row[col('valorCompra')] ? Number(row[col('valorCompra')]) : undefined,
        });
        imported++;
      } catch {
        errors.push(`Linha ${i + 2}: não foi possível importar (${numero || brinco || 'sem identificação'}).`);
      }
    }

    setImportResult({ imported, errors });
    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ['farm-data', 'animais', farmId] });
    queryClient.invalidateQueries({ queryKey: ['farm-data', 'dashboard', farmId] });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <>
      <div className="col-span-12">
        <h1 className="text-title font-bold text-text-primary">Planilhas</h1>
      </div>

      <Card span="col-span-12 lg:col-span-6" className="flex flex-col gap-sm">
        <h2 className="text-sm font-semibold uppercase text-text-secondary">Exportar</h2>
        <p className="text-caption text-text-secondary">Baixe seus dados em CSV para abrir no Excel/Google Sheets.</p>
        <div className="flex flex-wrap gap-sm">
          <Button label="Exportar animais" variant="secondary" onClick={() => exportAnimals.mutate()} loading={exportAnimals.isPending} className="w-fit" />
          {canManage ? (
            <Button label="Exportar financeiro" variant="secondary" onClick={() => exportFinance.mutate()} loading={exportFinance.isPending} className="w-fit" />
          ) : null}
        </div>
      </Card>

      <Card span="col-span-12 lg:col-span-6" className="flex flex-col gap-sm">
        <h2 className="text-sm font-semibold uppercase text-text-secondary">Importar animais</h2>
        <p className="text-caption text-text-secondary">
          Use o mesmo formato do CSV exportado (colunas: {ANIMAL_HEADERS.join(', ')}). Sexo deve ser "macho"/"femea"; categoria uma das opções cadastradas em Pecuária.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
          className="text-caption text-text-primary"
        />
        {importing ? <p className="text-caption text-text-secondary">Importando...</p> : null}
        {importResult ? (
          <div className="flex flex-col gap-1">
            <p className="text-caption text-primary">{importResult.imported} animal(is) importado(s) com sucesso.</p>
            {importResult.errors.map((err, i) => (
              <p key={i} className="text-caption text-danger">
                {err}
              </p>
            ))}
          </div>
        ) : null}
      </Card>
    </>
  );
}
