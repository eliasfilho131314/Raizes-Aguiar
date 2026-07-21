import { supabase, unwrap, ApiError } from './client';
import type {
  AgendaItem,
  AgendaItemType,
  Animal,
  AnimalCategory,
  AnimalSex,
  AnimalStatus,
  Employee,
  Farm,
  Pasture,
  PastureStatus,
  FarmDashboardSummary,
  FarmMember,
  FarmRole,
  FinanceCategory,
  FinanceTransaction,
  HealthRecord,
  HealthRecordType,
  ReproductionRecord,
  ReproductionResult,
  ReproductionType,
  StockCategory,
  StockItem,
  StockMovement,
  StockMovementType,
  TransactionType,
  UserProfile,
  Weighing,
} from './types';

async function currentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new ApiError('Não autenticado.', 401);
  return user.id;
}

export const usersApi = {
  me: async (): Promise<UserProfile> => {
    const userId = await currentUserId();
    return unwrap<UserProfile>(
      supabase.from('profiles').select('id,name,email,createdAt:created_at').eq('id', userId).single(),
    );
  },
};

export const farmsApi = {
  list: async (): Promise<Farm[]> => {
    const rows = await unwrap<(Omit<Farm, 'myRole'> & { myRole: { role: FarmRole }[] })[]>(
      supabase
        .from('fazendas')
        .select('id,name,location,areaHectares:area_hectares,createdAt:created_at,myRole:fazenda_membros(role)')
        .order('created_at', { ascending: true }),
    );
    return rows.map((f) => ({ ...f, myRole: f.myRole[0]?.role }));
  },
  create: (input: { name: string; location?: string; areaHectares?: number }) =>
    unwrap<Farm>(
      supabase.rpc('create_farm', { p_name: input.name, p_location: input.location ?? null, p_area_hectares: input.areaHectares ?? null }),
    ),
  delete: (id: string) => unwrap(supabase.from('fazendas').delete().eq('id', id)),
  seedDefaultFinanceCategories: (fazendaId: string) => unwrap(supabase.rpc('seed_default_finance_categories', { p_fazenda_id: fazendaId })),
  listMembers: async (fazendaId: string): Promise<FarmMember[]> => {
    const rows = await unwrap<{ userId: string; role: FarmRole; joinedAt: string; profile: { name: string; email: string } | null }[]>(
      supabase
        .from('fazenda_membros')
        .select('userId:user_id,role,joinedAt:joined_at,profile:profiles(name,email)')
        .eq('fazenda_id', fazendaId),
    );
    return rows.map((m) => ({ userId: m.userId, role: m.role, joinedAt: m.joinedAt, name: m.profile?.name ?? '—', email: m.profile?.email ?? '—' }));
  },
  inviteMember: (fazendaId: string, email: string, role: FarmRole) =>
    unwrap<FarmMember>(supabase.rpc('invite_farm_member', { p_fazenda_id: fazendaId, p_email: email, p_role: role })),
  removeMember: (fazendaId: string, userId: string) =>
    unwrap(supabase.from('fazenda_membros').delete().eq('fazenda_id', fazendaId).eq('user_id', userId)),
  getDashboard: (fazendaId: string) =>
    unwrap<FarmDashboardSummary>(supabase.rpc('get_farm_dashboard', { p_fazenda_id: fazendaId })),
};

const ANIMAL_SELECT =
  'id,farmId:fazenda_id,numero,brinco,nome,sexo,raca,categoria,lote,dataNascimento:data_nascimento,pesoNascimentoKg:peso_nascimento_kg,origem,status,observacoes,valorCompra:valor_compra,dataSaida:data_saida,valorSaida:valor_saida,observacoesSaida:observacoes_saida,createdAt:created_at';

