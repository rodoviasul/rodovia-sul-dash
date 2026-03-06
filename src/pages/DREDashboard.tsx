import React, { useState, useMemo, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Info, Filter, FileText, Download, Share2, MoreHorizontal, Loader2, AlertCircle, CalendarRange } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AssessorSheet from "@/components/dashboard/AssessorSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSearchParams } from "react-router-dom";
import { useContas } from "@/hooks/useContas";
import { useDominios } from "@/hooks/useDominios";
import { executeQuery } from "@/services/api";
import { cn } from "@/lib/utils";
import { startOfMonth, endOfMonth, format } from "date-fns";

const MONTH_MAP: Record<string, number> = {
  "Jan": 0, "Fev": 1, "Mar": 2, "Abr": 3, "Mai": 4, "Jun": 5,
  "Jul": 6, "Ago": 7, "Set": 8, "Out": 9, "Nov": 10, "Dez": 11
};

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const DRERow = ({ 
  code, 
  name, 
  current, 
  previous, 
  variation, 
  monthsValues,
  level = 1,
  isHeader = false,
  isTotal = false,
  isAnnual = false,
  className,
  onClick
}: { 
  code: string; 
  name: string; 
  current: string | number; 
  previous: string | number; 
  variation: number;
  monthsValues?: number[];
  level?: number;
  isHeader?: boolean;
  isTotal?: boolean;
  isAnnual?: boolean;
  className?: string;
  onClick?: () => void;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "grid py-3 px-4 border-b border-border transition-all duration-200",
      isAnnual ? "grid-cols-[100px_minmax(200px,1fr)_repeat(12,100px)]" : "grid-cols-12",
      isHeader ? 'bg-slate-900 font-mono text-[10px] uppercase tracking-widest text-white sticky top-0 z-10' : 'hover:bg-accent cursor-pointer group',
      isTotal ? 'bg-muted/30 font-bold' : '',
      level === 1 && !isHeader ? 'font-serif text-lg font-bold text-foreground' : 'font-sans text-sm text-muted-foreground',
      className
    )}
    onClick={onClick}
  >
    <div className={cn(
      "font-mono text-[10px] flex items-center transition-colors",
      isAnnual ? "" : "col-span-2",
      isHeader ? "text-white" : "text-muted-foreground group-hover:text-foreground",
      level > 1 ? 'pl-4' : ''
    )}>
      {code}
    </div>
    <div className={cn(
      "flex items-center transition-colors",
      isAnnual ? "" : "col-span-4",
      isHeader ? "text-white" : "group-hover:text-foreground",
      level === 2 ? 'pl-6' : level === 3 ? 'pl-10' : ''
    )}>
      {name}
      {isTotal && <Badge variant="outline" className="ml-2 text-[8px] h-4 border-border text-muted-foreground uppercase">Consolidado</Badge>}
    </div>
    
    {!isAnnual ? (
      <>
        <div className={cn(
          "col-span-2 text-right font-mono flex items-center justify-end",
          isHeader ? "text-white" : "text-foreground"
        )}>
          {typeof current === 'number' ? current.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : current}
        </div>
        <div className={cn(
          "col-span-2 text-right font-mono flex items-center justify-end",
          isHeader ? "text-white" : "text-muted-foreground"
        )}>
          {typeof previous === 'number' ? previous.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : previous}
        </div>
        <div className={cn(
          "col-span-2 text-right font-mono flex items-center justify-end gap-1 font-bold",
          isHeader ? "text-white" : (variation > 0 ? 'text-rodovia-verde' : variation < 0 ? 'text-destructive' : 'text-muted-foreground')
        )}>
          {!isHeader && variation !== 0 && (variation > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
          {!isHeader && (variation !== 0 ? `${Math.abs(variation).toFixed(1)}%` : "-")}
          {isHeader && "VAR %"}
        </div>
      </>
    ) : (
      <>
        {MONTH_LABELS.map((m, i) => (
          <div key={m} className={cn(
            "text-right font-mono flex items-center justify-end text-[10px]",
            isHeader ? "text-white font-black" : "text-foreground"
          )}>
            {isHeader ? m : monthsValues?.[i]?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) || "R$ 0"}
          </div>
        ))}
      </>
    )}
  </motion.div>
);

