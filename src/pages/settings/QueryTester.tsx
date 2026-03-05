import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Play, 
  Table as TableIcon, 
  Code2, 
  AlertCircle, 
  Loader2, 
  ChevronDown,
  ChevronUp,
  Download,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from "@/lib/utils";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';

const API_QUERY_URL = "/api/v1/query";
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

const DEFAULT_QUERY = `select 
    tabcontas.concod, 
    movdatacxa, 
    round(sum(desvalor),2) as svalor 
from tabmovimento as tabmovimento
inner join tabdespesas as tabdespesas on tabmovimento.movlanc=tabdespesas.deslan 
left join tabcontas as tabcontas on tabdespesas.desconta=tabcontas.concod 
inner join tabbancos as tabbancos on movbanco=tabbancos.codigo 
where 1=1 
and movdatacxa between '2026-01-01' and '2026-01-31' 
and movtipolan = 'S' 
and banlistager = 'S' 
and contip <> 'T' 
group by tabcontas.concod, movdatacxa 
order by movdatacxa desc, tabcontas.concod asc`;

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
      ...DUCKDB_KEYWORDS.map(k => ({ label: k, type: "function", boost: 99 })),
      { label: "tabmovimento", type: "variable", boost: 100 },
      { label: "tabdespesas", type: "variable", boost: 100 },
      { label: "tabcontas", type: "variable", boost: 100 },
      { label: "tabbancos", type: "variable", boost: 100 },
    ],
    filter: true // Isso permite que o CodeMirror filtre os resultados conforme o usuário digita
  };
};

const QueryTester: React.FC = () => {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(API_QUERY_URL, {}, {
        params: {
          query: query
        },
        headers: {
          'accept': 'application/json',
          'x-api-token': API_TOKEN || '',
        }
      });
      
      // A API retorna { query: "...", count: N, data: [...] }
      const data = response.data.data;
      
      if (Array.isArray(data)) {
        setResults(data);
        if (data.length > 0) {
          setColumns(Object.keys(data[0]));
        } else {
          setColumns([]);
        }
      } else {
        throw new Error("Formato de resposta inválido. A propriedade 'data' deve ser um array.");
      }
      
      toast.success("Consulta executada com sucesso!");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message);
      toast.error("Erro ao executar consulta");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="flex flex-col h-full px-12 pb-4 space-y-4 overflow-hidden">
      {/* Header Area */}
      <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-rodovia-verde/20 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-rodovia-verde" />
            <span className="text-[10px] font-mono font-black text-rodovia-verde uppercase tracking-[0.4em]">Desenvolvimento</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-rodovia-azul uppercase">
            Laboratório de <span className="text-rodovia-verde">Consultas SQL</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-4 relative">
        <AnimatePresence mode="popLayout">
          {/* SQL Editor Area - Left Column */}
          {!isExpanded && (
            <motion.div 
              key="sql-editor"
              initial={{ opacity: 0, x: -100, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "33.333333%" }}
              exit={{ opacity: 0, x: -100, width: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex flex-col space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <Code2 className="w-3 h-3" /> Editor SQL (DBeaver Style)
                </div>
              </div>
              <div className="flex-1 overflow-hidden rounded-2xl border-2 border-slate-800 focus-within:border-rodovia-verde transition-all shadow-inner bg-[#282c34]">
                <CodeMirror
                  value={query}
                  height="100%"
                  theme={oneDark}
                  extensions={[
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
                    keymap.of([indentWithTab])
                  ]}
                  onChange={(value) => setQuery(value)}
                  className="h-full text-xs font-mono"
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
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={executeQuery} 
                  disabled={loading}
                  className="w-full h-10 bg-rodovia-verde hover:bg-rodovia-verde/90 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rodovia-verde/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  Executar Consulta
                </Button>
                <Button 
                  variant="outline" 
                  onClick={downloadCSV}
                  disabled={results.length === 0}
                  className="w-full h-10 border-black/5 bg-white shadow-sm text-zinc-500 font-black text-[10px] uppercase tracking-widest"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar CSV
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Area - Right Column */}
        <motion.div 
          layout
          className={cn(
            "flex flex-col bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-black/5 overflow-hidden shadow-2xl",
            isExpanded ? "flex-1" : "w-2/3"
          )}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex-shrink-0 px-8 py-4 border-b border-black/5 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-rodovia-verde" />
                <span className="text-[11px] font-black text-rodovia-azul uppercase tracking-widest">Resultados</span>
              </div>
              {results.length > 0 && (
                <Badge variant="outline" className="text-[9px] font-bold border-zinc-200 text-zinc-500">
                  {results.length} registros
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0 text-zinc-400 hover:text-rodovia-verde hover:bg-rodovia-verde/10 rounded-lg"
                title={isExpanded ? "Recolher" : "Expandir"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto relative">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                <Loader2 className="w-10 h-10 animate-spin text-rodovia-verde mb-4" />
                <span className="text-[10px] font-mono font-black text-rodovia-verde uppercase tracking-widest animate-pulse">Executando...</span>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-zinc-800 mb-2">Falha na Execução</h3>
                <p className="text-sm text-zinc-500 font-mono max-w-md">{error}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                <Search className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-xs font-black uppercase tracking-widest opacity-30">Sem resultados</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 z-20 shadow-sm">
                  <TableRow className="border-b-0">
                    {columns.map((col) => (
                      <TableHead key={col} className="bg-slate-900 text-white font-bold tracking-wider py-3 text-[10px] uppercase whitespace-nowrap">
                        {col}
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
                        <TableCell key={col} className="text-[10px] font-medium text-zinc-600 py-3 font-mono whitespace-nowrap">
                          {String(row[col])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QueryTester;
