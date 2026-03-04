import { 
  Wallet, 
  Percent, 
  Truck, 
  Building2, 
  Landmark, 
  LineChart, 
  Coins, 
  ArrowLeftRight,
  ArrowUpCircle,
  ArrowDownCircle,
  LucideIcon,
  TrendingUp
} from 'lucide-react';

export type CategoriaDRE = 
  | 'Receita Bruta'
  | 'Deduções Receita'
  | 'Custo Variável'
  | 'Custo Fixo'
  | 'Despesa Variável'
  | 'Despesa Fixa'
  | 'Despesa Financeira'
  | 'Investimento'
  | 'Receita Não Operacional'
  | 'Movimento Capital';

export type CategoriaFluxo = 
  | 'Entradas'
  | 'Saídas Variáveis'
  | 'Saídas Fixas'
  | 'Saídas Financeiras'
  | 'Saídas Investimento'
  | 'Entradas Investimento'
  | 'Entradas Financiamento';

interface OpcaoSelect {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const OPCOES_DRE: OpcaoSelect[] = [
  { value: 'Receita Bruta', label: 'Receita Bruta', icon: Wallet, color: 'text-emerald-600' },
  { value: 'Deduções Receita', label: 'Deduções da Receita', icon: Percent, color: 'text-amber-600' },
  { value: 'Custo Variável', label: 'Custo Variável (Frota/Frete)', icon: Truck, color: 'text-blue-600' },
  { value: 'Custo Fixo', label: 'Custo Fixo (Frota Parada)', icon: Truck, color: 'text-blue-800' },
  { value: 'Despesa Variável', label: 'Despesa Variável (Comercial/Marketing)', icon: TrendingUp, color: 'text-orange-500' },
  { value: 'Despesa Fixa', label: 'Despesa Fixa (Estrutura)', icon: Building2, color: 'text-zinc-600' },
  { value: 'Despesa Financeira', label: 'Despesa Financeira', icon: Landmark, color: 'text-purple-600' },
  { value: 'Investimento', label: 'Investimento / Imobilizado', icon: LineChart, color: 'text-indigo-600' },
  { value: 'Receita Não Operacional', label: 'Receita Não Operacional', icon: Coins, color: 'text-teal-600' },
  { value: 'Movimento Capital', label: 'Movimento de Capital (Empréstimos)', icon: ArrowLeftRight, color: 'text-gray-500' },
];

export const OPCOES_FLUXO: OpcaoSelect[] = [
  { value: 'Entradas', label: 'Entradas Operacionais', icon: ArrowUpCircle, color: 'text-emerald-600' },
  { value: 'Saídas Variáveis', label: 'Saídas Variáveis', icon: ArrowDownCircle, color: 'text-rose-600' },
  { value: 'Saídas Fixas', label: 'Saídas Fixas', icon: ArrowDownCircle, color: 'text-red-700' },
  { value: 'Saídas Financeiras', label: 'Saídas Financeiras', icon: ArrowDownCircle, color: 'text-purple-700' },
  { value: 'Saídas Investimento', label: 'Saídas Investimento', icon: ArrowDownCircle, color: 'text-indigo-700' },
  { value: 'Entradas Investimento', label: 'Entradas de Investimento', icon: ArrowUpCircle, color: 'text-indigo-500' },
  { value: 'Entradas Financiamento', label: 'Entradas de Financiamento', icon: ArrowUpCircle, color: 'text-purple-500' },
];
