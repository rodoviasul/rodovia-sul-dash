import React, { useMemo } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Activity, 
  Wallet, 
  Loader2,
  TrendingUp,
  LayoutDashboard,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useDREQuery } from "@/hooks/useDREQuery";
import { ModernKPICard } from "@/components/dashboard/ModernKPICard";
import { RevenueEvolutionChart } from "@/components/dashboard/RevenueEvolutionChart";
import { ExpensesEvolutionChart } from "@/components/dashboard/ExpensesEvolutionChart";
import { Badge } from "@/components/ui/badge";
import { useFilter } from "@/contexts/FilterContext";
import { cn } from "@/lib/utils";

const MONTH_MAP: Record<string, number> = {
  "Jan": 0, "Fev": 1, "Mar": 2, "Abr": 3, "Mai": 4, "Jun": 5,
  "Jul": 6, "Ago": 7, "Set": 8, "Out": 9, "Nov": 10, "Dez": 11
};

const DashboardLoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl">
      <div className="relative">
        {/* Outer Pulsing Ring */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 -m-8 rounded-full bg-emerald-500/20 blur-2xl"
        />
        
        {/* Main Logo Container */}
        <div className="relative bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-black/[0.03] flex flex-col items-center gap-6">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border-2 border-dashed border-emerald-500/30 rounded-full"
            />
            <div className="w-16 h-16 bg-rodovia-azul rounded-2xl flex items-center justify-center shadow-lg shadow-rodovia-azul/20">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <h2 className="text-lg font-black tracking-tighter text-rodovia-azul uppercase">
              Gerando <span className="text-emerald-500 italic">Insights</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  backgroundColor: ["#10b981", "#3b82f6", "#10b981"]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
              />
              <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest">
                Processando Visão Estratégica
              </span>
            </div>
          </div>
        </div>

        {/* Floating Accents */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -20, 0],
              x: [0, i % 2 === 0 ? 10 : -10, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 3 + i, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: i * 0.5
            }}
            className={cn(
              "absolute w-2 h-2 rounded-full",
              i === 0 ? "top-0 -left-12 bg-emerald-500" : 
              i === 1 ? "bottom-12 -right-16 bg-rodovia-azul" : 
              "top-12 -right-12 bg-emerald-500"
            )}
          />
        ))}
      </div>

      {/* Footer Text */}
      <div className="mt-12 flex flex-col items-center gap-2">
        <span className="text-[9px] font-mono font-black text-zinc-300 uppercase tracking-[0.4em]">
          Rodovia Sul Logística
        </span>
      </div>
    </div>
  );
};