export default function DREDashboard() {
  const [searchParams] = useSearchParams();
  const { contas, loading: loadingContas } = useContas();
  const { categoriasDRE, subcategoriasDRE, loading: loadingDominios } = useDominios();
  
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isAnnualView, setIsAnnualView] = useState(false);

  const year = searchParams.get("period") || "2026";
  const monthLabel = searchParams.get("month") || "Jan";
  
  const currentRange = useMemo(() => {
    const monthIndex = MONTH_MAP[monthLabel];
    const date = new Date(parseInt(year), monthIndex, 1);
    return {
      start: format(startOfMonth(date), 'yyyy-MM-dd'),
      end: format(endOfMonth(date), 'yyyy-MM-dd')
    };
  }, [year, monthLabel]);

  const previousRange = useMemo(() => {
    const monthIndex = MONTH_MAP[monthLabel];
    const date = new Date(parseInt(year), monthIndex - 1, 1);
    return {
      start: format(startOfMonth(date), 'yyyy-MM-dd'),
      end: format(endOfMonth(date), 'yyyy-MM-dd')
    };
  }, [year, monthLabel]);

  const annualRange = useMemo(() => {
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`
    };
  }, [year]);

  useEffect(() => {
    const fetchMovimentos = async () => {
      setLoadingMov(true);
      setError(null);
      
      let query = "";
      
      if (isAnnualView) {
        query = `
          with unified_movs as (
              select reclan as lan, recconta as conta, recvalor as valor from tabreceb
              union all
              select deslan as lan, desconta as conta, desvalor as valor from tabdespesas
          )
          select
              u.conta as concod,
              month(m.movdatacxa) as mes,
              round(sum(u.valor), 2) as valor
          from tabmovimento as m
          inner join unified_movs u on m.movlanc = u.lan
          where m.movdatacxa between '${annualRange.start}' and '${annualRange.end}'
          group by u.conta, month(m.movdatacxa)
        `;
      } else {
        query = `
          with unified_movs as (
              select reclan as lan, recconta as conta, recvalor as valor from tabreceb
              union all
              select deslan as lan, desconta as conta, desvalor as valor from tabdespesas
          )
          select
              u.conta as concod,
              round(sum(case when m.movdatacxa between '${currentRange.start}' and '${currentRange.end}' then u.valor else 0 end), 2) as valor_atual,
              round(sum(case when m.movdatacxa between '${previousRange.start}' and '${previousRange.end}' then u.valor else 0 end), 2) as valor_anterior
          from tabmovimento as m
          inner join unified_movs u on m.movlanc = u.lan
          where (m.movdatacxa between '${currentRange.start}' and '${currentRange.end}' or m.movdatacxa between '${previousRange.start}' and '${previousRange.end}')
          group by u.conta
        `;
      }

      try {
        const { data } = await executeQuery(query);
        setMovimentos(data);
      } catch (err: any) {
        console.error("Erro ao buscar movimentos para DRE:", err);
        setError("Erro ao carregar dados da API.");
      } finally {
        setLoadingMov(false);
      }
    };

    fetchMovimentos();
  }, [currentRange, previousRange, annualRange, isAnnualView]);

  // Lógica de Consolidação
  const dreData = useMemo(() => {
    if (loadingContas || loadingDominios) return [];

    const configMap = new Map(contas.map(c => [c.concod, c]));
    const result: any[] = [];

    if (isAnnualView) {
      // Processamento Anual
      const subcatMonthlyValues = new Map<string, number[]>();

      movimentos.forEach(mov => {
        const config = configMap.get(mov.concod);
        const subcatId = config?.dre_subcategoria_id || 'nao_definido';
        const sinal = config?.dre_sinal ?? 1;
        const mesIdx = (mov.mes || 1) - 1; // DuckDB month é 1-12
        const valor = (mov.valor || 0) * sinal;

        if (!subcatMonthlyValues.has(subcatId)) {
          subcatMonthlyValues.set(subcatId, new Array(12).fill(0));
        }
        const vals = subcatMonthlyValues.get(subcatId)!;
        vals[mesIdx] += valor;
      });

      categoriasDRE.forEach(cat => {
        const subcats = subcategoriasDRE.filter(s => s.categoria_id === cat.id);
        const catMonthly = new Array(12).fill(0);

        const subcatRows = subcats.map(sub => {
          const mValues = subcatMonthlyValues.get(sub.id) || new Array(12).fill(0);
          mValues.forEach((v, i) => catMonthly[i] += v);
          
          return {
            id: sub.id,
            name: sub.nome,
            monthsValues: mValues,
            level: 2
          };
        });

        result.push({
          id: cat.id,
          name: cat.nome,
          monthsValues: catMonthly,
          level: 1,
          subcategories: subcatRows
        });
      });
    } else {
      // Processamento Mensal (Original)
      const currentSubcatValues = new Map<string, number>();
      const previousSubcatValues = new Map<string, number>();

      movimentos.forEach(mov => {
        const config = configMap.get(mov.concod);
        const subcatId = config?.dre_subcategoria_id || 'nao_definido';
        const sinal = config?.dre_sinal ?? 1;
        
        const valorAtual = (mov.valor_atual || 0) * sinal;
        const valorAnterior = (mov.valor_anterior || 0) * sinal;
        
        currentSubcatValues.set(subcatId, (currentSubcatValues.get(subcatId) || 0) + valorAtual);
        previousSubcatValues.set(subcatId, (previousSubcatValues.get(subcatId) || 0) + valorAnterior);
      });

      categoriasDRE.forEach(cat => {
        const subcats = subcategoriasDRE.filter(s => s.categoria_id === cat.id);
        let catCurrent = 0;
        let catPrevious = 0;

        const subcatRows = subcats.map(sub => {
          const curr = currentSubcatValues.get(sub.id) || 0;
          const prev = previousSubcatValues.get(sub.id) || 0;
          catCurrent += curr;
          catPrevious += prev;
          const variation = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;

          return {
            id: sub.id,
            name: sub.nome,
            current: curr,
            previous: prev,
            variation: variation,
            level: 2
          };
        });

        const catVariation = catPrevious !== 0 ? ((catCurrent - catPrevious) / Math.abs(catPrevious)) * 100 : 0;

        result.push({
          id: cat.id,
          name: cat.nome,
          current: catCurrent,
          previous: catPrevious,
          variation: catVariation,
          level: 1,
          subcategories: subcatRows
        });
      });
    }

    return result;
  }, [categoriasDRE, subcategoriasDRE, contas, movimentos, loadingContas, loadingDominios, isAnnualView]);

  const handleRowClick = (name: string, value: number, variation: number, code: string) => {
    setSelectedItem({
      title: name,
      value: value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      change: variation,
      description: `Análise detalhada da conta ${code} - ${name} referente ao período de ${monthLabel}/${year}.`,
      details: [
        { label: "Realizado", value: value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), trend: value >= 0 ? "up" : "down" as const },
      ]
    });
  };

  const isLoading = loadingContas || loadingDominios || loadingMov;

  return (
    <div className="space-y-8 pb-20">
      <AssessorSheet 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        data={selectedItem} 
      />

      {/* Editorial Header */}
      <section className="flex justify-between items-end border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-rodovia-verde/50 text-rodovia-verde font-mono text-[10px] uppercase px-2 py-0">
              Gerencial
            </Badge>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{monthLabel} {year}</span>
          </div>
          <h1 className="text-5xl font-serif font-bold tracking-tight text-foreground">DRE <span className="text-rodovia-verde italic">Gerencial</span></h1>
          <p className="text-muted-foreground font-sans max-w-2xl">
            Demonstração de Resultados consolidada. 
            Cruce de dados entre o ERP (Arquivos Parquet) e mapeamento estratégico do Supabase.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isAnnualView ? "default" : "outline"} 
            size="sm"
            onClick={() => setIsAnnualView(!isAnnualView)}
            className={cn(
              "h-9 font-mono text-[10px] uppercase tracking-widest transition-all",
              isAnnualView ? "bg-rodovia-verde hover:bg-rodovia-verde/90" : "border-border bg-card hover:bg-accent"
            )}
          >
            <CalendarRange className="w-4 h-4 mr-2" />
            {isAnnualView ? "Visão Mensal" : "Visão Anual"}
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="border-border bg-card hover:bg-accent shadow-sm">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Compartilhar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" className="border-border bg-card text-xs font-mono uppercase hover:bg-accent shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
      </section>

      {/* KPI Headline Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
          ))
        ) : (
          [
            { label: "Resultado Líquido", value: dreData.reduce((acc, cat) => acc + cat.current, 0), highlight: true },
            { label: "Receita Bruta", value: dreData.find(c => c.name.includes('Receita'))?.current || 0 },
            { label: "Total Despesas", value: dreData.filter(c => c.name.includes('Despesa')).reduce((acc, c) => acc + c.current, 0) },
            { label: "Contas Pendentes", value: movimentos.filter(m => !contas.find(c => c.concod === m.concod)?.dre_subcategoria_id).length, isCount: true },
          ].map((kpi, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-6 rounded-2xl border transition-all duration-300 backdrop-blur-sm",
                "bg-card/60 border-border hover:border-rodovia-verde/30 shadow-sm hover:shadow-md",
                kpi.highlight && "border-rodovia-verde/50 shadow-[0_0_20px_rgba(36,172,132,0.15)]"
              )}
            >
              <span className="font-mono text-[10px] uppercase text-muted-foreground">{kpi.label}</span>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className={cn(
                  "text-2xl font-mono font-bold tracking-tighter",
                  kpi.highlight ? "text-rodovia-verde" : "text-foreground"
                )}>
                  {kpi.isCount ? kpi.value : kpi.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </h3>
              </div>
            </motion.div>
          ))
        )}
      </section>

      {/* Main DRE Table */}
      <section className={cn(
        "bg-card border border-border rounded-2xl shadow-sm backdrop-blur-sm relative",
        isAnnualView ? "overflow-x-auto" : "overflow-hidden"
      )}>
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-rodovia-verde" />
            <span className="text-xs font-mono font-bold text-rodovia-verde animate-pulse uppercase tracking-widest">Processando Join em Memória...</span>
          </div>
        )}

        {error ? (
          <div className="p-20 flex flex-col items-center justify-center text-center gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h3 className="text-lg font-bold">Falha na Sincronização</h3>
            <p className="text-muted-foreground max-w-sm">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </div>
        ) : (
          <div className={cn(isAnnualView && "min-w-[1500px]")}>
            <DRERow 
              code="CÓDIGO" 
              name="CONTA ESTRATÉGICA" 
              current={`${monthLabel}/${year.slice(-2)} (R$)`} 
              previous="ANTERIOR (R$)" 
              variation={0} 
              isHeader={true} 
              isAnnual={isAnnualView}
            />
            
            <div className="max-h-[800px] overflow-y-auto scrollbar-none">
              {dreData.length === 0 && !isLoading ? (
                <div className="p-20 text-center text-muted-foreground italic">Nenhum dado encontrado para este período.</div>
              ) : (
                dreData.map((cat, idx) => (
                  <React.Fragment key={cat.id}>
                    <DRERow 
                      code={(idx + 1).toString().padStart(2, '0')} 
                      name={cat.name} 
                      current={cat.current} 
                      previous={cat.previous} 
                      variation={cat.variation} 
                      monthsValues={cat.monthsValues}
                      isAnnual={isAnnualView}
                      onClick={() => handleRowClick(cat.name, isAnnualView ? (cat.monthsValues?.reduce((a:number, b:number)=>a+b, 0) || 0) : cat.current, cat.variation || 0, (idx + 1).toString())}
                    />
                    {cat.subcategories.map((sub: any, sIdx: number) => (
                      <DRERow 
                        key={sub.id}
                        code={`${idx + 1}.${(sIdx + 1).toString().padStart(2, '0')}`} 
                        name={sub.name} 
                        current={sub.current} 
                        previous={sub.previous} 
                        variation={sub.variation} 
                        monthsValues={sub.monthsValues}
                        isAnnual={isAnnualView}
                        level={2}
                        onClick={() => handleRowClick(sub.name, isAnnualView ? (sub.monthsValues?.reduce((a:number, b:number)=>a+b, 0) || 0) : sub.current, sub.variation || 0, `${idx + 1}.${sIdx + 1}`)}
                      />
                    ))}
                  </React.Fragment>
                ))
              )}
            </div>

            {/* Totalizador Final */}
            {!isLoading && dreData.length > 0 && (
              <div className="bg-slate-900 p-1">
                <DRERow 
                  code="=" 
                  name="RESULTADO LÍQUIDO DO PERÍODO" 
                  current={isAnnualView ? 0 : dreData.reduce((acc, c) => acc + c.current, 0)} 
                  previous={0} 
                  variation={0} 
                  monthsValues={isAnnualView ? MONTH_LABELS.map((_, i) => dreData.reduce((acc, cat) => acc + cat.monthsValues[i], 0)) : undefined}
                  isHeader={false}
                  isTotal={true}
                  isAnnual={isAnnualView}
                  className="text-white border-none"
                />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}


