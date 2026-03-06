import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Play, 
  Table as TableIcon, 
  Code2, 
  AlertCircle, 
  Trash2,
  X,
  Check,
  Loader2, 
  ChevronDown,
  ChevronUp,
  Download,
  Maximize2,
  Minimize2,
  Save,
  List
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion, acceptCompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { Prec } from "@codemirror/state";
import { supabase } from "@/lib/supabase";

const API_QUERY_URL = "/api/v1/query";
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

const DEFAULT_QUERY = `-- Escreva sua consulta SQL aqui...
-- Ex: SELECT * FROM tabmovimento LIMIT 10`;

import { useContas } from "@/hooks/useContas";
import { useDominios } from "@/hooks/useDominios";
import { registerTable } from "@/services/duckdb";

const DUCKDB_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
  'ON', 'AND', 'OR', 'NOT', 'AS', 'DISTINCT', 'SUM', 'COUNT', 'AVG', 'MIN', 'MAX', 'ROUND',
  'BETWEEN', 'IS', 'NULL', 'NULLS', 'FIRST', 'LAST', 'DESC', 'ASC', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'read_parquet', 'read_csv', 'read_json', 'strptime', 'strftime', 'regexp_matches',
  'approx_count_distinct', 'arg_max', 'arg_min', 'array_agg', 'bit_and', 'bit_or', 'bit_xor',
  'list', 'median', 'mode', 'quantile_cont', 'quantile_disc', 'stddev_pop', 'stddev_samp',
  'var_pop', 'var_samp', 'list_append', 'list_concat', 'list_extract', 'list_filter',
  'list_sort', 'list_transform', 'list_value', 'struct_extract', 'struct_pack'
];

const duckDbCompletions = (context: any) => {
  let word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {
    from: word.from,
    options: [
      ...DUCKDB_KEYWORDS.map(k => ({ label: k, type: "keyword", boost: 90 })),
      { label: "tabmovimento", type: "table", boost: 100 },
      { label: "tabreceb", type: "table", boost: 100 },
      { label: "tabdespesas", type: "table", boost: 100 },
      { label: "tabcontas", type: "table", boost: 100 },
      { label: "tabbancos", type: "table", boost: 100 },
      // Tabelas Virtuais (Supabase)
      { label: "config_contas", type: "table", boost: 110 },
      { label: "categorias_dre", type: "table", boost: 110 },
      { label: "subcategorias_dre", type: "table", boost: 110 },
    ],
    filter: true 
  };
};

