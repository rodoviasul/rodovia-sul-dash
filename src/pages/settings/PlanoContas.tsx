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
  TrendingUp,
  TrendingDown,
  ArrowLeftRight, 
  RefreshCw, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown
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

const ITENS_POR_PAGINA = 20;

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
  'Despesa Não Operacional': { icon: Coins, color: 'text-red-600' },
  'Receita Financeira': { icon: Landmark, color: 'text-emerald-600' },
  'Movimento de Capital': { icon: ArrowLeftRight, color: 'text-gray-500' },
  'Transferências Internas': { icon: ArrowLeftRight, color: 'text-blue-500' },
  'Ajustes de Caixa': { icon: RefreshCw, color: 'text-zinc-500' },
  'Ajuste de Caixa': { icon: RefreshCw, color: 'text-zinc-500' },
  'Receitas': { icon: Wallet, color: 'text-emerald-600' },
  'Despesas': { icon: TrendingUp, color: 'text-orange-500' },
};

const ConfiguracaoContas: React.FC = () => {
  const { contas, loading: loadingContas, error, lastSync, salvarConfiguracao, refresh } = useContas();
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
  
  const [formConfig, setFormConfig] = useState<Partial<ContaUnificada>>({});
  const [salvando, setSalvando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  // Ordenação
  const [ordenacao, setOrdenacao] = useState<{ coluna: keyof ContaUnificada | 'status'; direcao: 'asc' | 'desc' }>({
    coluna: 'concod',
    direcao: 'asc'
  });

  // Lógica de Filtro e Busca
  const dadosFiltrados = useMemo(() => {
    let filtrados = contas.filter((conta) => {
      const matchTexto = 
        conta.condescr.toLowerCase().includes(busca.toLowerCase()) ||
        conta.concod.includes(busca);
      
      if (!matchTexto) return false;

      if (filtroStatus === 'pendentes') return conta.precisa_configurar;
      if (filtroStatus === 'configurados') return !conta.precisa_configurar;
      
      return true;
    });

    // Aplicar Ordenação
    return filtrados.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (ordenacao.coluna === 'status') {
        valA = a.precisa_configurar ? 1 : 0;
        valB = b.precisa_configurar ? 1 : 0;
      } else if (ordenacao.coluna === 'dre_categoria_id') {
        valA = categoriasDRE.find(c => c.id === a.dre_categoria_id)?.nome || '';
        valB = categoriasDRE.find(c => c.id === b.dre_categoria_id)?.nome || '';
      } else if (ordenacao.coluna === 'dre_subcategoria_id') {
        valA = subcategoriasDRE.find(s => s.id === a.dre_subcategoria_id)?.nome || '';
        valB = subcategoriasDRE.find(s => s.id === b.dre_subcategoria_id)?.nome || '';
      } else {
        valA = a[ordenacao.coluna as keyof ContaUnificada] || '';
        valB = b[ordenacao.coluna as keyof ContaUnificada] || '';
      }

      // Lógica especial para Código (Numérica)
      if (ordenacao.coluna === 'concod') {
        const numA = parseInt(valA as string) || 0;
        const numB = parseInt(valB as string) || 0;
        return ordenacao.direcao === 'asc' ? numA - numB : numB - numA;
      }

      if (valA < valB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valA > valB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });
  }, [contas, busca, filtroStatus, ordenacao, categoriasDRE, subcategoriasDRE]);

  // Paginação
  const totalPaginas = Math.ceil(dadosFiltrados.length / ITENS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const dadosPaginados = dadosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);

  // Handlers
  const handleSort = (coluna: keyof ContaUnificada | 'status') => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ coluna }: { coluna: keyof ContaUnificada | 'status' }) => {
    if (ordenacao.coluna !== coluna) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
    return ordenacao.direcao === 'asc' 
      ? <ArrowUp className="ml-2 h-3 w-3 text-rodovia-verde" /> 
      : <ArrowDown className="ml-2 h-3 w-3 text-rodovia-verde" />;
  };

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
    
    // Busca insensível a maiúsculas/minúsculas
    const key = Object.keys(ICONES_CATEGORIA).find(
      k => k.toLowerCase() === nome.toLowerCase()
    );
    
    return key ? ICONES_CATEGORIA[key] : { icon: AlertCircle, color: 'text-zinc-400' };
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
  const handleRefresh = async () => {
    setSincronizando(true);
    try {
      await refresh();
      toast.success("Dados sincronizados com o ERP!");
    } catch (err) {
      toast.error("Erro ao sincronizar com o ERP.");
    } finally {
      setSincronizando(false);
    }
  };

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
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
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
    <div className="flex flex-col h-full px-4 pb-0 space-y-2 overflow-hidden">
      {/* Editorial Header - Fixed Area */}
      <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-end gap-2 border-b border-rodovia-verde/20 pb-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-rodovia-verde" />
            <span className="text-[9px] font-mono font-black text-rodovia-verde uppercase tracking-[0.4em]">Gestão de Dados</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-rodovia-azul uppercase">
            Plano de Contas <span className="text-rodovia-verde">Gerencial</span>
          </h1>
          <p className="text-zinc-500 text-[11px] font-medium max-w-xl">
            Classifique suas contas contábeis nas categorias gerenciais da sua DRE.
          </p>
        </div>
        
        <div className="flex items-center gap-1 bg-white/50 backdrop-blur-md p-1 rounded-xl border border-black/5">
          <Button 
            variant={filtroStatus === 'todos' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => { setFiltroStatus('todos'); setPaginaAtual(1); }}
            className={cn(
              "text-[9px] font-black uppercase tracking-widest rounded-lg px-4 h-8",
              filtroStatus === 'todos' && "bg-rodovia-verde text-white hover:bg-rodovia-verde shadow-lg shadow-rodovia-verde/20"
            )}
          >
            Todas
          </Button>
          <Button 
            variant={filtroStatus === 'pendentes' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => { setFiltroStatus('pendentes'); setPaginaAtual(1); }}
            className={cn(
              "text-[9px] font-black uppercase tracking-widest rounded-lg px-4 h-8",
              filtroStatus === 'pendentes' ? "bg-amber-500 text-white hover:bg-amber-500 shadow-lg shadow-amber-500/20" : "text-amber-600"
            )}
          >
            Pendentes
          </Button>
          <Button 
            variant={filtroStatus === 'configurados' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => { setFiltroStatus('configurados'); setPaginaAtual(1); }}
            className={cn(
              "text-[9px] font-black uppercase tracking-widest rounded-lg px-4 h-8",
              filtroStatus === 'configurados' ? "bg-emerald-600 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-600/20" : "text-green-600"
            )}
          >
            Configuradas
          </Button>
        </div>
      </div>

      {/* Advanced Toolbar - Fixed Area */}
      <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-7 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-rodovia-verde transition-colors">
            <Search className="w-3.5 h-3.5" />
          </div>
          <Input 
            placeholder="BUSCAR CONTA..." 
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }}
            className="pl-11 h-10 bg-white rounded-xl border-2 border-zinc-100 text-[9px] font-black uppercase tracking-widest shadow-sm focus:border-rodovia-verde transition-all text-rodovia-azul"
          />
        </div>
        
        <div className="md:col-span-3 grid grid-cols-[1fr_auto_1fr] items-center bg-white rounded-xl border-2 border-zinc-100 shadow-sm h-10 overflow-hidden">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Total</span>
            <span className="text-sm font-black text-rodovia-azul">{contas.length}</span>
          </div>
          <div className="w-px h-5 bg-zinc-200" />
          <div className="flex flex-col items-center justify-center">
            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Filtrados</span>
            <span className="text-sm font-black text-rodovia-verde">{dadosFiltrados.length}</span>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-0.5">
          <Button 
            onClick={handleRefresh}
            disabled={sincronizando}
            className="h-8 bg-rodovia-azul hover:bg-rodovia-azul/90 text-white rounded-xl font-black text-[8px] uppercase tracking-widest shadow-md transition-all hover:scale-105 active:scale-95"
          >
            {sincronizando ? (
              <Loader2 className="w-3 h-3 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-2" />
            )}
            Sincronizar
          </Button>
          {lastSync && (
            <span className="text-[7px] font-mono font-bold text-zinc-500 uppercase text-center">
              Última sincronia: {lastSync}
            </span>
          )}
        </div>
      </div>

      {/* Tabela Container - Scrollable Area */}
      <div className="flex-1 min-h-0 bg-white/90 backdrop-blur-2xl rounded-2xl border border-black/5 overflow-hidden flex flex-col">
        <Table containerClassName="flex-1 overflow-auto">
          <TableHeader className="sticky top-0 z-20">
              <TableRow className="border-b-0 shadow-md">
                <TableHead 
                  className="w-[100px] bg-slate-900 text-white font-bold tracking-wider py-2 text-[9px] cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('concod')}
                >
                  <div className="flex items-center">CÓDIGO <SortIcon coluna="concod" /></div>
                </TableHead>
                <TableHead 
                  className="bg-slate-900 text-white font-bold tracking-wider py-2 text-[9px] cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('condescr')}
                >
                  <div className="flex items-center">CONTA (ERP) <SortIcon coluna="condescr" /></div>
                </TableHead>
                <TableHead 
                  className="w-[200px] bg-slate-900 text-white font-bold tracking-wider py-2 text-[9px] cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('dre_categoria_id')}
                >
                  <div className="flex items-center">CATEGORIA (DRE) <SortIcon coluna="dre_categoria_id" /></div>
                </TableHead>
                <TableHead 
                  className="w-[180px] bg-slate-900 text-white font-bold tracking-wider py-2 text-[9px] cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('dre_subcategoria_id')}
                >
                  <div className="flex items-center">DETALHE <SortIcon coluna="dre_subcategoria_id" /></div>
                </TableHead>
                <TableHead 
                  className="w-[100px] bg-slate-900 text-white font-bold tracking-wider py-2 text-[9px] cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('dre_sinal')}
                >
                  <div className="flex items-center">TIPO <SortIcon coluna="dre_sinal" /></div>
                </TableHead>
                <TableHead 
                  className="w-[100px] text-center bg-slate-900 text-white font-bold tracking-wider py-2 text-[9px] cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center">STATUS <SortIcon coluna="status" /></div>
                </TableHead>
                <TableHead className="w-[40px] bg-slate-900"></TableHead>
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
                      "group cursor-pointer transition-colors border-b border-zinc-100",
                      isEven ? "bg-white" : "bg-zinc-50/50",
                      "hover:bg-rodovia-verde/5"
                    )}
                    onClick={() => abrirEdicao(conta)}
                  >
                    <TableCell className="font-mono text-[9px] font-medium text-zinc-400 border-r border-zinc-50 py-1.5">
                      {conta.concod}
                    </TableCell>
                    <TableCell className="font-bold text-[11px] text-zinc-600 group-hover:text-rodovia-verde transition-colors border-r border-zinc-50 py-1.5 uppercase">
                      {conta.condescr}
                    </TableCell>
                    <TableCell className="border-r border-zinc-50 py-1.5">
                      {categoriaNome ? (
                        <Badge variant="outline" className="font-normal text-[8px] bg-white border-zinc-200 gap-1 pl-1 pr-2 py-0 shadow-sm">
                           {BadgeIcon && <BadgeIcon className={cn("w-2.5 h-2.5", badgeInfo?.color)} />}
                           <span className="text-zinc-600 font-medium uppercase">{categoriaNome}</span>
                        </Badge>
                      ) : (
                        <span className="text-zinc-300 text-[9px] italic">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[10px] text-zinc-500 border-r border-zinc-50 py-1.5 uppercase">
                      {subcategoriaNome || '-'}
                    </TableCell>
                    <TableCell className="border-r border-zinc-50 py-1.5">
                      <div className="flex items-center gap-1.5">
                        {conta.dre_sinal === 1 ? (
                          <div className="flex items-center gap-1 text-emerald-600 font-bold text-[9px]">
                            <TrendingUp className="w-3 h-3" />
                            <span>ENTRADA</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600 font-bold text-[9px]">
                            <TrendingDown className="w-3 h-3" />
                            <span>SAÍDA</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-r border-zinc-50 py-1.5">
                      {conta.precisa_configurar ? (
                        <Badge variant="secondary" className="text-[7px] bg-amber-50 text-amber-600 border-amber-200 font-black">
                          PENDENTE
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[7px] bg-green-50 text-green-600 border-green-100 font-black">
                          OK
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Settings2 className="w-3 h-3 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                    </TableCell>
                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>

        {/* Paginação - Fixed Bottom Area within Container */}
        {totalPaginas > 1 && (
          <div className="flex-shrink-0 flex items-center justify-between px-8 py-3 border-t bg-zinc-50/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-widest">
                {inicio + 1}-{Math.min(inicio + ITENS_POR_PAGINA, dadosFiltrados.length)} DE {dadosFiltrados.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="h-8 w-8 p-0 rounded-lg border-black/5 bg-white shadow-sm hover:bg-rodovia-verde hover:text-white transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pageNum = paginaAtual;
                  if (paginaAtual <= 3) pageNum = i + 1;
                  else if (paginaAtual >= totalPaginas - 2) pageNum = totalPaginas - 4 + i;
                  else pageNum = paginaAtual - 2 + i;

                  if (pageNum <= 0 || pageNum > totalPaginas) return null;

                  return (
                    <Button
                      key={pageNum}
                      variant={paginaAtual === pageNum ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setPaginaAtual(pageNum)}
                      className={cn(
                        "h-8 w-8 p-0 rounded-lg text-[9px] font-black font-mono transition-all",
                        paginaAtual === pageNum 
                          ? "bg-rodovia-verde text-white shadow-lg shadow-rodovia-verde/20 hover:bg-rodovia-verde" 
                          : "text-zinc-400 hover:bg-zinc-100"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="h-8 w-8 p-0 rounded-lg border-black/5 bg-white shadow-sm hover:bg-rodovia-verde hover:text-white transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
               <span className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-widest">
                PAG {paginaAtual}/{totalPaginas}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sheet de Edição (Painel Lateral) */}
      <Sheet open={!!contaEditando} onOpenChange={(open) => !open && setContaEditando(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] border-l border-zinc-100 shadow-2xl p-0 flex flex-col overflow-hidden">
          <SheetHeader className="p-8 pb-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-rodovia-verde" />
              <span className="text-[9px] font-mono font-black text-rodovia-verde uppercase tracking-[0.4em]">Configuração Gerencial</span>
            </div>
            <SheetTitle className="text-2xl font-black text-rodovia-azul uppercase tracking-tighter">
              {contaEditando?.condescr}
            </SheetTitle>
            <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              CÓDIGO ERP: {contaEditando?.concod} | TIPO ORIGINAL: {contaEditando?.contip}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6">
            {/* DRE - Categoria Principal */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Categoria (DRE)</Label>
              <Select 
                value={formConfig.dre_categoria_id || ''} 
                onValueChange={(val) => setFormConfig({ ...formConfig, dre_categoria_id: val, dre_subcategoria_id: '' })}
              >
                <SelectTrigger className="h-14 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-black text-[11px] uppercase tracking-widest focus:border-rodovia-verde focus:ring-0 transition-all">
                  <SelectValue placeholder="SELECIONE A CATEGORIA..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {categoriasDRE.filter(cat => cat.tipo !== 'SUBTOTAL').map((cat) => {
                    const info = getBadgeInfo(cat.id) || { icon: AlertCircle, color: 'text-zinc-500' };
                    const Icon = info.icon;
                    return (
                      <SelectItem key={cat.id} value={cat.id} className="focus:bg-rodovia-verde/10 focus:text-rodovia-verde rounded-xl py-3 px-4">
                        <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest">
                          <Icon className={cn("w-4 h-4", info.color)} />
                          <span>{cat.nome}</span>
                          {!cat.dre && (
                            <Badge variant="outline" className="text-[6px] h-3 px-1 border-zinc-200 text-zinc-400 font-bold">OFF-DRE</Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* DRE - Detalhe (Dinâmico) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Sub-Categoria (Detalhe)</Label>
              {subcategoriasDisponiveis.length > 0 ? (
                <Select
                  value={formConfig.dre_subcategoria_id || ''}
                  onValueChange={(val) => setFormConfig({ ...formConfig, dre_subcategoria_id: val })}
                  disabled={!formConfig.dre_categoria_id}
                >
                  <SelectTrigger className="h-14 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-black text-[11px] uppercase tracking-widest focus:border-rodovia-verde focus:ring-0 transition-all">
                    <SelectValue placeholder="SELECIONE O DETALHE..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {subcategoriasDisponiveis.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id} className="focus:bg-rodovia-verde/10 focus:text-rodovia-verde rounded-xl py-3 px-4">
                        <div className="font-black text-[11px] uppercase tracking-widest">
                          {sub.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center flex items-center justify-center gap-2">
                  <Search className="w-3.5 h-3.5 opacity-30" />
                  {formConfig.dre_categoria_id 
                    ? "NENHUM DETALHE CADASTRADO" 
                    : "SELECIONE UMA CATEGORIA PRIMEIRO"}
                </div>
              )}
            </div>

            {/* DRE - Natureza (Entrada/Saída) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Natureza (Entrada/Saída)</Label>
              <Select 
                value={formConfig.dre_sinal?.toString() || ''} 
                onValueChange={(val) => setFormConfig({ ...formConfig, dre_sinal: parseInt(val) })}
              >
                <SelectTrigger className="h-14 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-black text-[11px] uppercase tracking-widest focus:border-rodovia-verde focus:ring-0 transition-all">
                  <SelectValue placeholder="SELECIONE A NATUREZA..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="1" className="focus:bg-emerald-500/10 focus:text-emerald-600 rounded-xl py-3 px-4">
                    <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>ENTRADA (SOMAR)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="-1" className="focus:bg-red-500/10 focus:text-red-600 rounded-xl py-3 px-4">
                    <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span>SAÍDA (SUBTRAIR)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Fluxo de Caixa - Tipo */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Tipo Fluxo</Label>
                <Select 
                  value={formConfig.fluxo_tipo_id || ''} 
                  onValueChange={(val) => setFormConfig({ ...formConfig, fluxo_tipo_id: val, fluxo_categoria_id: '' })}
                >
                  <SelectTrigger className="h-14 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-black text-[11px] uppercase tracking-widest focus:border-rodovia-verde focus:ring-0 transition-all">
                    <SelectValue placeholder="TIPO..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {tiposFluxo.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id} className="focus:bg-rodovia-verde/10 focus:text-rodovia-verde rounded-xl py-3 px-4 font-black text-[11px] uppercase tracking-widest">
                        {tipo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fluxo de Caixa - Categoria */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Categoria Fluxo</Label>
                <Select 
                  value={formConfig.fluxo_categoria_id || ''} 
                  onValueChange={(val) => setFormConfig({ ...formConfig, fluxo_categoria_id: val })}
                  disabled={!formConfig.fluxo_tipo_id}
                >
                  <SelectTrigger className="h-14 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-black text-[11px] uppercase tracking-widest focus:border-rodovia-verde focus:ring-0 transition-all">
                    <SelectValue placeholder="CATEGORIA..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {categoriasFluxoDisponiveis.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="focus:bg-rodovia-verde/10 focus:text-rodovia-verde rounded-xl py-3 px-4 font-black text-[11px] uppercase tracking-widest">
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <SheetFooter className="bg-zinc-50 p-8 mt-auto flex-shrink-0">
            <Button 
              onClick={salvar} 
              disabled={salvando || !formConfig.dre_categoria_id || !formConfig.dre_subcategoria_id}
              className="w-full bg-rodovia-verde hover:bg-rodovia-verde/90 text-white h-14 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-rodovia-verde/20 transition-all active:scale-95"
            >
              {salvando ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Salvar Configuração
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ConfiguracaoContas;
