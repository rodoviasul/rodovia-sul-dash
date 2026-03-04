import React, { useState, useMemo } from 'react';
import { useContas, ContaUnificada } from '../../hooks/useContas';
import { useDominios } from '../../hooks/useDominios';
import { 
  Loader2, 
  Search, 
  Settings2, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Save,
  Wallet,
  Truck,
  Building2,
  Landmark,
  LineChart,
  Percent,
  Coins,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  ArrowLeftRight
} from 'lucide-react';
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ITENS_POR_PAGINA = 10;

// Mapa de ícones (Mapeado pelo NOME da categoria para facilitar visualização)
const ICONES_CATEGORIA: Record<string, { icon: any, color: string }> = {
  'Receita Bruta': { icon: Wallet, color: 'text-emerald-600' },
  'Deduções da Receita': { icon: Percent, color: 'text-amber-600' },
  'Custo Variável': { icon: Truck, color: 'text-blue-600' },
  'Custo Fixo': { icon: Truck, color: 'text-blue-800' },
  'Despesa Variável': { icon: TrendingUp, color: 'text-orange-500' },
  'Despesa Fixa': { icon: Building2, color: 'text-zinc-600' },
  'Despesa Financeira': { icon: Landmark, color: 'text-purple-600' },
  'Investimento': { icon: LineChart, color: 'text-indigo-600' },
  'Receita Não Operacional': { icon: Coins, color: 'text-teal-600' },
  'Movimento de Capital': { icon: ArrowLeftRight, color: 'text-gray-500' },
};

