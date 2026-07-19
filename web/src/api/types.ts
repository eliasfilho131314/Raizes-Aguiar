export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type FarmRole = 'administrador' | 'gerente' | 'funcionario';

export interface Farm {
  id: string;
  name: string;
  location: string | null;
  areaHectares: number | null;
  createdAt: string;
  myRole: FarmRole;
}

export interface FarmMember {
  userId: string;
  name: string;
  email: string;
  role: FarmRole;
  joinedAt: string;
}

export type AnimalSex = 'macho' | 'femea';

export type AnimalCategory =
  | 'bezerro'
  | 'bezerra'
  | 'garrote'
  | 'novilha'
  | 'novilho'
  | 'boi'
  | 'vaca'
  | 'touro'
  | 'matriz'
  | 'reprodutor';

export type AnimalStatus = 'ativo' | 'vendido' | 'abatido' | 'morto';

export interface Animal {
  id: string;
  farmId: string;
  numero: string | null;
  brinco: string | null;
  nome: string | null;
  sexo: AnimalSex;
  raca: string | null;
  categoria: AnimalCategory;
  lote: string | null;
  dataNascimento: string | null;
  pesoNascimentoKg: number | null;
  origem: string | null;
  status: AnimalStatus;
  observacoes: string | null;
  createdAt: string;
}

export interface Weighing {
  id: string;
  animalId: string;
  data: string;
  pesoKg: number;
  observacoes: string | null;
}

export type TransactionType = 'receita' | 'despesa';

export interface FinanceCategory {
  id: string;
  farmId: string;
  name: string;
  type: TransactionType;
}

export interface FinanceTransaction {
  id: string;
  farmId: string;
  type: TransactionType;
  categoryId: string | null;
  categoryName: string | null;
  amount: number;
  description: string | null;
  date: string;
  paidAt: string | null;
}

export interface FarmDashboardSummary {
  totalAnimals: number;
  machos: number;
  femeas: number;
  ativos: number;
  vendidos: number;
  abatidos: number;
  mortos: number;
  receitas: number;
  despesas: number;
  lucro: number;
}
