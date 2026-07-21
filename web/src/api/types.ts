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
  valorCompra: number | null;
  dataSaida: string | null;
  valorSaida: number | null;
  observacoesSaida: string | null;
  createdAt: string;
}

export interface Weighing {
  id: string;
  animalId: string;
  data: string;
  pesoKg: number;
  observacoes: string | null;
}

export type HealthRecordType = 'vacina' | 'medicamento' | 'vermifugo' | 'exame' | 'outro';

export interface HealthRecord {
  id: string;
  animalId: string;
  animalLabel?: string;
  tipo: HealthRecordType;
  produto: string;
  data: string;
  proximaAplicacao: string | null;
  veterinario: string | null;
  observacoes: string | null;
}

export type ReproductionType = 'cio' | 'inseminacao' | 'diagnostico' | 'parto';
export type ReproductionResult = 'prenha' | 'vazia';

export interface ReproductionRecord {
  id: string;
  animalId: string;
  animalLabel?: string;
  tipo: ReproductionType;
  data: string;
  touroOuSemen: string | null;
  resultado: ReproductionResult | null;
  dataPrevistaParto: string | null;
  criaIdentificacao: string | null;
  observacoes: string | null;
}

export type StockCategory = 'racao' | 'medicamento' | 'combustivel' | 'outro';

export interface StockItem {
  id: string;
  farmId: string;
  nome: string;
  categoria: StockCategory;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMinima: number | null;
}

export type StockMovementType = 'entrada' | 'saida';

export interface StockMovement {
  id: string;
  itemId: string;
  tipo: StockMovementType;
  quantidade: number;
  valorTotal: number | null;
  data: string;
  observacoes: string | null;
}

export type AgendaItemType = 'tarefa' | 'evento';

export interface AgendaItem {
  id: string;
  farmId: string;
  titulo: string;
  data: string;
  tipo: AgendaItemType;
  concluido: boolean;
  observacoes: string | null;
}

export type PastureStatus = 'em_uso' | 'descanso';

export interface Pasture {
  id: string;
  farmId: string;
  nome: string;
  areaHectares: number | null;
  capacidadeSuporte: number | null;
  status: PastureStatus;
  loteAtual: string | null;
  observacoes: string | null;
}

export type ConfinementBatchStatus = 'ativo' | 'finalizado';

export interface ConfinementBatch {
  id: string;
  farmId: string;
  nome: string;
  dataEntrada: string;
  dataSaidaPrevista: string | null;
  quantidadeAnimais: number;
  pesoMedioEntradaKg: number | null;
  consumoRacaoKgDia: number | null;
  status: ConfinementBatchStatus;
  observacoes: string | null;
}

export interface Employee {
  id: string;
  farmId: string;
  nome: string;
  cargo: string | null;
  salario: number | null;
  telefone: string | null;
  dataAdmissao: string | null;
  ativo: boolean;
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