export const animalsApi = {
  list: (fazendaId: string) =>
    unwrap<Animal[]>(supabase.from('animais').select(ANIMAL_SELECT).eq('fazenda_id', fazendaId).order('created_at', { ascending: false })),
  // Quando o animal entra por compra (valorCompra informado), lança a
  // despesa correspondente no Financeiro na hora -- espelha o que
  // registerExit já faz pro lado da venda, fechando o ciclo compra/venda.
  create: async (input: {
    fazendaId: string;
    numero?: string;
    brinco?: string;
    nome?: string;
    sexo: AnimalSex;
    raca?: string;
    categoria: AnimalCategory;
    lote?: string;
    dataNascimento?: string;
    pesoNascimentoKg?: number;
    origem?: string;
    observacoes?: string;
    valorCompra?: number;
  }): Promise<Animal> => {
    const animal = await unwrap<Animal>(
      supabase
        .from('animais')
        .insert({
          fazenda_id: input.fazendaId,
          numero: input.numero,
          brinco: input.brinco,
          nome: input.nome,
          sexo: input.sexo,
          raca: input.raca,
          categoria: input.categoria,
          lote: input.lote,
          data_nascimento: input.dataNascimento,
          peso_nascimento_kg: input.pesoNascimentoKg,
          origem: input.origem,
          observacoes: input.observacoes,
          valor_compra: input.valorCompra ?? null,
        })
        .select(ANIMAL_SELECT)
        .single(),
    );

    if (input.valorCompra) {
      const categories = await unwrap<{ id: string; name: string }[]>(
        supabase.from('financeiro_categorias').select('id,name').eq('fazenda_id', input.fazendaId).eq('type', 'despesa'),
      );
      const categoryId = categories.find((c) => c.name === 'Compra de gado')?.id;
      const label = input.nome || input.numero || input.brinco || 'animal';
      await unwrap(
        supabase.from('financeiro_transacoes').insert({
          fazenda_id: input.fazendaId,
          type: 'despesa',
          categoria_id: categoryId ?? null,
          amount: input.valorCompra,
          description: `Compra — ${label}`,
          date: new Date().toISOString().slice(0, 10),
        }),
      );
    }

    return animal;
  },
  // Venda/abate/morte sempre capturam o que aconteceu -- não é só trocar
  // o status. Pra vendido/abatido com valor informado, também lança a
  // receita no Financeiro automaticamente (categoria "Venda de gado" se
  // existir, senão sem categoria) -- sem isso a venda de um animal nunca
  // aparecia no fluxo de caixa por conta própria.
  registerExit: async (input: {
    id: string;
    fazendaId: string;
    status: Extract<AnimalStatus, 'vendido' | 'abatido' | 'morto'>;
    dataSaida: string;
    valorSaida?: number;
    observacoesSaida?: string;
    animalLabel: string;
  }): Promise<Animal> => {
    const animal = await unwrap<Animal>(
      supabase
        .from('animais')
        .update({
          status: input.status,
          data_saida: input.dataSaida,
          valor_saida: input.valorSaida ?? null,
          observacoes_saida: input.observacoesSaida ?? null,
        })
        .eq('id', input.id)
        .select(ANIMAL_SELECT)
        .single(),
    );

    if ((input.status === 'vendido' || input.status === 'abatido') && input.valorSaida) {
      const categories = await unwrap<{ id: string; name: string }[]>(
        supabase.from('financeiro_categorias').select('id,name').eq('fazenda_id', input.fazendaId).eq('type', 'receita'),
      );
      const categoryId = categories.find((c) => c.name === 'Venda de gado')?.id;
      await unwrap(
        supabase.from('financeiro_transacoes').insert({
          fazenda_id: input.fazendaId,
          type: 'receita',
          categoria_id: categoryId ?? null,
          amount: input.valorSaida,
          description: `${input.status === 'vendido' ? 'Venda' : 'Abate'} — ${input.animalLabel}`,
          date: input.dataSaida,
        }),
      );
    }

    return animal;
  },
  delete: (id: string) => unwrap(supabase.from('animais').delete().eq('id', id)),
  listWeighings: (animalId: string) =>
    unwrap<Weighing[]>(
      supabase.from('pesagens').select('id,animalId:animal_id,data,pesoKg:peso_kg,observacoes').eq('animal_id', animalId).order('data', { ascending: true }),
    ),
  addWeighing: (input: { animalId: string; data: string; pesoKg: number; observacoes?: string }) =>
    unwrap<Weighing>(
      supabase
        .from('pesagens')
        .insert({ animal_id: input.animalId, data: input.data, peso_kg: input.pesoKg, observacoes: input.observacoes })
        .select('id,animalId:animal_id,data,pesoKg:peso_kg,observacoes')
        .single(),
    ),
};