const QueryTester: React.FC = () => {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnTypes, setColumnTypes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [initializingDb, setInitializingDb] = useState(false);
  
  const { contas, loading: loadingContas } = useContas();
  const { categoriasDRE, subcategoriasDRE, loading: loadingDominios } = useDominios();
  const [dbReady, setDbReady] = useState(false);
  
  // Estados para salvar consulta
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [queryTitle, setQueryTitle] = useState("");
  const [queryDesc, setQueryDescription] = useState("");
  const [savedQueries, setSavedQueries] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Registrar tabelas do Supabase no DuckDB
  useEffect(() => {
    const setupTables = async () => {
      if (loadingContas || loadingDominios) return;
      
      setInitializingDb(true);
      try {
        if (contas.length > 0) {
          await registerTable('config_contas', contas);
        }
        if (categoriasDRE.length > 0) await registerTable('categorias_dre', categoriasDRE);
        if (subcategoriasDRE.length > 0) await registerTable('subcategorias_dre', subcategoriasDRE);
        
        setDbReady(true);
      } catch (err) {
        console.error("Erro ao preparar banco de dados local:", err);
      } finally {
        setInitializingDb(false);
      }
    };
    
    setupTables();
  }, [contas, categoriasDRE, subcategoriasDRE, loadingContas, loadingDominios]);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Importando dinamicamente para evitar carregar o DuckDB-Wasm sem necessidade
      const { executeQuery: executeCombinedQuery } = await import('../../services/api');
      const { data, columns: duckDbCols } = await executeCombinedQuery(query);
      
      if (Array.isArray(data)) {
        setResults(data);
        if (data.length > 0) {
          const colNames = Object.keys(data[0]);
          setColumns(colNames);
          
          // Se tivermos os tipos vindos do DuckDB, usamos eles
          if (duckDbCols) {
            const typesMap: Record<string, string> = {};
            duckDbCols.forEach(c => {
              typesMap[c.name] = c.type;
            });
            setColumnTypes(typesMap);
          } else {
            // Fallback: Inferir tipo básico do primeiro registro se não vier do DuckDB
            const typesMap: Record<string, string> = {};
            colNames.forEach(col => {
              const val = data[0][col];
              typesMap[col] = typeof val === 'number' ? 'NUMBER' : typeof val === 'boolean' ? 'BOOLEAN' : 'STRING';
            });
            setColumnTypes(typesMap);
          }
        } else {
          setColumns([]);
          setColumnTypes({});
        }
      } else {
        throw new Error("Formato de resposta inválido.");
      }
      
      toast.success("Consulta executada com sucesso!");
    } catch (err: any) {
      console.error("Erro na execução da query:", err);
      
      let errorMessage = "Erro desconhecido ao executar consulta.";
      
      if (err.response?.data) {
        const data = err.response.data;
        // Tenta extrair a mensagem de erro da API do Supabase ou da nossa API customizada
        errorMessage = data.message || data.error || data.detail || (typeof data === 'string' ? data : JSON.stringify(data));
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error("Falha no processamento do SQL");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuery = async () => {
    if (!queryTitle.trim()) {
      toast.error("Por favor, informe um título para a consulta.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('saved_queries')
        .insert([
          { 
            title: queryTitle, 
            description: queryDesc, 
            sql_query: query,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      toast.success("Consulta salva com sucesso!");
      setSaveModalOpen(false);
      setQueryTitle("");
      setQueryDescription("");
      loadSavedQueries(); // Atualiza a lista
    } catch (err: any) {
      console.error("Erro ao salvar consulta:", err);
      toast.error("Erro ao salvar consulta no banco de dados.");
    } finally {
      setSaving(false);
    }
  };

  const loadSavedQueries = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_queries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedQueries(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar consultas:", err);
      toast.error("Erro ao carregar lista de consultas.");
    }
  };

  const selectQuery = (sq: any) => {
    setQuery(sq.sql_query);
    setListModalOpen(false);
    toast.success(`Consulta "${sq.title}" carregada!`);
  };

  const deleteQuery = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_queries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Consulta removida.");
      loadSavedQueries();
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      toast.error("Erro ao remover consulta.");
    }
  };

  useEffect(() => {
    if (listModalOpen) {
      loadSavedQueries();
    }
  }, [listModalOpen]);

  const downloadCSV = () => {
    if (results.length === 0) return;
    
    const header = columns.join(',');
    const rows = results.map(row => 
      columns.map(col => {
        const val = row[col];
        return typeof val === 'string' ? `"${val}"` : val;
      }).join(',')
    );
    
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `query_results_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCellValue = (val: any, col: string) => {
    if (val === null || val === undefined) return '-';
    
    // Se já for uma string no formato YYYY-MM-DD, retorna direto para evitar deslocamento de fuso
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return val;
    }
    
    // Formatação de data para colunas que terminam em 'DATA' ou 'VENC'
    if (col.toUpperCase().endsWith('DATA') || col.toUpperCase().endsWith('VENC')) {
      try {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          // Usa format do date-fns com UTC para evitar deslocamento
          return format(new Date(date.getTime() + date.getTimezoneOffset() * 60000), 'yyyy-MM-dd');
        }
      } catch (e) {
        // Se falhar, retorna o valor original
      }
    }
    
    return String(val);
  };

  return (
    <div className="flex flex-col h-full px-4 pb-0 space-y-2 overflow-hidden">
      {/* Header Area */}
      <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-end gap-2 border-b border-rodovia-verde/20 pb-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-rodovia-verde" />
            <span className="text-[9px] font-mono font-black text-rodovia-verde uppercase tracking-[0.4em]">Desenvolvimento</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-rodovia-azul uppercase">
            Laboratório de <span className="text-rodovia-verde">Consultas SQL</span>
          </h1>
          <p className="text-zinc-500 text-[11px] font-medium max-w-xl">
            Execute consultas SQL avançadas diretamente no seu banco de dados local e exporte os resultados.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-2">
        {/* SQL Editor Area - Top */}
        <div className="flex flex-col flex-shrink-0 h-1/2 min-h-[200px] space-y-2">
          <div className="flex items-center justify-between flex-shrink-0 px-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <Code2 className="w-3.5 h-3.5" /> Editor SQL
              </div>
              {initializingDb && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] font-black uppercase py-0 px-2 animate-pulse">
                  Configuring DB...
                </Badge>
              )}
              {dbReady && !initializingDb && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-black uppercase py-0 px-2">
                  DB Ready
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Dialog open={listModalOpen} onOpenChange={setListModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg text-zinc-400 hover:text-rodovia-azul hover:bg-rodovia-azul/10"
                    title="Listar Consultas Salvas"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col rounded-xl border-none shadow-2xl p-0 overflow-hidden">
              <DialogHeader className="p-8 pb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-px bg-rodovia-verde" />
                  <span className="text-[9px] font-mono font-black text-rodovia-verde uppercase tracking-[0.4em]">Repositório SQL</span>
                </div>
                <DialogTitle className="text-2xl font-black text-rodovia-azul uppercase tracking-tighter">Consultas Salvas</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-8 py-4 space-y-3 bg-zinc-50/30">
                {savedQueries.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground italic text-sm">
                    Nenhuma consulta salva ainda.
                  </div>
                ) : (
                  savedQueries.map((sq) => (
                    <div 
                      key={sq.id} 
                      className="group p-4 rounded-xl border border-zinc-200 bg-white hover:border-rodovia-verde/30 hover:shadow-md transition-all cursor-pointer relative"
                      onClick={() => selectQuery(sq)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-black text-sm text-rodovia-azul uppercase tracking-tight group-hover:text-rodovia-verde transition-colors">{sq.title}</h4>
                        <span className="text-[10px] font-mono font-black text-zinc-400">
                          {new Date(sq.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {sq.description && (
                        <p className="text-[11px] text-zinc-600 font-medium line-clamp-2 pr-12 leading-relaxed">{sq.description}</p>
                      )}
                      
                      <div className="absolute bottom-3 right-3 flex items-center gap-1">
                        {confirmDeleteId === sq.id ? (
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-red-100 shadow-sm animate-in fade-in slide-in-from-right-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-500 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQuery(sq.id);
                                setConfirmDeleteId(null);
                              }}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-zinc-400 hover:bg-zinc-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 hover:bg-red-50 h-8 w-8 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(sq.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg text-zinc-400 hover:text-rodovia-verde hover:bg-rodovia-verde/10"
                    title="Salvar Consulta"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-xl border-none shadow-2xl p-0 overflow-hidden">
                  <DialogHeader className="p-8 pb-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-px bg-rodovia-verde" />
                      <span className="text-[9px] font-mono font-black text-rodovia-verde uppercase tracking-[0.4em]">Configuração SQL</span>
                    </div>
                    <DialogTitle className="text-2xl font-black text-rodovia-azul uppercase tracking-tighter">Salvar Consulta</DialogTitle>
                  </DialogHeader>
                  <div className="px-8 py-4 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Título</label>
                      <Input 
                        placeholder="Ex: DRE Gerencial Janeiro" 
                        value={queryTitle}
                        onChange={(e) => setQueryTitle(e.target.value)}
                        className="h-12 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-black text-sm uppercase tracking-wider focus:border-rodovia-verde focus:ring-0 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Descrição</label>
                      <Textarea 
                        placeholder="Descreva o objetivo desta consulta..." 
                        value={queryDesc}
                        onChange={(e) => setQueryDescription(e.target.value)}
                        className="bg-zinc-50 border-2 border-zinc-100 rounded-xl font-medium text-sm focus:border-rodovia-verde focus:ring-0 transition-all min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter className="bg-zinc-50 p-8 mt-4">
                    <Button 
                      onClick={handleSaveQuery} 
                      disabled={saving}
                      className="w-full bg-rodovia-verde hover:bg-rodovia-verde/90 text-white font-black text-xs uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-rodovia-verde/20"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Confirmar e Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                variant="ghost"
                size="sm"
                onClick={downloadCSV}
                disabled={results.length === 0}
                className="h-8 w-8 p-0 rounded-lg text-zinc-400 hover:text-rodovia-verde hover:bg-rodovia-verde/10"
                title="Baixar CSV"
              >
                <Download className="w-4 h-4" />
              </Button>

              <div className="w-px h-4 bg-zinc-200 mx-1" />

              <Button 
                onClick={executeQuery} 
                disabled={loading}
                className="h-8 px-4 bg-rodovia-verde hover:bg-rodovia-verde/90 text-white font-black text-[9px] uppercase tracking-widest rounded-lg shadow-lg shadow-rodovia-verde/20 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Play className="w-3.5 h-3.5 mr-2" />}
                Executar SQL
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden rounded-xl border-2 border-slate-800 focus-within:border-rodovia-verde transition-all shadow-inner bg-[#282c34]">
            <CodeMirror
              value={query}
              height="100%"
              theme={oneDark}
              extensions={[
                Prec.highest(keymap.of([
                  { key: "Ctrl-Enter", run: () => { executeQuery(); return true; } },
                  { key: "Mod-Enter", run: () => { executeQuery(); return true; } },
                  { key: "Tab", run: acceptCompletion },
                  indentWithTab
                ])),
                sql({ 
                  upperCaseKeywords: true,
                  schema: {
                    tabmovimento: [],
                    tabdespesas: [],
                    tabcontas: [],
                    tabbancos: []
                  }
                }),
                autocompletion({ override: [duckDbCompletions] }),
              ]}
              onChange={(value) => setQuery(value)}
              className="h-full text-[11px] font-mono"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                autocompletion: true,
                indentOnInput: true,
                tabSize: 4,
              }}
            />
          </div>
        </div>

        {/* Results Area - Bottom */}
        <div className="flex-1 min-h-0 flex flex-col bg-white/90 backdrop-blur-2xl rounded-xl border border-black/5 overflow-hidden">
          <div className="flex-shrink-0 px-6 py-2 border-b border-black/5 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TableIcon className="w-3.5 h-3.5 text-rodovia-verde" />
                <span className="text-[10px] font-black text-rodovia-azul uppercase tracking-widest">Resultados</span>
              </div>
              {results.length > 0 && (
                <Badge variant="outline" className="text-[8px] font-black border-zinc-200 text-zinc-400 uppercase py-0 h-5">
                  {results.length} registros
                </Badge>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-30">
                <Loader2 className="w-8 h-8 animate-spin text-rodovia-verde mb-4" />
                <span className="text-[9px] font-mono font-black text-rodovia-verde uppercase tracking-widest animate-pulse">Executando...</span>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10">
                <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                <h3 className="text-base font-black text-rodovia-azul uppercase tracking-widest mb-2">Falha na Execução</h3>
                <p className="text-[11px] text-zinc-500 font-mono max-w-md bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 z-10">
                <Search className="w-10 h-10 mb-4 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Aguardando consulta...</p>
              </div>
            ) : (
              <Table containerClassName="absolute inset-0 overflow-auto" className="w-max min-w-full">
                <TableHeader className="sticky top-0 z-20 shadow-sm">
                  <TableRow className="border-b-0">
                    {columns.map((col) => (
                      <TableHead key={col} className="bg-slate-900 text-white font-bold tracking-wider py-2 text-[9px] uppercase whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span>{col}</span>
                          <span className="text-[7px] font-mono text-rodovia-verde/60 lowercase tracking-widest">
                            {columnTypes[col] || 'unknown'}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row, idx) => (
                    <TableRow key={idx} className={cn(
                      "group transition-colors border-b border-zinc-100",
                      idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50",
                      "hover:bg-rodovia-verde/5"
                    )}>
                      {columns.map((col) => (
                        <TableCell key={col} className="text-[10px] font-medium text-zinc-500 py-1.5 font-mono whitespace-nowrap border-r border-zinc-50">
                          {formatCellValue(row[col], col)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryTester;
