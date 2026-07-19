import { supabase, unwrap, ApiError } from './client';
import type {
  Animal,
  AnimalCategory,
  AnimalSex,
  AnimalStatus,
  Farm,
  FarmDashboardSummary,
  FarmMember,
  FarmRole,
  FinanceCategory,
  FinanceTransaction,
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
  'id,farmId:fazenda_id,numero,brinco,nome,sexo,raca,categoria,lote,dataNascimento:data_nascimento,pesoNascimentoKg:peso_nascimento_kg,origem,status,observacoes,createdAt:created_at';

export const animalsApi = {
  list: (fazendaId: string) =>
    unwrap<Animal[]>(supabase.from('animais').select(ANIMAL_SELECT).eq('fazenda_id', fazendaId).order('created_at', { ascending: false })),
  create: (input: {
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
  }) =>
    unwrap<Animal>(
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
        })
        .select(ANIMAL_SELECT)
        .single(),
    ),
  updateStatus: (id: string, status: AnimalStatus) =>
    unwrap<Animal>(supabase.from('animais').update({ status }).eq('id', id).select(ANIMAL_SELECT).single()),
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