export const financeApi = {
  listCategories: (fazendaId: string) =>
    unwrap<FinanceCategory[]>(
      supabase.from('financeiro_categorias').select('id,farmId:fazenda_id,name,type').eq('fazenda_id', fazendaId).order('name'),
    ),
  createCategory: (fazendaId: string, name: string, type: TransactionType) =>
    unwrap<FinanceCategory>(
      supabase.from('financeiro_categorias').insert({ fazenda_id: fazendaId, name, type }).select('id,farmId:fazenda_id,name,type').single(),
    ),
  listTransactions: async (fazendaId: string): Promise<FinanceTransaction[]> => {
    const rows = await unwrap<(Omit<FinanceTransaction, 'categoryName'> & { category: { name: string } | null })[]>(
      supabase
        .from('financeiro_transacoes')
        .select('id,farmId:fazenda_id,type,categoryId:categoria_id,amount,description,date,paidAt:paid_at,category:financeiro_categorias(name)')
        .eq('fazenda_id', fazendaId)
        .order('date', { ascending: false }),
    );
    return rows.map((t) => ({ ...t, categoryName: t.category?.name ?? null }));
  },
  createTransaction: (input: {
    fazendaId: string;
    type: TransactionType;
    categoryId?: string;
    amount: number;
    description?: string;
    date: string;
  }) =>
    unwrap<FinanceTransaction>(
      supabase
        .from('financeiro_transacoes')
        .insert({
          fazenda_id: input.fazendaId,
          type: input.type,
          categoria_id: input.categoryId,
          amount: input.amount,
          description: input.description,
          date: input.date,
        })
        .select('id,farmId:fazenda_id,type,categoryId:categoria_id,amount,description,date,paidAt:paid_at')
        .single(),
    ),
  deleteTransaction: (id: string) => unwrap(supabase.from('financeiro_transacoes').delete().eq('id', id)),
};

const HEALTH_RECORD_SELECT = 'id,animalId:animal_id,tipo,produto,data,proximaAplicacao:proxima_aplicacao,veterinario,observacoes';

export const healthApi = {
  // Lista de todos os registros da fazenda (join com animais só pra
  // exibir de quem é o registro na tela de Sanidade) -- RLS já restringe
  // via fazenda_role(a.fazenda_id) na policy de sanidade_registros.
  listForFarm: async (fazendaId: string): Promise<HealthRecord[]> => {
    const rows = await unwrap<(HealthRecord & { animal: { numero: string | null; brinco: string | null; nome: string | null } | null })[]>(
      supabase
        .from('sanidade_registros')
        .select(`${HEALTH_RECORD_SELECT},animal:animais!inner(numero,brinco,nome,fazenda_id)`)
        .eq('animal.fazenda_id', fazendaId)
        .order('data', { ascending: false }),
    );
    return rows.map((r) => ({ ...r, animalLabel: r.animal?.nome || r.animal?.numero || r.animal?.brinco || '—' }));
  },
  listForAnimal: (animalId: string) =>
    unwrap<HealthRecord[]>(supabase.from('sanidade_registros').select(HEALTH_RECORD_SELECT).eq('animal_id', animalId).order('data', { ascending: false })),
  create: (input: {
    animalId: string;
    tipo: HealthRecordType;
    produto: string;
    data: string;
    proximaAplicacao?: string;
    veterinario?: string;
    observacoes?: string;
  }) =>
    unwrap<HealthRecord>(
      supabase
        .from('sanidade_registros')
        .insert({
          animal_id: input.animalId,
          tipo: input.tipo,
          produto: input.produto,
          data: input.data,
          proxima_aplicacao: input.proximaAplicacao,
          veterinario: input.veterinario,
          observacoes: input.observacoes,
        })
        .select(HEALTH_RECORD_SELECT)
        .single(),
    ),
  delete: (id: string) => unwrap(supabase.from('sanidade_registros').delete().eq('id', id)),
};

const REPRODUCTION_RECORD_SELECT =
  'id,animalId:animal_id,tipo,data,touroOuSemen:touro_ou_semen,resultado,dataPrevistaParto:data_prevista_parto,criaIdentificacao:cria_identificacao,observacoes';

