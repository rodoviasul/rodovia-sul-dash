import React, { useMemo, useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Wallet, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  ArrowRightLeft,
  CalendarDays,
  History,
  LayoutDashboard,
  Layers,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useDFCQuery } from "@/hooks/useDFCQuery";
import { ModernKPICard } from "@/components/dashboard/ModernKPICard";
import { Badge } from "@/components/ui/badge";
import { useFilter } from "@/contexts/FilterContext";
import { cn } from "@/lib/utils";
import { DRERow, TimePerspective } from "@/components/dashboard/DRERow";
import { Button } from "@/components/ui/button";

const MONTH_MAP: Record<string, number> = {
  "Jan": 0, "Fev": 1, "Mar": 2, "Abr": 3, "Mai": 4, "Jun": 5,
  "Jul": 6, "Ago": 7, "Set": 8, "Out": 9, "Nov": 10, "Dez": 11
};

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const DashboardLoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl">
      <div className="relative">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 -m-8 rounded-full bg-blue-500/20 blur-2xl"
        />
        
        <div className="relative bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-black/[0.03] flex flex-col items-center gap-6">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border-2 border-dashed border-blue-500/30 rounded-full"
            />
            <div className="w-16 h-16 bg-rodovia-azul rounded-2xl flex items-center justify-center shadow-lg shadow-rodovia-azul/20">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <h2 className="text-lg font-black tracking-tighter text-rodovia-azul uppercase">
              Calculando <span className="text-blue-500 italic">DFC</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  backgroundColor: ["#3b82f6", "#10b981", "#3b82f6"]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
              />
              <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest">
                Consolidando Fluxo de Caixa
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CashFlowDashboard() {
  const { period: year, month: monthLabel } = useFilter();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'monthly' | 'historical'>('monthly');

  const dateRange = useMemo(() => {
    if (viewMode === 'historical') {
      const end = endOfYear(new Date());
      return {
        start: '2013-01-01',
        end: format(end, 'yyyy-MM-dd')
      };
    }
    
    // For Annual View, we need the whole year regardless of selected month
    const start = startOfYear(new Date(parseInt(year), 0, 1));
    const end = endOfMonth(new Date(parseInt(year), 11, 31));

    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    };
  }, [year, viewMode]);

  const { flows, initialBalances, loading, error } = useDFCQuery(dateRange.start, dateRange.end);

  const processedData = useMemo(() => {
    if (loading || !flows || !initialBalances) return null;

    let columns: string[] = [];
    let periods: string[] = []; // keys to match 'periodo' in flows or year string

    if (viewMode === 'monthly') {
       // Initialize months array (0-11)
       periods = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
       columns = MONTH_LABELS;
    } else {
       // Historical: 2013 to Current Year
       const startYear = 2013;
       const endYear = new Date().getFullYear();
       for (let y = startYear; y <= endYear; y++) {
         periods.push(String(y));
         columns.push(String(y));
       }
    }

    // Initialize Bank Balances with Initial Balances
    // Note: If Historical, initialBalances are balances BEFORE 2013-01-01.
    // If Monthly, initialBalances are balances BEFORE start of selected year.
    const bankBalances = new Map<number, number>();
    initialBalances.forEach(b => {
      bankBalances.set(b.banco_id, (bankBalances.get(b.banco_id) || 0) + b.saldo_inicial);
    });

    // Structure to hold table rows data (arrays of N elements + Total)
    const numCols = periods.length + 1; // +1 for Total
    const initArray = () => new Array(numCols).fill(0);

    const rows = {
      saldoInicial: { total: initArray(), banks: new Map<number, number[]>() },
      entradasOp: { total: initArray(), banks: new Map<number, number[]>() },
      saidasOp: { total: initArray(), banks: new Map<number, number[]>() },
      fluxoOp: { total: initArray() },
      entradasInv: { total: initArray(), banks: new Map<number, number[]>() },
      saidasInv: { total: initArray(), banks: new Map<number, number[]>() },
      fluxoInv: { total: initArray() },
      entradasFin: { total: initArray(), banks: new Map<number, number[]>() },
      saidasFin: { total: initArray(), banks: new Map<number, number[]>() },
      fluxoFin: { total: initArray() },
      geracaoCaixa: { total: initArray() },
      saldoFinal: { total: initArray(), banks: new Map<number, number[]>() }
    };

    // Bank Names Map
    const bankNames = new Map<number, string>();
    initialBalances.forEach(b => bankNames.set(b.banco_id, b.banco_nome));
    flows.forEach(f => bankNames.set(f.banco_id, f.banco_nome));

    // Initialize Bank Arrays
    const allBankIds = Array.from(bankNames.keys());
    allBankIds.forEach(id => {
      rows.saldoInicial.banks.set(id, initArray());
      rows.saldoFinal.banks.set(id, initArray());
      rows.entradasOp.banks.set(id, initArray());
      rows.saidasOp.banks.set(id, initArray());
      rows.entradasInv.banks.set(id, initArray());
      rows.saidasInv.banks.set(id, initArray());
      rows.entradasFin.banks.set(id, initArray());
      rows.saidasFin.banks.set(id, initArray());
    });

    // Processing Loop
    let currentGlobalBalance = 0;
    // Set initial global balance
    initialBalances.forEach(b => currentGlobalBalance += b.saldo_inicial);

    periods.forEach((periodKey, colIdx) => {
      
      // 1. Set Start Balances for this period
      rows.saldoInicial.total[colIdx] = currentGlobalBalance;
      allBankIds.forEach(id => {
        rows.saldoInicial.banks.get(id)![colIdx] = bankBalances.get(id) || 0;
      });

      // 2. Process Flows
      // Filter flows that belong to this period
      // If monthly: flow.periodo === periodKey (YYYY-MM)
      // If historical: flow.periodo.startsWith(periodKey) (YYYY)
      const periodFlows = flows.filter(f => 
          viewMode === 'monthly' ? f.periodo === periodKey : f.periodo.startsWith(periodKey)
      );
      
      let pEntradasOp = 0;
      let pSaidasOp = 0;
      let pEntradasInv = 0;
      let pSaidasInv = 0;
      let pEntradasFin = 0;
      let pSaidasFin = 0;

      periodFlows.forEach(flow => {
        const type = flow.tipo_fluxo.toLowerCase();
        const bankId = flow.banco_id;
        
        if (type.includes('operacional')) {
          rows.entradasOp.banks.get(bankId)![colIdx] += flow.entradas;
          rows.saidasOp.banks.get(bankId)![colIdx] += flow.saidas;
          pEntradasOp += flow.entradas;
          pSaidasOp += flow.saidas;
        } else if (type.includes('investimento')) {
          rows.entradasInv.banks.get(bankId)![colIdx] += flow.entradas;
          rows.saidasInv.banks.get(bankId)![colIdx] += flow.saidas;
          pEntradasInv += flow.entradas;
          pSaidasInv += flow.saidas;
        } else if (type.includes('financiamento')) {
          rows.entradasFin.banks.get(bankId)![colIdx] += flow.entradas;
          rows.saidasFin.banks.get(bankId)![colIdx] += flow.saidas;
          pEntradasFin += flow.entradas;
          pSaidasFin += flow.saidas;
        }

        // Update Bank Balance
        const net = flow.liquido; 
        const currentBankBal = bankBalances.get(bankId) || 0;
        bankBalances.set(bankId, currentBankBal + net);
      });

      // Update Totals
      rows.entradasOp.total[colIdx] = pEntradasOp;
      rows.saidasOp.total[colIdx] = pSaidasOp;
      rows.fluxoOp.total[colIdx] = pEntradasOp - pSaidasOp;

      rows.entradasInv.total[colIdx] = pEntradasInv;
      rows.saidasInv.total[colIdx] = pSaidasInv;
      rows.fluxoInv.total[colIdx] = pEntradasInv - pSaidasInv;

      rows.entradasFin.total[colIdx] = pEntradasFin;
      rows.saidasFin.total[colIdx] = pSaidasFin;
      rows.fluxoFin.total[colIdx] = pEntradasFin - pSaidasFin;

      const geracao = (pEntradasOp - pSaidasOp) + (pEntradasInv - pSaidasInv) + (pEntradasFin - pSaidasFin);
      rows.geracaoCaixa.total[colIdx] = geracao;

      currentGlobalBalance += geracao;
      rows.saldoFinal.total[colIdx] = currentGlobalBalance;

      allBankIds.forEach(id => {
        rows.saldoFinal.banks.get(id)![colIdx] = bankBalances.get(id) || 0;
      });
    });

    // Calculate Totals Column (Last Index)
    const totalIdx = periods.length;
    
    // Balances: Start = First Period Start; End = Last Period End
    rows.saldoInicial.total[totalIdx] = rows.saldoInicial.total[0];
    rows.saldoFinal.total[totalIdx] = rows.saldoFinal.total[totalIdx - 1];
    
    ['entradasOp', 'saidasOp', 'fluxoOp', 'entradasInv', 'saidasInv', 'fluxoInv', 'entradasFin', 'saidasFin', 'fluxoFin', 'geracaoCaixa'].forEach(key => {
        const k = key as keyof typeof rows;
        if (rows[k].total) {
            rows[k].total[totalIdx] = rows[k].total.slice(0, totalIdx).reduce((a, b) => a + b, 0);
        }
    });

    // Handle Bank totals
    allBankIds.forEach(id => {
        rows.saldoInicial.banks.get(id)![totalIdx] = rows.saldoInicial.banks.get(id)![0];
        rows.saldoFinal.banks.get(id)![totalIdx] = rows.saldoFinal.banks.get(id)![totalIdx - 1];
        
        ['entradasOp', 'saidasOp', 'entradasInv', 'saidasInv', 'entradasFin', 'saidasFin'].forEach(key => {
             const k = key as keyof typeof rows;
             if (rows[k].banks) {
                 const arr = rows[k].banks.get(id)!;
                 arr[totalIdx] = arr.slice(0, totalIdx).reduce((a, b) => a + b, 0);
             }
        });
    });

    // Prepare KPIs Data (different logic for Historical?)
    // For now, let's keep KPIs showing the selected Month if in Monthly mode.
    // If Historical mode, maybe show Current Year vs Previous Year?
    // User didn't specify KPI changes, just visualization.
    // Let's adapt KPIs:
    // Monthly: Selected Month vs Previous Month.
    // Historical: Total of Current Year vs Total of Previous Year? Or just hide KPIs/keep them simple?
    // Let's keep the logic simple: KPIs reflect the "Current Reference".
    // If Historical, let's show the Last Year in the range vs Year before.
    
    let currentKpiIdx = -1;
    let prevKpiIdx = -1;

    if (viewMode === 'monthly') {
        currentKpiIdx = MONTH_MAP[monthLabel];
        prevKpiIdx = currentKpiIdx > 0 ? currentKpiIdx - 1 : -1;
    } else {
        // Historical: Last year vs Penultimate year
        currentKpiIdx = periods.length - 1; // Last column (Current Year)
        prevKpiIdx = periods.length > 1 ? periods.length - 2 : -1;
    }

    const getKpiVal = (arr: number[], idx: number) => idx >= 0 ? arr[idx] : 0;

    const kpis = {
      saldo_inicial: {
        current: getKpiVal(rows.saldoInicial.total, currentKpiIdx),
        previous: getKpiVal(rows.saldoInicial.total, prevKpiIdx),
      },
      fluxo_operacional: {
        current: getKpiVal(rows.fluxoOp.total, currentKpiIdx),
        previous: getKpiVal(rows.fluxoOp.total, prevKpiIdx),
      },
      fluxo_investimento: {
        current: getKpiVal(rows.fluxoInv.total, currentKpiIdx),
        previous: getKpiVal(rows.fluxoInv.total, prevKpiIdx),
      },
      fluxo_financiamento: {
        current: getKpiVal(rows.fluxoFin.total, currentKpiIdx),
        previous: getKpiVal(rows.fluxoFin.total, prevKpiIdx),
      },
      geracao_caixa: {
        current: getKpiVal(rows.geracaoCaixa.total, currentKpiIdx),
        previous: getKpiVal(rows.geracaoCaixa.total, prevKpiIdx),
      },
      saldo_final: {
        current: getKpiVal(rows.saldoFinal.total, currentKpiIdx),
        previous: getKpiVal(rows.saldoFinal.total, prevKpiIdx),
      }
    };

    // Helper to calculate AH
    const calculateAH = (values: number[]) => {
      return values.map((val, idx) => {
        if (idx === 0) return 0;
        const prev = values[idx - 1];
        if (prev === 0) return 0;
        return ((val - prev) / Math.abs(prev)) * 100;
      });
    };

    // Prepare Table Data structure for DRERow
    const createBankRows = (bankMap: Map<number, number[]>, parentId: string) => {
      return Array.from(bankMap.entries())
        .filter(([_, vals]) => vals.some(v => v !== 0)) // Only show banks with values
        .map(([id, vals]) => ({
          id: `${parentId}-bank-${id}`,
          name: bankNames.get(id) || `Banco ${id}`,
          values: vals,
          monthlyAH: calculateAH(vals),
          level: 2,
          tipo: 'CONTA'
        }));
    };

    const tableData = [
      {
        id: 'saldo-inicial',
        name: 'SALDO INICIAL',
        values: rows.saldoInicial.total,
        monthlyAH: calculateAH(rows.saldoInicial.total),
        subcategories: createBankRows(rows.saldoInicial.banks, 'saldo-inicial'),
        level: 1,
        tipo: 'CONTA'
      },
      {
        id: 'grp-operacional',
        name: 'FLUXO OPERACIONAL',
        values: rows.fluxoOp.total,
        monthlyAH: calculateAH(rows.fluxoOp.total),
        level: 1,
        tipo: 'SUBTOTAL',
        subcategories: [
            {
                id: 'entradas-op',
                name: '(+) Entradas Operacionais',
                values: rows.entradasOp.total,
                monthlyAH: calculateAH(rows.entradasOp.total),
                subcategories: createBankRows(rows.entradasOp.banks, 'entradas-op'),
                level: 2,
                tipo: 'CONTA'
            },
            {
                id: 'saidas-op',
                name: '(-) Saídas Operacionais',
                values: rows.saidasOp.total.map(v => -v),
                monthlyAH: calculateAH(rows.saidasOp.total.map(v => -v)),
                subcategories: createBankRows(rows.saidasOp.banks, 'saidas-op').map(r => ({...r, values: r.values?.map(v => -v), monthlyAH: calculateAH(r.values?.map(v => -v) || [])})),
                level: 2,
                tipo: 'CONTA'
            }
        ]
      },
      {
        id: 'grp-investimento',
        name: 'FLUXO DE INVESTIMENTO',
        values: rows.fluxoInv.total,
        monthlyAH: calculateAH(rows.fluxoInv.total),
        level: 1,
        tipo: 'SUBTOTAL',
        subcategories: [
            {
                id: 'entradas-inv',
                name: '(+) Entradas de Investimento',
                values: rows.entradasInv.total,
                monthlyAH: calculateAH(rows.entradasInv.total),
                subcategories: createBankRows(rows.entradasInv.banks, 'entradas-inv'),
                level: 2,
                tipo: 'CONTA'
            },
            {
                id: 'saidas-inv',
                name: '(-) Saídas de Investimento',
                values: rows.saidasInv.total.map(v => -v),
                monthlyAH: calculateAH(rows.saidasInv.total.map(v => -v)),
                subcategories: createBankRows(rows.saidasInv.banks, 'saidas-inv').map(r => ({...r, values: r.values?.map(v => -v), monthlyAH: calculateAH(r.values?.map(v => -v) || [])})),
                level: 2,
                tipo: 'CONTA'
            }
        ]
      },
      {
        id: 'grp-financiamento',
        name: 'FLUXO DE FINANCIAMENTO',
        values: rows.fluxoFin.total,
        monthlyAH: calculateAH(rows.fluxoFin.total),
        level: 1,
        tipo: 'SUBTOTAL',
        subcategories: [
            {
                id: 'entradas-fin',
                name: '(+) Entradas de Financiamento',
                values: rows.entradasFin.total,
                monthlyAH: calculateAH(rows.entradasFin.total),
                subcategories: createBankRows(rows.entradasFin.banks, 'entradas-fin'),
                level: 2,
                tipo: 'CONTA'
            },
            {
                id: 'saidas-fin',
                name: '(-) Saídas de Financiamento',
                values: rows.saidasFin.total.map(v => -v),
                monthlyAH: calculateAH(rows.saidasFin.total.map(v => -v)),
                subcategories: createBankRows(rows.saidasFin.banks, 'saidas-fin').map(r => ({...r, values: r.values?.map(v => -v), monthlyAH: calculateAH(r.values?.map(v => -v) || [])})),
                level: 2,
                tipo: 'CONTA'
            }
        ]
      },
      {
        id: 'geracao-caixa',
        name: '(=) GERAÇÃO DE CAIXA',
        values: rows.geracaoCaixa.total,
        monthlyAH: calculateAH(rows.geracaoCaixa.total),
        level: 1,
        tipo: 'SUBTOTAL'
      },
      {
        id: 'saldo-final',
        name: 'SALDO FINAL',
        values: rows.saldoFinal.total,
        monthlyAH: calculateAH(rows.saldoFinal.total),
        subcategories: createBankRows(rows.saldoFinal.banks, 'saldo-final'),
        level: 1,
        tipo: 'CONTA'
      }
    ];

    return { kpis, tableData, columns };
  }, [flows, initialBalances, loading, year, monthLabel, viewMode]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Columns for the table
  const columnLabels = useMemo(() => {
    if (processedData?.columns) return [...processedData.columns, "Total"];
    return [...MONTH_LABELS, "Total"];
  }, [processedData?.columns]);

  return (
    <div className="space-y-3 pb-20">
      <AnimatePresence>
        {loading && <DashboardLoadingScreen />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-rodovia-azul uppercase flex items-center gap-3">
            <Wallet className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            Fluxo de <span className="text-blue-500 italic">Caixa</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 font-bold uppercase tracking-widest mt-1 pl-1">
            DFC Gerencial • Referência: <span className="text-rodovia-azul">{viewMode === 'monthly' ? `${monthLabel}/${year}` : 'Histórico Completo'}</span>
          </p>
        </div>

        {/* View Mode Selector */}
        <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200">
          <button
            onClick={() => setViewMode('monthly')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2",
              viewMode === 'monthly' 
                ? "bg-white text-rodovia-azul shadow-sm" 
                : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Mensal
          </button>
          <button
            onClick={() => setViewMode('historical')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2",
              viewMode === 'historical' 
                ? "bg-white text-rodovia-azul shadow-sm" 
                : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <History className="w-4 h-4" />
            Histórico
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center">
          <p className="text-red-500 font-bold">Erro ao carregar dados: {error}</p>
        </div>
      ) : !processedData ? (
         <div className="p-20 text-center flex flex-col items-center gap-4">
            <Activity className="w-12 h-12 text-zinc-300" />
            <p className="text-zinc-500 font-medium">Nenhum dado encontrado para o período.</p>
         </div>
      ) : (
        <>
          {/* KPI Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
            <ModernKPICard
              label="Saldo Inicial"
              value={processedData.kpis.saldo_inicial.current}
              previousValue={processedData.kpis.saldo_inicial.previous}
              icon={Wallet}
              av={100}
              avLabel="Ref."
              storytelling="Caixa disponível no início do período."
              calculationDetail="Saldo acumulado do mês anterior."
              avDetail="Ponto de partida da análise."
            />
            <ModernKPICard
              label="Fluxo Operacional"
              value={processedData.kpis.fluxo_operacional.current}
              previousValue={processedData.kpis.fluxo_operacional.previous}
              icon={Activity}
              av={0} // TODO: Calc AV if needed
              avLabel="Impacto"
              highlight={processedData.kpis.fluxo_operacional.current > 0}
              storytelling="Caixa gerado pela operação principal."
              calculationDetail="Entradas Operacionais - Saídas Operacionais."
              avDetail="Impacto no caixa."
            />
            <ModernKPICard
              label="Investimentos"
              value={processedData.kpis.fluxo_investimento.current}
              previousValue={processedData.kpis.fluxo_investimento.previous}
              icon={TrendingUp}
              av={0}
              avLabel="Impacto"
              storytelling="Movimentação em ativos e expansão."
              calculationDetail="Compra/Venda de Imobilizado e Aplicações."
              avDetail="Impacto no caixa."
            />
            <ModernKPICard
              label="Financiamentos"
              value={processedData.kpis.fluxo_financiamento.current}
              previousValue={processedData.kpis.fluxo_financiamento.previous}
              icon={DollarSign}
              av={0}
              avLabel="Impacto"
              storytelling="Captação e pagamento de empréstimos."
              calculationDetail="Empréstimos, Amortizações e Juros."
              avDetail="Impacto no caixa."
            />
            <ModernKPICard
              label="Geração de Caixa"
              value={processedData.kpis.geracao_caixa.current}
              previousValue={processedData.kpis.geracao_caixa.previous}
              icon={ArrowRightLeft}
              av={0}
              avLabel="Impacto"
              highlight={processedData.kpis.geracao_caixa.current > 0}
              storytelling="Resultado líquido das movimentações do mês."
              calculationDetail="Soma dos Fluxos Operacional, Investimento e Financiamento."
              avDetail="Variação líquida."
            />
            <ModernKPICard
              label="Saldo Final"
              value={processedData.kpis.saldo_final.current}
              previousValue={processedData.kpis.saldo_final.previous}
              icon={Wallet}
              highlight={true}
              av={100}
              avLabel="Ref."
              storytelling="Disponibilidade total ao fim do mês."
              calculationDetail="Saldo Inicial + Geração de Caixa."
              avDetail="Posição final de liquidez."
            />
          </section>

          {/* DRE-Style Table */}
          <section className="bg-white border border-black/[0.03] rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden flex flex-col max-w-full">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-black tracking-tight text-rodovia-azul uppercase flex items-center gap-2">
                  <Layers className="w-5 h-5 text-rodovia-verde" />
                  Detalhamento <span className="text-rodovia-verde italic">Financeiro Anual</span>
                </h2>
                <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest pl-7">
                  Visão Analítica Mensal de {year}
                </p>
              </div>
            </div>

            <div className={cn(
              "w-full overflow-auto max-h-[850px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200/50 hover:scrollbar-thumb-zinc-300",
              "max-w-[calc(100vw-2.5rem)]"
            )}>
              {/* Largura ajustada para o Grid Anual (420px + 12*240px + 140px = 3440px) */}
              <div className={cn("pb-4", viewMode === 'monthly' ? "min-w-[3440px]" : "min-w-[4000px]")}>
                <DRERow 
                  id="header"
                  name="ESTRUTURA DFC" 
                  labels={columnLabels}
                  isHeader={true} 
                  timePerspective={viewMode === 'monthly' ? 'year' : 'multi-year'}
                  showAV={false}
                />
                
                {processedData.tableData.map((row: any) => {
                  const isExpanded = expandedRows.has(row.id);
                  const hasChildren = row.subcategories && row.subcategories.length > 0;

                  return (
                    <React.Fragment key={row.id}>
                        <DRERow
                            {...row}
                            timePerspective={viewMode === 'monthly' ? 'year' : 'multi-year'}
                            isExpanded={isExpanded}
                            hasChildren={hasChildren}
                            onToggle={() => toggleRow(row.id)}
                            showAV={false}
                        />
                        {isExpanded && row.subcategories.map((sub: any) => {
                            const isSubExpanded = expandedRows.has(sub.id);
                            const hasSubChildren = sub.subcategories && sub.subcategories.length > 0;
                            return (
                                <React.Fragment key={sub.id}>
                                    <DRERow
                                        {...sub}
                                        timePerspective={viewMode === 'monthly' ? 'year' : 'multi-year'}
                                        isExpanded={isSubExpanded}
                                        hasChildren={hasSubChildren}
                                        onToggle={() => toggleRow(sub.id)}
                                        className="bg-zinc-50/50"
                                        showAV={false}
                                    />
                                    {isSubExpanded && sub.subcategories?.map((bank: any) => (
                                        <DRERow
                                            key={bank.id}
                                            {...bank}
                                            timePerspective={viewMode === 'monthly' ? 'year' : 'multi-year'}
                                            level={3}
                                            className="bg-zinc-50/80 italic"
                                            showAV={false}
                                        />
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