const ConfiguracaoContas: React.FC = () => {
  const { contas, loading: loadingContas, error, salvarConfiguracao } = useContas();
  const { 
    categoriasDRE, 
    subcategoriasDRE, 
    tiposFluxo, 
    categoriasFluxo, 
    getSubcategoriasDRE, 
    getCategoriasFluxo,
    loading: loadingDominios 
  } = useDominios();
  
  const loading = loadingContas || loadingDominios;

  // Estados de UI
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendentes' | 'configurados'>('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [contaEditando, setContaEditando] = useState<ContaUnificada | null>(null);
  
  // Estado do Formulário (Sheet) - Agora guarda IDs
  const [formConfig, setFormConfig] = useState<Partial<ContaUnificada>>({});
  const [salvando, setSalvando] = useState(false);

  // Lógica de Filtro e Busca
  const dadosFiltrados = useMemo(() => {
    return contas.filter((conta) => {
      const matchTexto = 
        conta.condescr.toLowerCase().includes(busca.toLowerCase()) ||
        conta.concod.includes(busca);
      
      if (!matchTexto) return false;

      if (filtroStatus === 'pendentes') return conta.precisa_configurar;
      if (filtroStatus === 'configurados') return !conta.precisa_configurar;
      
      return true;
    });
  }, [contas, busca, filtroStatus]);

  // Paginação
  const totalPaginas = Math.ceil(dadosFiltrados.length / ITENS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const dadosPaginados = dadosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);

  // Helpers para Display (ID -> Nome)
  const getCategoriaNome = (id: string | null) => {
    if (!id) return null;
    return categoriasDRE.find(c => c.id === id)?.nome || null;
  };

  const getSubcategoriaNome = (id: string | null) => {
    if (!id) return null;
    return subcategoriasDRE.find(s => s.id === id)?.nome || null;
  };

  const getBadgeInfo = (categoriaId: string | null) => {
    const nome = getCategoriaNome(categoriaId);
    if (!nome) return null;
    return ICONES_CATEGORIA[nome] || { icon: AlertCircle, color: 'text-zinc-400' };
  };

  const subcategoriasDisponiveis = useMemo(() => {
    if (!formConfig.dre_categoria_id) return [];
    return getSubcategoriasDRE(formConfig.dre_categoria_id);
  }, [formConfig.dre_categoria_id, getSubcategoriasDRE]);

  const categoriasFluxoDisponiveis = useMemo(() => {
    if (!formConfig.fluxo_tipo_id) return [];
    return getCategoriasFluxo(formConfig.fluxo_tipo_id);
  }, [formConfig.fluxo_tipo_id, getCategoriasFluxo]);


  // Ações
  const abrirEdicao = (conta: ContaUnificada) => {
    setContaEditando(conta);
    setFormConfig({
      dre_categoria_id: conta.dre_categoria_id || '',
      dre_subcategoria_id: conta.dre_subcategoria_id || '',
      dre_sinal: conta.dre_sinal || (conta.contip === 'R' || conta.contip === 'E' ? 1 : -1),
      fluxo_tipo_id: conta.fluxo_tipo_id || tiposFluxo.find(t => t.nome === 'Operacional')?.id || '', // Default inteligente
      fluxo_categoria_id: conta.fluxo_categoria_id || '',
    });
  };

  const salvar = async () => {
    if (!contaEditando) return;
    
    setSalvando(true);
    try {
      const sucesso = await salvarConfiguracao(contaEditando, formConfig);
      if (sucesso) {
        toast.success("Configuração salva com sucesso!");
        setContaEditando(null);
      } else {
        toast.error("Erro ao salvar configuração.");
      }
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] animate-in fade-in">
        <Loader2 className="w-10 h-10 animate-spin text-rodovia-verde mb-4" />
        <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Carregando Sistema...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-red-500">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold mb-2">Erro de Conexão</h2>
        <p className="text-zinc-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Plano de Contas Gerencial
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Configure como cada conta do ERP deve aparecer nos relatórios.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-lg border shadow-sm">
          <Button 
            variant={filtroStatus === 'todos' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => { setFiltroStatus('todos'); setPaginaAtual(1); }}
            className="text-xs font-medium"
          >
            Todas
          </Button>
          <Button 
            variant={filtroStatus === 'pendentes' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => { setFiltroStatus('pendentes'); setPaginaAtual(1); }}
            className="text-xs font-medium text-amber-600 dark:text-amber-500"
          >
            Pendentes
          </Button>
          <Button 
            variant={filtroStatus === 'configurados' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => { setFiltroStatus('configurados'); setPaginaAtual(1); }}
            className="text-xs font-medium text-green-600 dark:text-green-500"
          >
            Configuradas
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por nome ou código..." 
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }}
            className="pl-9 bg-transparent dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <span className="hidden md:inline">TOTAL:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">{dadosFiltrados.length}</span>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-900 hover:bg-slate-900 border-b-0">
              <TableHead className="w-[100px] text-white font-bold tracking-wider py-4">CÓDIGO</TableHead>
              <TableHead className="text-white font-bold tracking-wider py-4">CONTA (ERP)</TableHead>
              <TableHead className="w-[220px] text-white font-bold tracking-wider py-4">CATEGORIA (DRE)</TableHead>
              <TableHead className="w-[200px] text-white font-bold tracking-wider py-4">DETALHE</TableHead>
              <TableHead className="w-[120px] text-right text-white font-bold tracking-wider py-4 pr-6">STATUS</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dadosPaginados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                  Nenhuma conta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              dadosPaginados.map((conta, index) => {
                const badgeInfo = getBadgeInfo(conta.dre_categoria_id);
                const BadgeIcon = badgeInfo?.icon;
                const categoriaNome = getCategoriaNome(conta.dre_categoria_id);
                const subcategoriaNome = getSubcategoriaNome(conta.dre_subcategoria_id);
                const isEven = index % 2 === 0;

                return (
                <TableRow 
                  key={conta.concod} 
                  className={cn(
                    "group cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800",
                    isEven ? "bg-white dark:bg-zinc-900" : "bg-zinc-50/50 dark:bg-zinc-800/30",
                    "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  )}
                  onClick={() => abrirEdicao(conta)}
                >
                  <TableCell className="font-mono text-xs font-medium text-zinc-500 border-r border-zinc-100 dark:border-zinc-800">
                    {conta.concod}
                  </TableCell>
                  <TableCell className="font-semibold text-zinc-700 dark:text-zinc-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors border-r border-zinc-100 dark:border-zinc-800">
                    {conta.condescr}
                  </TableCell>
                  <TableCell className="border-r border-zinc-100 dark:border-zinc-800">
                    {categoriaNome ? (
                      <Badge variant="outline" className="font-normal text-xs bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 gap-1 pl-1 pr-2 py-1 shadow-sm">
                         {BadgeIcon && <BadgeIcon className={cn("w-3.5 h-3.5", badgeInfo?.color)} />}
                         <span className="text-zinc-700 dark:text-zinc-200 font-medium">{categoriaNome}</span>
                      </Badge>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-600 text-xs italic">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800">
                    {subcategoriaNome || '-'}
                  </TableCell>
                  <TableCell className="text-right border-r border-zinc-100 dark:border-zinc-800 pr-6">
                    {conta.precisa_configurar ? (
                      <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50">
                        PENDENTE
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50">
                        OK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Settings2 className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t bg-zinc-50/50 dark:bg-zinc-900/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-zinc-500 font-mono">
              PÁGINA {paginaAtual} DE {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Sheet de Edição (Painel Lateral) */}
      <Sheet open={!!contaEditando} onOpenChange={(open) => !open && setContaEditando(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <span className="text-rodovia-verde">#</span> {contaEditando?.condescr}
            </SheetTitle>
            <SheetDescription>
              Código ERP: {contaEditando?.concod} | Tipo Original: {contaEditando?.contip}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {/* DRE - Categoria Principal */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Categoria (DRE)</Label>
              <Select 
                value={formConfig.dre_categoria_id || ''} 
                onValueChange={(val) => setFormConfig({ ...formConfig, dre_categoria_id: val, dre_subcategoria_id: '' })}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Selecione a categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {categoriasDRE.map((cat) => {
                    const info = ICONES_CATEGORIA[cat.nome] || { icon: AlertCircle, color: 'text-zinc-500' };
                    const Icon = info.icon;
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2 font-medium">
                          <Icon className={cn("w-4 h-4", info.color)} />
                          <span>{cat.nome}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* DRE - Detalhe (Dinâmico) */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Sub-Categoria (Detalhe)</Label>
              {subcategoriasDisponiveis.length > 0 ? (
                <Select
                  value={formConfig.dre_subcategoria_id || ''}
                  onValueChange={(val) => setFormConfig({ ...formConfig, dre_subcategoria_id: val })}
                  disabled={!formConfig.dre_categoria_id}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Selecione o detalhe..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoriasDisponiveis.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 italic text-center">
                  {formConfig.dre_categoria_id 
                    ? "Nenhuma subcategoria cadastrada para esta categoria." 
                    : "Selecione uma categoria primeiro."}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Fluxo de Caixa - Tipo */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Tipo Fluxo</Label>
                <Select 
                  value={formConfig.fluxo_tipo_id || ''} 
                  onValueChange={(val) => setFormConfig({ ...formConfig, fluxo_tipo_id: val, fluxo_categoria_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposFluxo.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fluxo de Caixa - Categoria */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Categoria Fluxo</Label>
                <Select 
                  value={formConfig.fluxo_categoria_id || ''} 
                  onValueChange={(val) => setFormConfig({ ...formConfig, fluxo_categoria_id: val })}
                  disabled={!formConfig.fluxo_tipo_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasFluxoDisponiveis.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button 
              onClick={salvar} 
              disabled={salvando || !formConfig.dre_categoria_id || !formConfig.dre_subcategoria_id}
              className="w-full bg-rodovia-verde hover:bg-rodovia-verde/90 text-white h-12 text-lg font-bold tracking-wide"
            >
              {salvando ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              SALVAR CONFIGURAÇÃO
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ConfiguracaoContas;