export const reproductionApi = {
  listForFarm: async (fazendaId: string): Promise<ReproductionRecord[]> => {
    const rows = await unwrap<(ReproductionRecord & { animal: { numero: string | null; brinco: string | null; nome: string | null } | null })[]>(
      supabase
        .from('reproducao_registros')
        .select(`${REPRODUCTION_RECORD_SELECT},animal:animais!inner(numero,brinco,nome,fazenda_id)`)
        .eq('animal.fazenda_id', fazendaId)
        .order('data', { ascending: false }),
    );
    return rows.map((r) => ({ ...r, animalLabel: r.animal?.nome || r.animal?.numero || r.animal?.brinco || '—' }));
  },
  listForAnimal: (animalId: string) =>
    unwrap<ReproductionRecord[]>(
      supabase.from('reproducao_registros').select(REPRODUCTION_RECORD_SELECT).eq('animal_id', animalId).order('data', { ascending: false }),
    ),
  create: (input: {
    animalId: string;
    tipo: ReproductionType;
    data: string;
    touroOuSemen?: string;
    resultado?: ReproductionResult;
    dataPrevistaParto?: string;
    criaIdentificacao?: string;
    observacoes?: string;
  }) =>
    unwrap<ReproductionRecord>(
      supabase
        .from('reproducao_registros')
        .insert({
          animal_id: input.animalId,
          tipo: input.tipo,
          data: input.data,
          touro_ou_semen: input.touroOuSemen,
          resultado: input.resultado,
          data_prevista_parto: input.dataPrevistaParto,
          cria_identificacao: input.criaIdentificacao,
          observacoes: input.observacoes,
        })
        .select(REPRODUCTION_RECORD_SELECT)
        .single(),
    ),
  delete: (id: string) => unwrap(supabase.from('reproducao_registros').delete().eq('id', id)),
};

const STOCK_CATEGORY_FINANCE_CATEGORY: Record<StockCategory, string> = {
  racao: 'Ração e suplementos',
  medicamento: 'Medicamentos e vacinas',
  combustivel: 'Combustível',
  outro: 'Outras despesas',
};

const STOCK_ITEM_SELECT = 'id,farmId:fazenda_id,nome,categoria,unidade,quantidadeAtual:quantidade_atual,quantidadeMinima:quantidade_minima';
const STOCK_MOVEMENT_SELECT = 'id,itemId:item_id,tipo,quantidade,valorTotal:valor_total,data,observacoes';

export const stockApi = {
  listItems: (fazendaId: string) =>
    unwrap<StockItem[]>(supabase.from('estoque_itens').select(STOCK_ITEM_SELECT).eq('fazenda_id', fazendaId).order('nome')),
  createItem: (input: { fazendaId: string; nome: string; categoria: StockCategory; unidade: string; quantidadeMinima?: number }) =>
    unwrap<StockItem>(
      supabase
        .from('estoque_itens')
        .insert({
          fazenda_id: input.fazendaId,
          nome: input.nome,
          categoria: input.categoria,
          unidade: input.unidade,
          quantidade_minima: input.quantidadeMinima ?? null,
        })
        .select(STOCK_ITEM_SELECT)
        .single(),
    ),
  deleteItem: (id: string) => unwrap(supabase.from('estoque_itens').delete().eq('id', id)),
  listMovements: (itemId: string) =>
    unwrap<StockMovement[]>(supabase.from('estoque_movimentos').select(STOCK_MOVEMENT_SELECT).eq('item_id', itemId).order('data', { ascending: false })),
  // Entrada com valor informado lança a despesa correspondente no
  // Financeiro na categoria já seedada pra aquele tipo de item -- mesmo
  // padrão de animalsApi.create (valorCompra) e registerExit (valorSaida).
  addMovement: async (input: {
    itemId: string;
    fazendaId: string;
    itemNome: string;
    itemCategoria: StockCategory;
    tipo: StockMovementType;
    quantidade: number;
    valorTotal?: number;
    data: string;
    observacoes?: string;
  }): Promise<StockMovement> => {
    const movement = await unwrap<StockMovement>(
      supabase
        .from('estoque_movimentos')
        .insert({
          item_id: input.itemId,
          tipo: input.tipo,
          quantidade: input.quantidade,
          valor_total: input.valorTotal ?? null,
          data: input.data,
          observacoes: input.observacoes,
        })
        .select(STOCK_MOVEMENT_SELECT)
        .single(),
    );

    if (input.tipo === 'entrada' && input.valorTotal) {
      const categoryName = STOCK_CATEGORY_FINANCE_CATEGORY[input.itemCategoria];
      const categories = await unwrap<{ id: string; name: string }[]>(
        supabase.from('financeiro_categorias').select('id,name').eq('fazenda_id', input.fazendaId).eq('type', 'despesa'),
      );
      const categoryId = categories.find((c) => c.name === categoryName)?.id;
      await unwrap(
        supabase.from('financeiro_transacoes').insert({
          fazenda_id: input.fazendaId,
          type: 'despesa',
          categoria_id: categoryId ?? null,
          amount: input.valorTotal,
          description: `Compra de estoque — ${input.itemNome}`,
          date: input.data,
        }),
      );
    }

    return movement;
  },
};

const EMPLOYEE_SELECT = 'id,farmId:fazenda_id,nome,cargo,salario,telefone,dataAdmissao:data_admissao,ativo';

