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
  const [auditMonthFilter, setAuditMonthFilter] = useState<string>('all');
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

    const rows: { [key: string]: { total: number[], items: Map<any, number[]> } } = {
      saldoInicial: { total: initArray(), items: new Map<number, number[]>() },
      entradasOp: { total: initArray(), items: new Map<string, number[]>() },
      saidasOp: { total: initArray(), items: new Map<string, number[]>() },
      fluxoOp: { total: initArray(), items: new Map() },
      entradasInv: { total: initArray(), items: new Map<string, number[]>() },
      saidasInv: { total: initArray(), items: new Map<string, number[]>() },
      fluxoInv: { total: initArray(), items: new Map() },
      entradasFin: { total: initArray(), items: new Map<string, number[]>() },
      saidasFin: { total: initArray(), items: new Map<string, number[]>() },
      fluxoFin: { total: initArray(), items: new Map() },
      entradasNC: { total: initArray(), items: new Map<string, number[]>() },
      saidasNC: { total: initArray(), items: new Map<string, number[]>() },
      fluxoNC: { total: initArray(), items: new Map() },
      entradasTransf: { total: initArray(), items: new Map<string, number[]>() },
      saidasTransf: { total: initArray(), items: new Map<string, number[]>() },
      fluxoTransf: { total: initArray(), items: new Map() },
      entradasDiff: { total: initArray(), items: new Map<string, number[]>() },
      saidasDiff: { total: initArray(), items: new Map<string, number[]>() },
      fluxoDiff: { total: initArray(), items: new Map() },
      geracaoCaixa: { total: initArray(), items: new Map() },
      saldoFinal: { total: initArray(), items: new Map<number, number[]>() },
      entradasTransfAudit: { total: initArray(), items: new Map<string, number[]>() },
      saidasTransfAudit: { total: initArray(), items: new Map<string, number[]>() }
    };

    // Names Maps
    const bankNames = new Map<number, string>();
    initialBalances.forEach(b => bankNames.set(b.banco_id, b.banco_nome));
    flows.forEach(f => bankNames.set(f.banco_id, f.banco_nome));

    const accountNames = new Map<string, string>();
    const diffDetails = new Map<string, { movlanc?: number, movdata?: string, movobs?: string }>();
    const accountContips = new Map<string, string>();
    flows.forEach(f => {
      if (f.tipo_fluxo === 'DIFERENÇA' && f.movlanc) {
        const key = `DIF-${f.movlanc}`;
        diffDetails.set(key, { movlanc: f.movlanc, movdata: f.movdata, movobs: f.movobs });
      }
      if (f.concod) {
         accountNames.set(f.concod, f.condescr || 'Sem Descrição');
         accountContips.set(f.concod, f.contip || '');
      }
    });

    // Initialize Items Arrays for Balances
    const allBankIds = Array.from(bankNames.keys());
    allBankIds.forEach(id => {
      rows.saldoInicial.items.set(id, initArray());
      rows.saldoFinal.items.set(id, initArray());
    });

    // Processing Loop
    let currentGlobalBalance = 0;
    // Set initial global balance
    initialBalances.forEach(b => currentGlobalBalance += b.saldo_inicial);

    periods.forEach((periodKey, colIdx) => {
      
      // 1. Set Start Balances for this period
      rows.saldoInicial.total[colIdx] = currentGlobalBalance;
      allBankIds.forEach(id => {
        rows.saldoInicial.items.get(id)![colIdx] = bankBalances.get(id) || 0;
      });

      // 2. Process Flows
      // Filter flows that belong to this period
      const periodFlows = flows.filter(f => 
          viewMode === 'monthly' ? f.periodo === periodKey : f.periodo.startsWith(periodKey)
      );
      
      let pEntradasOp = 0;
      let pSaidasOp = 0;
      let pEntradasInv = 0;
      let pSaidasInv = 0;
      let pEntradasFin = 0;
      let pSaidasFin = 0;
      let pEntradasNC = 0;
      let pSaidasNC = 0;
      let pEntradasTransf = 0;
      let pSaidasTransf = 0;
      let pEntradasTransfAudit = 0;
      let pSaidasTransfAudit = 0;
      let pEntradasDiff = 0;
      let pSaidasDiff = 0;

      periodFlows.forEach(flow => {
        const type = flow.tipo_fluxo.toLowerCase();
        const bankId = flow.banco_id;
        const isDiff = type.includes('diferença');
        const accountKey = isDiff ? (flow.movlanc ? `DIF-${flow.movlanc}` : (flow.concod || 'DIF')) : (flow.concod || '0-NC');
        
        if (flow.concod && !accountNames.has(accountKey)) {
          accountNames.set(accountKey, flow.condescr || 'Sem Descrição');
        }
        
        const updateRow = (row: { items: Map<any, number[]> }, val: number) => {
          if (!row.items.has(accountKey)) row.items.set(accountKey, initArray());
          row.items.get(accountKey)![colIdx] += val;
        };

        const isGerencial = flow.banlistager === 'S';

        if (type.includes('operacional')) {
          updateRow(rows.entradasOp, flow.entradas);
          pEntradasOp += flow.entradas;
          if (isGerencial) {
            updateRow(rows.saidasOp, flow.saidas);
            pSaidasOp += flow.saidas;
          }
        } else if (type.includes('investimento')) {
          updateRow(rows.entradasInv, flow.entradas);
          pEntradasInv += flow.entradas;
          if (isGerencial) {
            updateRow(rows.saidasInv, flow.saidas);
            pSaidasInv += flow.saidas;
          }
        } else if (type.includes('financiamento')) {
          updateRow(rows.entradasFin, flow.entradas);
          pEntradasFin += flow.entradas;
          if (isGerencial) {
            updateRow(rows.saidasFin, flow.saidas);
            pSaidasFin += flow.saidas;
          }
        } else if (type.includes('transferência')) {
          // Audit takes everything
          updateRow(rows.entradasTransfAudit, flow.entradas);
          updateRow(rows.saidasTransfAudit, flow.saidas);
          pEntradasTransfAudit += flow.entradas;
          pSaidasTransfAudit += flow.saidas;
          
          // DFC only takes gerencial
          if (isGerencial) {
            updateRow(rows.entradasTransf, flow.entradas);
            updateRow(rows.saidasTransf, flow.saidas);
            pEntradasTransf += flow.entradas;
            pSaidasTransf += flow.saidas;
          }
        } else if (type.includes('não classificado')) {
          updateRow(rows.entradasNC, flow.entradas);
          pEntradasNC += flow.entradas;
          if (isGerencial) {
            updateRow(rows.saidasNC, flow.saidas);
            pSaidasNC += flow.saidas;
          }
        } else if (type.includes('diferença')) {
          updateRow(rows.entradasDiff, flow.entradas);
          pEntradasDiff += flow.entradas;
          if (isGerencial) {
            updateRow(rows.saidasDiff, flow.saidas);
            pSaidasDiff += flow.saidas;
          }
        }

        // Update Bank Balance (Only for banks present in saldoInicial/bankBalances)
        if (isGerencial) {
          const net = flow.liquido; 
          const currentBankBal = bankBalances.get(bankId) || 0;
          bankBalances.set(bankId, currentBankBal + net);
        }
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

      rows.entradasNC.total[colIdx] = pEntradasNC;
      rows.saidasNC.total[colIdx] = pSaidasNC;
      rows.fluxoNC.total[colIdx] = pEntradasNC - pSaidasNC;

      rows.entradasNC.total[colIdx] = pEntradasNC;
      rows.saidasNC.total[colIdx] = pSaidasNC;
      rows.fluxoNC.total[colIdx] = pEntradasNC - pSaidasNC;

      rows.entradasTransf.total[colIdx] = pEntradasTransf;
      rows.saidasTransf.total[colIdx] = pSaidasTransf;
      rows.fluxoTransf.total[colIdx] = pEntradasTransf - pSaidasTransf;

      rows.entradasTransfAudit.total[colIdx] = pEntradasTransfAudit;
      rows.saidasTransfAudit.total[colIdx] = pSaidasTransfAudit;

      rows.entradasDiff.total[colIdx] = pEntradasDiff;
      rows.saidasDiff.total[colIdx] = pSaidasDiff;
      rows.fluxoDiff.total[colIdx] = pEntradasDiff - pSaidasDiff;

      const geracao = (pEntradasOp - pSaidasOp) + (pEntradasInv - pSaidasInv) + (pEntradasFin - pSaidasFin) + (pEntradasNC - pSaidasNC) + (pEntradasTransf - pSaidasTransf) + (pEntradasDiff - pSaidasDiff);
      rows.geracaoCaixa.total[colIdx] = geracao;

      currentGlobalBalance += geracao;
      rows.saldoFinal.total[colIdx] = currentGlobalBalance;

      allBankIds.forEach(id => {
        rows.saldoFinal.items.get(id)![colIdx] = bankBalances.get(id) || 0;
      });
    });

    // Calculate Totals Column (Last Index)
    const totalIdx = periods.length;
    
    // Balances: Start = First Period Start; End = Last Period End
    rows.saldoInicial.total[totalIdx] = rows.saldoInicial.total[0];
    rows.saldoFinal.total[totalIdx] = rows.saldoFinal.total[totalIdx - 1];
    
    ['entradasOp', 'saidasOp', 'fluxoOp', 'entradasInv', 'saidasInv', 'fluxoInv', 'entradasFin', 'saidasFin', 'fluxoFin', 'entradasNC', 'saidasNC', 'fluxoNC', 'entradasTransf', 'saidasTransf', 'fluxoTransf', 'entradasTransfAudit', 'saidasTransfAudit', 'entradasDiff', 'saidasDiff', 'fluxoDiff', 'geracaoCaixa'].forEach(key => {
        const k = key as keyof typeof rows;
        if (rows[k].total) {
            rows[k].total[totalIdx] = rows[k].total.slice(0, totalIdx).reduce((a, b) => a + b, 0);
        }
    });

    // Handle Bank totals (Saldo Inicial/Final)
    allBankIds.forEach(id => {
        rows.saldoInicial.items.get(id)![totalIdx] = rows.saldoInicial.items.get(id)![0];
        rows.saldoFinal.items.get(id)![totalIdx] = rows.saldoFinal.items.get(id)![totalIdx - 1];
    });

    // Handle Account totals (Flows)
    ['entradasOp', 'saidasOp', 'entradasInv', 'saidasInv', 'entradasFin', 'saidasFin', 'entradasNC', 'saidasNC', 'entradasTransf', 'saidasTransf', 'entradasTransfAudit', 'saidasTransfAudit', 'entradasDiff', 'saidasDiff'].forEach(key => {
         const k = key as keyof typeof rows;
         const row = rows[k] as { total: number[], items: Map<string, number[]> };
         if (!row) return;
         Array.from(row.items.keys()).forEach(accountKey => {
             const arr = row.items.get(accountKey)!;
             arr[totalIdx] = arr.slice(0, totalIdx).reduce((a, b) => a + b, 0);
         });
    });

    // Prepare KPIs Data
    let currentKpiIdx = -1;
    let prevKpiIdx = -1;

    if (viewMode === 'monthly') {
        currentKpiIdx = MONTH_MAP[monthLabel];
        prevKpiIdx = currentKpiIdx > 0 ? currentKpiIdx - 1 : -1;
    } else {
        currentKpiIdx = periods.length - 1;
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
    const createDetailRows = (itemMap: Map<any, number[]>, parentId: string, isBankLine: boolean = false) => {
      return Array.from(itemMap.entries())
        .filter(([_, vals]) => vals.some(v => v !== 0))
        .map(([key, vals]) => {
          let name = '';
          if (isBankLine) {
            name = bankNames.get(key) || `Banco ${key}`;
          } else {
            const accountCode = key as string;
            if (accountCode.startsWith('DIF')) {
              const details = diffDetails.get(accountCode);
              if (details) {
                const dateStr = details.movdata ? format(new Date(details.movdata), 'dd/MM/yyyy') : '';
                name = `${details.movlanc || ''} - ${dateStr} - ${details.movobs || ''}`;
              } else {
                name = 'DIFERENÇA ENTRE CAIXA E TÍTULO';
              }
            } else if (accountCode === '0-NC') {
              name = 'LANÇAMENTO SEM CONTA (NÃO CLASSIFICADO)';
            } else {
              const desc = accountNames.get(accountCode) || 'Sem Descrição';
              name = `${accountCode} - ${desc}`;
            }
          }

          return {
            id: `${parentId}-detail-${key}`,
            name: name,
            values: vals,
            monthlyAH: calculateAH(vals),
            level: 2,
            tipo: 'CONTA'
          };
        });
    };

    const tableData = [
      {
        id: 'saldo-inicial',
        name: 'SALDO INICIAL',
        values: rows.saldoInicial.total,
        monthlyAH: calculateAH(rows.saldoInicial.total),
        subcategories: createDetailRows(rows.saldoInicial.items, 'saldo-inicial', true),
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
            subcategories: createDetailRows(rows.entradasOp.items, 'entradas-op'),
            level: 2,
            tipo: 'CONTA'
          },
          {
            id: 'saidas-op',
            name: '(-) Saídas Operacionais',
            values: rows.saidasOp.total.map(v => -v),
            monthlyAH: calculateAH(rows.saidasOp.total.map(v => -v)),
            subcategories: createDetailRows(rows.saidasOp.items, 'saidas-op').map(r => ({...r, values: r.values?.map(v => -v), monthlyAH: calculateAH(r.values?.map(v => -v) || [])})),
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
            subcategories: createDetailRows(rows.entradasInv.items, 'entradas-inv'),
            level: 2,
            tipo: 'CONTA'
          },
          {
            id: 'saidas-inv',
            name: '(-) Saídas de Investimento',
            values: rows.saidasInv.total.map(v => -v),
            monthlyAH: calculateAH(rows.saidasInv.total.map(v => -v)),
            subcategories: createDetailRows(rows.saidasInv.items, 'saidas-inv').map(r => ({...r, values: r.values?.map(v => -v), monthlyAH: calculateAH(r.values?.map(v => -v) || [])})),
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
            subcategories: createDetailRows(rows.entradasFin.items, 'entradas-fin'),
            level: 2,
            tipo: 'CONTA'
          },
          {
            id: 'saidas-fin',
            name: '(-) Saídas de Financiamento',
            values: rows.saidasFin.total.map(v => -v),
            monthlyAH: calculateAH(rows.saidasFin.total.map(v => -v)),
            subcategories: createDetailRows(rows.saidasFin.items, 'saidas-fin').map(r => ({...r, values: r.values?.map(v => -v), monthlyAH: calculateAH(r.values?.map(v => -v) || [])})),
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
        id: 'grp-transferencia',
        name: '(+/-) TRANSFERÊNCIAS',
        values: rows.fluxoTransf.total,
        monthlyAH: calculateAH(rows.fluxoTransf.total),
        level: 1,
        tipo: 'SUBTOTAL',
        subcategories: [
            {
                id: 'entradas-transf',
                name: '(+) Entradas de Transferência',
                values: rows.entradasTransf.total,
                monthlyAH: calculateAH(rows.entradasTransf.total),
                subcategories: createDetailRows(rows.entradasTransf.items, 'entradas-transf'),
                level: 2,
                tipo: 'CONTA'
            },
            {
                id: 'saidas-transf',
                name: '(-) Saídas de Transferência',
                values: rows.saidasTransf.total.map(v => -v),
                monthlyAH: calculateAH(rows.saidasTransf.total.map(v => -v)),
                subcategories: createDetailRows(rows.saidasTransf.items, 'saidas-transf').map(r => ({...r, values: r.values?.map(v => -v), monthlyAH: calculateAH(r.values?.map(v => -v) || [])})),
                level: 2,
                tipo: 'CONTA'
            }
        ]
      },
      {
        id: 'grp-nao-classificado',
        name: '(+/-) NÃO CLASSIFICADOS',
        values: rows.fluxoNC.total,
        monthlyAH: calculateAH(rows.fluxoNC.total),
        level: 1,
        tipo: 'SUBTOTAL',
        subcategories: [
            {
                id: 'entradas-nc',
                name: '(+) Entradas Não Classificadas',
                values: rows.entradasNC.total,
                monthlyAH: calculateAH(rows.entradasNC.total),
                subcategories: createDetailRows(rows.entradasNC.items, 'entradas-nc'),
                level: 2,
                tipo: 'CONTA'
            },
            {
                id: 'saidas-nc',
                name: '(-) Saídas Não Classificadas',
                values: rows.saidasNC.total.map(v => -v),
                monthlyAH: calculateAH(rows.saidasNC.total.map(v => -v)),
                subcategories: createDetailRows(rows.saidasNC.items, 'saidas-nc').map(r => ({...r, values: r.values?.map(v => -v), monthlyAH: calculateAH(r.values?.map(v => -v) || [])})),
                level: 2,
                tipo: 'CONTA'
            }
        ]
      },
      {
        id: 'saldo-final',
        name: 'SALDO FINAL',
        values: rows.saldoFinal.total,
        monthlyAH: calculateAH(rows.saldoFinal.total),
        subcategories: createDetailRows(rows.saldoFinal.items, 'saldo-final', true),
        level: 1,
        tipo: 'CONTA'
      }
    ];

    // Prepare Audit Table Data
    const splitByContip = (maps: Map<string, number[]>[], targetContip: string) => {
      const resultItems = new Map<string, number[]>();
      const resultTotal = initArray();
      
      maps.forEach(m => {
        m.forEach((vals, acc) => {
          if (accountContips.get(acc) === targetContip) {
            if (!resultItems.has(acc)) resultItems.set(acc, initArray());
            const targetArr = resultItems.get(acc)!;
            vals.forEach((v, i) => {
              targetArr[i] += v;
              resultTotal[i] += v;
            });
          }
        });
      });
      return { total: resultTotal, items: resultItems };
    };

    const entranceMaps = [rows.entradasOp.items, rows.entradasInv.items, rows.entradasFin.items];
    const auditTrad = splitByContip(entranceMaps, 'R');
    const auditExtras = splitByContip(entranceMaps, 'E');
    
    const auditEntradasDiffSub = createDetailRows(rows.entradasDiff.items, 'audit-entradas-diff');
    
    const auditEntradasDiffTotal = initArray();
    auditEntradasDiffSub.forEach(sub => {
      sub.values.forEach((v, i) => auditEntradasDiffTotal[i] += v);
    });

    const auditEntradasSub = [
      {
        id: 'audit-entradas-trad-r',
        name: '(+) Entradas Tradicionais (contip = R)',
        values: auditTrad.total,
        monthlyAH: calculateAH(auditTrad.total),
        level: 2,
        tipo: 'CONTA',
        subcategories: createDetailRows(auditTrad.items, 'audit-entradas-trad-r'),
      },
      {
        id: 'audit-entradas-extras-e',
        name: '(+) Entradas Extras (contip = E)',
        values: auditExtras.total,
        monthlyAH: calculateAH(auditExtras.total),
        level: 2,
        tipo: 'CONTA',
        subcategories: createDetailRows(auditExtras.items, 'audit-entradas-extras-e'),
      },
      {
        id: 'audit-entradas-transf',
        name: '(+) Entradas de Transferência',
        values: rows.entradasTransfAudit.total,
        monthlyAH: calculateAH(rows.entradasTransfAudit.total),
        subcategories: createDetailRows(rows.entradasTransfAudit.items, 'audit-entradas-transf'),
        level: 2,
        tipo: 'CONTA'
      },
      {
        id: 'audit-entradas-diff',
        name: '(+) Diferenças (Entradas)',
        values: auditEntradasDiffTotal,
        monthlyAH: calculateAH(auditEntradasDiffTotal),
        subcategories: auditEntradasDiffSub,
        level: 2,
        tipo: 'CONTA'
      }
    ];

    const totalEntradasVal = initArray();
    auditEntradasSub.forEach(s => s.values.forEach((v, i) => totalEntradasVal[i] += v));

    // Audit Saidas logic (using same "sum of children" logic)
    const exitMaps = [rows.saidasOp.items, rows.saidasInv.items, rows.saidasFin.items];
    const auditSaidasTradItems = new Map<string, number[]>();
    exitMaps.forEach(m => m.forEach((vals, acc) => {
        if (!auditSaidasTradItems.has(acc)) auditSaidasTradItems.set(acc, initArray());
        vals.forEach((v, i) => auditSaidasTradItems.get(acc)![i] += v);
    }));

    const auditSaidasSub = [
      {
        id: 'audit-saidas-trad',
        name: '(-) Saídas Tradicionais (Op/Inv/Fin)',
        values: rows.saidasOp.total.map((v, i) => -(v + rows.saidasInv.total[i] + rows.saidasFin.total[i])),
        monthlyAH: calculateAH(rows.saidasOp.total.map((v, i) => -(v + rows.saidasInv.total[i] + rows.saidasFin.total[i]))),
        level: 2,
        tipo: 'CONTA',
        subcategories: createDetailRows(auditSaidasTradItems, 'audit-saidas-trad').map(r => ({...r, values: r.values?.map(v => -v), monthlyAH: calculateAH(r.values?.map(v => -v) || [])})),
      },
      {
        id: 'audit-saidas-transf',
        name: '(-) Saídas de Transferência',
        values: rows.saidasTransfAudit.total.map(v => -v),
        monthlyAH: calculateAH(rows.saidasTransfAudit.total.map(v => -v)),
        subcategories: createDetailRows(rows.saidasTransfAudit.items, 'audit-saidas-transf').map(r => ({...r, values: r.values?.map(v => -v), monthlyAH: calculateAH(r.values?.map(v => -v) || [])})),
        level: 2,
        tipo: 'CONTA'
      },
      {
        id: 'audit-saidas-diff',
        name: '(-) Diferenças (Saídas)',
        values: rows.saidasDiff.total.map(v => -v),
        monthlyAH: calculateAH(rows.saidasDiff.total.map(v => -v)),
        subcategories: createDetailRows(rows.saidasDiff.items, 'audit-saidas-diff').map(r => ({...r, values: r.values?.map(v => -v), monthlyAH: calculateAH(r.values?.map(v => -v) || [])})),
        level: 2,
        tipo: 'CONTA'
      }
    ];

    const totalSaidasVal = initArray();
    auditSaidasSub.forEach(s => s.values.forEach((v, i) => totalSaidasVal[i] += v));

    const auditNetResult = initArray();
    totalEntradasVal.forEach((v, i) => auditNetResult[i] = v + totalSaidasVal[i]);

    const auditTableData = [
      {
        id: 'audit-entradas',
        name: 'TOTAL DE ENTRADAS',
        values: totalEntradasVal,
        monthlyAH: calculateAH(totalEntradasVal),
        level: 1,
        tipo: 'SUBTOTAL',
        subcategories: auditEntradasSub
      },
      {
        id: 'audit-saidas',
        name: 'TOTAL DE SAÍDAS',
        values: totalSaidasVal,
        monthlyAH: calculateAH(totalSaidasVal),
        level: 1,
        tipo: 'SUBTOTAL',
        subcategories: auditSaidasSub
      },
      {
        id: 'audit-resultado',
        name: 'GERAÇÃO LÍQUIDA (AUDITORIA)',
        values: auditNetResult,
        monthlyAH: calculateAH(auditNetResult),
        level: 1,
        tipo: 'TOTAL',
        subcategories: []
      }
    ];

    return { kpis, tableData, auditTableData, columns };
  }, [flows, initialBalances, loading, year, monthLabel, viewMode]);

  const auditDataRaw = processedData?.auditTableData || [];
  const auditColumnsRaw = processedData?.columns || [];
  
  const isAuditFiltered = viewMode === 'monthly' && auditMonthFilter !== 'all';
  const columnLabelsAudit = isAuditFiltered
    ? [MONTH_LABELS[parseInt(auditMonthFilter)], 'Total Anual']
    : auditColumnsRaw;

  // recursive deep clone function to slice exactly the values
  const filterAuditData = (data: any[]): any[] => {
    if (!isAuditFiltered) return data;
    const colIdx = parseInt(auditMonthFilter);
    const totalIdx = 12; // In monthly mode, total is always index 12
    return data.map(item => ({
      ...item,
      values: item.values ? [item.values[colIdx], item.values[totalIdx]] : undefined,
      monthlyAH: item.monthlyAH ? [item.monthlyAH[colIdx], item.monthlyAH[totalIdx]] : undefined,
      subcategories: item.subcategories ? filterAuditData(item.subcategories) : undefined
    }));
  };
  
  const filteredAuditData = filterAuditData(auditDataRaw);

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

          {/* Audit Table */}
          <section className="bg-white border border-black/[0.03] rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden flex flex-col max-w-full">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-black tracking-tight text-rodovia-azul uppercase flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" />
                  Resumo de <span className="text-amber-500 italic">Auditoria de Entradas e Saídas</span>
                </h2>
                <div className="flex items-center gap-4">
                  <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest pl-7">
                    Visão de Conferência Bruta (Entradas vs Saídas)
                  </p>
                  {viewMode === 'monthly' && (
                    <select
                      value={auditMonthFilter}
                      onChange={(e) => setAuditMonthFilter(e.target.value)}
                      className="text-xs border border-zinc-200 rounded-md text-zinc-600 bg-white px-2 py-1 outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer font-bold"
                    >
                      <option value="all">Ano Completo</option>
                      {MONTH_LABELS.map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className={cn(
              "w-full overflow-auto max-h-[850px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200/50 hover:scrollbar-thumb-zinc-300",
              "max-w-[calc(100vw-2.5rem)]"
            )}>
              <div className={cn("pb-4", viewMode === 'monthly' ? (auditMonthFilter === 'all' ? "min-w-[3440px]" : "min-w-[800px]") : "min-w-[4000px]")}>
                <DRERow 
                  id="header-audit"
                  name="CONFERÊNCIA BRUTA" 
                  labels={columnLabelsAudit}
                  isHeader={true} 
                  timePerspective={isAuditFiltered ? 'multi-year' : (viewMode === 'monthly' ? 'year' : 'multi-year')}
                  showAV={false}
                />
                
                {filteredAuditData.map((row: any) => {
                  const isExpanded = expandedRows.has(row.id);
                  const hasChildren = row.subcategories && row.subcategories.length > 0;

                  return (
                    <React.Fragment key={row.id}>
                        <DRERow
                            {...row}
                            timePerspective={isAuditFiltered ? 'multi-year' : (viewMode === 'monthly' ? 'year' : 'multi-year')}
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
                                        timePerspective={isAuditFiltered ? 'multi-year' : (viewMode === 'monthly' ? 'year' : 'multi-year')}
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
                                            timePerspective={isAuditFiltered ? 'multi-year' : (viewMode === 'monthly' ? 'year' : 'multi-year')}
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
