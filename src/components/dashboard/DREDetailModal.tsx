import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { executeQuery } from "@/services/api";
import { Search, Loader2, FileText, Calendar, DollarSign, Layers, ArrowUpDown, ChevronUp, ChevronDown, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";

interface DREDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    value: number;
    dateLabel: string;
    contasIds: (string | number)[];
    dateRange: { start: string; end: string };
  } | null;
}

interface DetalheItem {
  cod_movimento: number;
  concod: number;
  fornecedor: string;
  descricao_conta: string;
  data: string;
  valor: number;
  observacao: string;
  tipo_lancamento: string;
}

type SortConfig = {
  key: keyof DetalheItem;
  direction: 'asc' | 'desc';
} | null;

export function DREDetailModal({ isOpen, onClose, data }: DREDetailModalProps) {
  const [items, setItems] = useState<DetalheItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  useEffect(() => {
    if (isOpen && data && data.contasIds.length > 0) {
      fetchDetails();
    } else {
      setItems([]);
      setSortConfig(null);
    }
  }, [isOpen, data]);

  const fetchDetails = async () => {
    if (!data) return;

    // Validação de segurança para evitar erro 400
    const validIds = data.contasIds?.filter(id => 
      (typeof id === 'number' && !isNaN(id)) || 
      (typeof id === 'string' && id.trim() !== '')
    ) || [];
    
    if (validIds.length === 0) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      // Formata a lista de IDs para a query SQL (ex: 1, 2, 3 ou '1', '2')
      // AVISO: O DuckDB pode ser rigoroso com tipos. Se a coluna 'conta' no banco for INT,
      // devemos passar números. Se for VARCHAR, strings.
      // O erro anterior "Could not convert string '' to INT32" sugere que o banco espera INT,
      // mas algum valor vazio ou string estava sendo passado.
      
      const idsNumericos = validIds
        .map(id => Number(id))
        .filter(n => !isNaN(n));

      if (idsNumericos.length === 0) {
         setItems([]);
         return;
      }

      // IMPORTANTE:
      // O DuckDB (e bancos em geral) é estrito com tipos.
      // u.conta vem de uma UNION entre tabreceb.recconta e tabdespesas.desconta.
      // Essas colunas geralmente são VARCHAR ou INT dependendo da origem.
      // Se a query falha com "Could not convert string '' to INT32" na cláusula IN, 
      // é porque u.conta é INT32 e estamos passando algo que ele acha que é string, 
      // OU u.conta é VARCHAR e estamos comparando com INTs de forma que ele tenta converter a coluna toda pra INT.
      
      // Dado o erro anterior, parece que o DuckDB infere u.conta como INT32 (talvez tabreceb/tabdespesas tenham int).
      // Mas se houver algum valor vazio na tabela (sujeira), a conversão falha.
      
      // Vamos forçar o cast para evitar ambiguidade:
      // u.conta::VARCHAR in ('1', '2', '3') -> Mais seguro se houver mistura de tipos
      
      const contasIdsStr = idsNumericos.map(n => `'${n}'`).join(",");
      
      const query = `
        with unified_movs as (
            select reclan as lan, recconta as conta, recvalor as valor from tabreceb
            union all
            select deslan as lan, desconta as conta, desvalor as valor from tabdespesas
        )
        select
            m.movlanc as cod_movimento,
            u.conta as concod,
            f.fornome as fornecedor,
            c.condescr as descricao_conta,
            m.movdatacxa as data,
            round(u.valor, 2) as valor,
            m.movobs as observacao,
            m.movtipolan as tipo_lancamento
        from tabmovimento as m
        inner join unified_movs u on m.movlanc = u.lan
        left join tabcontas c on cast(c.concod as varchar) = cast(u.conta as varchar)
        left join tabfornecedores f on f.forcod = m.movfornec
        where 
          cast(u.conta as varchar) in (${contasIdsStr})
          and m.movdatacxa between '${data.dateRange.start}' and '${data.dateRange.end}'
        order by m.movdatacxa desc
      `;

      const result = await executeQuery(query);
      setItems(result.data || []);
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof DetalheItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (item) => {
          const dataFormatada = item.data ? format(new Date(item.data), "dd/MM/yyyy") : "";
          const valorString = item.valor?.toString() || "";
          const valorFormatado = item.valor?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "";
          
          return (
            item.descricao_conta?.toLowerCase().includes(lowerSearch) ||
            item.fornecedor?.toLowerCase().includes(lowerSearch) ||
            item.observacao?.toLowerCase().includes(lowerSearch) ||
            item.cod_movimento?.toString().includes(lowerSearch) ||
            dataFormatada.includes(lowerSearch) ||
            valorString.includes(lowerSearch) ||
            valorFormatado.includes(lowerSearch)
          );
        }
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [items, searchTerm, sortConfig]);

  const totalFiltered = filteredItems.reduce((acc, item) => acc + (item.valor || 0), 0);

  const SortIcon = ({ column }: { column: keyof DetalheItem }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="ml-2 h-3 w-3 text-white/50" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="ml-2 h-3 w-3 text-white" />
      : <ChevronDown className="ml-2 h-3 w-3 text-white" />;
  };

  const handleExportExcel = () => {
    if (!data) return;

    // Formata os dados para o Excel
    const excelData = filteredItems.map(item => ({
      "ID": item.cod_movimento,
      "Data": item.data ? format(new Date(item.data), "dd/MM/yyyy") : "-",
      "Conta": item.descricao_conta || "-",
      "Fornecedor": item.fornecedor || "-",
      "Valor": item.valor || 0,
      "Observação": item.observacao || "-"
    }));

    // Cria uma nova planilha
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Ajusta largura das colunas
    const wscols = [
      { wch: 10 }, // ID
      { wch: 12 }, // Data
      { wch: 40 }, // Conta
      { wch: 30 }, // Fornecedor
      { wch: 15 }, // Valor
      { wch: 50 }, // Observação
    ];
    ws['!cols'] = wscols;

    // Formata a coluna de Valor como moeda
    // Note: SheetJS Community Edition tem suporte limitado a formatação de células, mas vamos tentar
    // O ideal seria formatar como string se a formatação numérica não funcionar bem na versão free
    
    // Cria um novo workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detalhamento");

    // Gera o arquivo
    const fileName = `Relatorio_Detalhamento_${data.dateLabel.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border-none shadow-2xl [&>button]:hidden">
        {/* Header Moderno */}
        <div className="bg-rodovia-azul px-8 py-6 flex flex-col gap-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rodovia-verde font-mono text-xs font-black uppercase tracking-widest">
                <Layers className="w-3.5 h-3.5" />
                <span>Detalhamento de Conta</span>
              </div>
              <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase">
                {data.title}
              </DialogTitle>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-rodovia-verde font-mono text-xs font-black uppercase tracking-widest mb-1">
                Período Selecionado
              </span>
              <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">{data.dateLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex-1 flex items-center gap-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Valor Total DRE</p>
                <p className="text-xl font-black text-white">
                  {data.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex-1 flex items-center gap-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-rodovia-verde/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-rodovia-verde" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Lançamentos</p>
                <p className="text-xl font-black text-rodovia-verde">
                  {items.length} <span className="text-xs font-normal text-white/40">registros</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo com Tabela e Filtros */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50/50">
          <div className="p-4 border-b border-zinc-200 bg-white flex items-center justify-between gap-4 shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Pesquisar por descrição, fornecedor, valor, data, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-zinc-50 border-zinc-200 focus:bg-white transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-lg border border-zinc-200">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Filtrado:</span>
                <span className={`text-sm font-black ${totalFiltered < 0 ? 'text-red-600' : 'text-zinc-900'}`}>
                  {totalFiltered.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors font-bold text-xs uppercase tracking-wider group"
                title="Baixar Excel"
              >
                <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-0 relative">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-rodovia-azul" />
                <span className="text-xs font-bold uppercase tracking-widest">Carregando lançamentos...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
                <FileText className="w-12 h-12 opacity-20" />
                <p className="font-medium">Nenhum lançamento encontrado para este período.</p>
              </div>
            ) : (
              <Table containerClassName="h-full">
                <TableHeader className="bg-rodovia-azul sticky top-0 z-50 shadow-md">
                  <TableRow className="hover:bg-rodovia-azul border-b border-white/10">
                    <TableHead 
                      className="bg-rodovia-azul w-[80px] text-center font-black text-xs uppercase tracking-wider text-white cursor-pointer select-none hover:bg-white/5 transition-colors focus:bg-rodovia-azul active:bg-rodovia-azul"
                      onClick={() => handleSort('cod_movimento')}
                    >
                      <div className="flex items-center justify-center">
                        ID
                        <SortIcon column="cod_movimento" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="bg-rodovia-azul w-[100px] font-black text-xs uppercase tracking-wider text-white cursor-pointer select-none hover:bg-white/5 transition-colors focus:bg-rodovia-azul active:bg-rodovia-azul"
                      onClick={() => handleSort('data')}
                    >
                      <div className="flex items-center">
                        Data
                        <SortIcon column="data" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="bg-rodovia-azul font-black text-xs uppercase tracking-wider text-white cursor-pointer select-none hover:bg-white/5 transition-colors focus:bg-rodovia-azul active:bg-rodovia-azul"
                      onClick={() => handleSort('descricao_conta')}
                    >
                      <div className="flex items-center">
                        Descrição / Conta
                        <SortIcon column="descricao_conta" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="bg-rodovia-azul font-black text-xs uppercase tracking-wider text-white cursor-pointer select-none hover:bg-white/5 transition-colors focus:bg-rodovia-azul active:bg-rodovia-azul"
                      onClick={() => handleSort('fornecedor')}
                    >
                      <div className="flex items-center">
                        Fornecedor
                        <SortIcon column="fornecedor" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="bg-rodovia-azul w-[120px] text-right font-black text-xs uppercase tracking-wider text-white cursor-pointer select-none hover:bg-white/5 transition-colors focus:bg-rodovia-azul active:bg-rodovia-azul"
                      onClick={() => handleSort('valor')}
                    >
                      <div className="flex items-center justify-end">
                        Valor
                        <SortIcon column="valor" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, idx) => (
                    <TableRow key={`${item.cod_movimento}-${idx}`} className="group hover:bg-blue-50/50 transition-colors border-b border-zinc-100">
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono text-[10px] text-zinc-400 border-zinc-200 bg-white">
                          #{item.cod_movimento}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium text-zinc-600">
                        {item.data ? format(new Date(item.data), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-zinc-800 text-sm">{item.descricao_conta}</span>
                          {item.observacao && (
                            <span className="text-xs text-zinc-500 italic truncate max-w-[300px]" title={item.observacao}>
                              {item.observacao}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-600 font-medium">
                        {item.fornecedor || "-"}
                      </TableCell>
                      <TableCell className="text-right">
        <span className={`font-mono font-bold text-sm ${(item.tipo_lancamento === 'E' || item.tipo_lancamento === 'R') ? "text-emerald-600" : "text-red-600"}`}>
          {item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