export const employeesApi = {
  list: (fazendaId: string) =>
    unwrap<Employee[]>(supabase.from('funcionarios').select(EMPLOYEE_SELECT).eq('fazenda_id', fazendaId).order('nome')),
  create: (input: { fazendaId: string; nome: string; cargo?: string; salario?: number; telefone?: string; dataAdmissao?: string }) =>
    unwrap<Employee>(
      supabase
        .from('funcionarios')
        .insert({
          fazenda_id: input.fazendaId,
          nome: input.nome,
          cargo: input.cargo,
          salario: input.salario ?? null,
          telefone: input.telefone,
          data_admissao: input.dataAdmissao,
        })
        .select(EMPLOYEE_SELECT)
        .single(),
    ),
  setAtivo: (id: string, ativo: boolean) => unwrap<Employee>(supabase.from('funcionarios').update({ ativo }).eq('id', id).select(EMPLOYEE_SELECT).single()),
  delete: (id: string) => unwrap(supabase.from('funcionarios').delete().eq('id', id)),
  // Pagamento não tem tabela própria -- vira direto uma despesa em
  // "Folha salarial" no Financeiro, mesmo padrão de compra de
  // animal/estoque.
  registerPayment: async (input: { fazendaId: string; employeeName: string; amount: number; date: string; competencia?: string }): Promise<void> => {
    const categories = await unwrap<{ id: string; name: string }[]>(
      supabase.from('financeiro_categorias').select('id,name').eq('fazenda_id', input.fazendaId).eq('type', 'despesa'),
    );
    const categoryId = categories.find((c) => c.name === 'Folha salarial')?.id;
    await unwrap(
      supabase.from('financeiro_transacoes').insert({
        fazenda_id: input.fazendaId,
        type: 'despesa',
        categoria_id: categoryId ?? null,
        amount: input.amount,
        description: `Folha salarial — ${input.employeeName}${input.competencia ? ` (${input.competencia})` : ''}`,
        date: input.date,
      }),
    );
  },
};

const AGENDA_ITEM_SELECT = 'id,farmId:fazenda_id,titulo,data,tipo,concluido,observacoes';

export const calendarApi = {
  list: (fazendaId: string) =>
    unwrap<AgendaItem[]>(supabase.from('eventos_agenda').select(AGENDA_ITEM_SELECT).eq('fazenda_id', fazendaId).order('data')),
  create: (input: { fazendaId: string; titulo: string; data: string; tipo: AgendaItemType; observacoes?: string }) =>
    unwrap<AgendaItem>(
      supabase
        .from('eventos_agenda')
        .insert({ fazenda_id: input.fazendaId, titulo: input.titulo, data: input.data, tipo: input.tipo, observacoes: input.observacoes })
        .select(AGENDA_ITEM_SELECT)
        .single(),
    ),
  setConcluido: (id: string, concluido: boolean) =>
    unwrap<AgendaItem>(supabase.from('eventos_agenda').update({ concluido }).eq('id', id).select(AGENDA_ITEM_SELECT).single()),
  delete: (id: string) => unwrap(supabase.from('eventos_agenda').delete().eq('id', id)),
};

const PASTURE_SELECT = 'id,farmId:fazenda_id,nome,areaHectares:area_hectares,capacidadeSuporte:capacidade_suporte,status,loteAtual:lote_atual,observacoes';

export const pasturesApi = {
  list: (fazendaId: string) => unwrap<Pasture[]>(supabase.from('pastagens').select(PASTURE_SELECT).eq('fazenda_id', fazendaId).order('nome')),
  create: (input: { fazendaId: string; nome: string; areaHectares?: number; capacidadeSuporte?: number; observacoes?: string }) =>
    unwrap<Pasture>(
      supabase
        .from('pastagens')
        .insert({
          fazenda_id: input.fazendaId,
          nome: input.nome,
          area_hectares: input.areaHectares ?? null,
          capacidade_suporte: input.capacidadeSuporte ?? null,
          observacoes: input.observacoes,
        })
        .select(PASTURE_SELECT)
        .single(),
    ),
  update: (id: string, input: { status?: PastureStatus; loteAtual?: string | null }) =>
    unwrap<Pasture>(
      supabase
        .from('pastagens')
        .update({ status: input.status, lote_atual: input.loteAtual })
        .eq('id', id)
        .select(PASTURE_SELECT)
        .single(),
    ),
  delete: (id: string) => unwrap(supabase.from('pastagens').delete().eq('id', id)),
};