export default function MasterDashboard() {
  const { period: year, month: monthLabel } = useFilter();

  // Define date range: Last 12 months ENDING in the selected period
  const dateRange = useMemo(() => {
    // 1. Get selected date (Month + Year from filters)
    const monthIndex = MONTH_MAP[monthLabel] ?? new Date().getMonth();
    const selectedDate = new Date(parseInt(year), monthIndex, 1);
    
    // 2. Calculate range: 12 months back from the END of the selected month
    const end = endOfMonth(selectedDate);
    const start = startOfMonth(subMonths(selectedDate, 11)); // Current + 11 previous = 12 months

    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    };
  }, [year, monthLabel]);

  const { data, loading, error } = useDREQuery(dateRange.start, dateRange.end);

  // Process data for Chart and KPIs
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], kpis: null };

    // Sort by period just in case
    const sortedData = [...data].sort((a, b) => a.periodo.localeCompare(b.periodo));

    // Calculate Average Revenue for the period
    const totalRevenue = sortedData.reduce((acc, curr) => acc + (curr.receita_bruta || 0), 0);
    const averageRevenue = totalRevenue / sortedData.length;

    // Chart Data with Average Line
    const chartData = sortedData.map(item => ({
      ...item,
      media: averageRevenue
    }));

    // KPI Data (Latest Month vs Previous Month)
    // The "Latest" month is the selected month (last in the array)
    const currentMonth = sortedData[sortedData.length - 1];
    const previousMonth = sortedData.length > 1 ? sortedData[sortedData.length - 2] : null;

    // Helper to get safe values
    const getVal = (item: any, key: string) => item ? (item[key] || 0) : 0;

    // AV Calculation helper (metric / revenue * 100)
    const getAV = (item: any, key: string) => {
      const revenue = getVal(item, 'receita_bruta');
      const val = getVal(item, key);
      return revenue !== 0 ? (val / revenue) * 100 : 0;
    };

    const kpis = {
      receita_bruta: {
        current: getVal(currentMonth, 'receita_bruta'),
        previous: getVal(previousMonth, 'receita_bruta'),
        av: 100 // Always 100%
      },
      margem_bruta: {
        current: getVal(currentMonth, 'margem_bruta'),
        previous: getVal(previousMonth, 'margem_bruta'),
        av: getAV(currentMonth, 'margem_bruta')
      },
      margem_contribuicao: {
        current: getVal(currentMonth, 'margem_contribuicao'),
        previous: getVal(previousMonth, 'margem_contribuicao'),
        av: getAV(currentMonth, 'margem_contribuicao')
      },
      ebitda: {
        current: getVal(currentMonth, 'ebitda'),
        previous: getVal(previousMonth, 'ebitda'),
        av: getAV(currentMonth, 'ebitda')
      },
      resultado_liquido: {
        current: getVal(currentMonth, 'resultado_liquido'),
        previous: getVal(previousMonth, 'resultado_liquido'),
        av: getAV(currentMonth, 'resultado_liquido')
      }
    };

    return { chartData, kpis };
  }, [data]);

  if (loading) {
    return <DashboardLoadingScreen />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-bold">Erro ao carregar dados: {error}</p>
      </div>
    );
  }

  const { chartData, kpis } = processedData;

  // Se não houver dados, mostra mensagem amigável ou estado vazio
  if (!kpis) {
     return (
       <div className="p-20 text-center flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-zinc-300" />
          <p className="text-zinc-500 font-medium">Nenhum dado encontrado para o período selecionado.</p>
       </div>
     )
  }

  return (
    <div className="space-y-3 pb-20 p-4 md:p-6 max-w-[1920px] mx-auto">
      <AnimatePresence>
        {loading && <DashboardLoadingScreen />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-rodovia-azul uppercase flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
            Visão <span className="text-emerald-500 italic">Estratégica</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 font-bold uppercase tracking-widest mt-1 pl-1">
            Painel Executivo • Referência: <span className="text-rodovia-azul">{monthLabel}/{year}</span>
          </p>
        </div>
      </div>

      {/* KPI Cards Grid - Adjusted gap to match DRE */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
        <ModernKPICard
          label="Receita Bruta"
          value={kpis.receita_bruta.current}
          previousValue={kpis.receita_bruta.previous}
          av={100}
          icon={DollarSign}
          storytelling="Volume total de vendas e serviços realizados."
          calculationDetail="Soma total das receitas antes de deduções."
          avDetail="Base 100% para análise vertical."
        />
        <ModernKPICard
          label="Margem Bruta"
          value={kpis.margem_bruta.current}
          previousValue={kpis.margem_bruta.previous}
          av={kpis.margem_bruta.av}
          icon={PieChart}
          storytelling="Eficiência direta da operação após custos."
          calculationDetail="Receita Líquida - Custos Diretos (Fixos e Variáveis)."
          avDetail="Quanto sobra da receita para cobrir despesas e gerar lucro."
        />
        <ModernKPICard
          label="Marg. Contribuição"
          value={kpis.margem_contribuicao.current}
          previousValue={kpis.margem_contribuicao.previous}
          av={kpis.margem_contribuicao.av}
          icon={TrendingUp}
          storytelling="Capacidade de cobrir custos fixos e gerar lucro."
          calculationDetail="Margem Bruta - Despesas Variáveis."
          avDetail="Indicador vital de saúde financeira operacional."
        />
        <ModernKPICard
          label="EBITDA"
          value={kpis.ebitda.current}
          previousValue={kpis.ebitda.previous}
          av={kpis.ebitda.av}
          icon={Activity}
          storytelling="Geração de caixa operacional pura."
          calculationDetail="Lucro antes de juros, impostos, depreciação e amortização."
          avDetail="Potencial de geração de caixa do negócio principal."
        />
        <ModernKPICard
          label="Resultado Líquido"
          value={kpis.resultado_liquido.current}
          previousValue={kpis.resultado_liquido.previous}
          av={kpis.resultado_liquido.av}
          icon={Wallet}
          highlight={true}
          storytelling="O que efetivamente sobra no caixa da empresa."
          calculationDetail="Resultado final após todas as receitas e despesas."
          avDetail="Lucratividade real do período."
        />
      </section>

      {/* Revenue Evolution Chart - Adjusted margin top */}
      <section className="grid grid-cols-1 gap-3 mt-3">
        <RevenueEvolutionChart data={chartData} />
        <ExpensesEvolutionChart data={chartData} />
      </section>
    </div>
  );
}
