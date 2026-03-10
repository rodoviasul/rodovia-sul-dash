import React, { useState, useMemo, useEffect } from "react";
import { 
  FileText, 
  Download, 
  AlertCircle, 
  CalendarRange,
  CalendarDays,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Layers,
  HelpCircle,
  RotateCcw,
  Calculator,
  ArrowRightLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSearchParams } from "react-router-dom";
import { useContas } from "@/hooks/useContas";
import { useDominios, CategoriaDRE } from "@/hooks/useDominios";
import { executeQuery } from "@/services/api";
import { cn } from "@/lib/utils";
import { startOfMonth, endOfMonth, format, addMonths, subMonths, startOfYear, endOfYear, getYear, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";

const MONTH_MAP: Record<string, number> = {
  "Jan": 0, "Fev": 1, "Mar": 2, "Abr": 3, "Mai": 4, "Jun": 5,
  "Jul": 6, "Ago": 7, "Set": 8, "Out": 9, "Nov": 10, "Dez": 11
};

const MONTH_LABELS_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const TRIMESTRE_LABELS = ["1º Tri", "2º Tri", "3º Tri", "4º Tri"];
const BIMESTRE_LABELS = ["1º Bim", "2º Bim", "3º Bim", "4º Bim", "5º Bim", "6º Bim"];
const SEMESTRE_LABELS = ["1º Semestre", "2º Semestre"];
const YEARS = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];

import { DREDetailModal } from "@/components/dashboard/DREDetailModal";
import { DRERow, TimePerspective } from "@/components/dashboard/DRERow";

const KPIIcon = ({ icon: Icon, variant = 'info' }: { icon: any, variant?: 'success' | 'danger' | 'info' }) => {
  const themes = {
    success: {
      glow: "bg-emerald-500/40",
      icon: "text-emerald-500"
    },
    danger: {
      glow: "bg-red-500/40",
      icon: "text-red-500"
    },
    info: {
      glow: "bg-blue-500/40",
      icon: "text-blue-500"
    }
  };

  const theme = themes[variant];

  return (
    <div className="absolute -bottom-8 -right-8 w-48 h-48 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-20">
      {/* 1. Camada de brilho (blur) ampliada */}
      <div className={cn(
        "absolute inset-0 rounded-full blur-[80px]",
        theme.glow
      )} />
      
      {/* 2. Ícone gigante vazado */}
      <Icon className={cn("w-32 h-32 relative z-10 opacity-40 rotate-12", theme.icon)} />
    </div>
  );
};

const KPICard = ({ 
  label, 
  value, 
  previousValue, 
  av, 
  icon: Icon, 
  highlight = false,
  storytelling,
  calculationDetail,
  avDetail,
  isComparisonMode,
  p1Label,
  p2Label
}: { 
  label: string; 
  value: number; 
  previousValue: number;
  av: number; 
  icon: any; 
  highlight?: boolean;
  storytelling: string;
  calculationDetail: string;
  avDetail: string;
  isComparisonMode?: boolean;
  p1Label?: string;
  p2Label?: string;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const variation = previousValue !== 0 ? ((value - previousValue) / Math.abs(previousValue)) * 100 : 0;
  const isPositive = variation >= 0;
  const isNegative = value < 0;

  // Define a variante de cor para o ícone
  const variant = isNegative ? 'danger' : (highlight ? 'success' : 'info');

  return (
    <div className="relative h-[180px] lg:h-[200px] xl:h-[220px] w-full [perspective:1000px]">
      <motion.div
        className="w-full h-full relative [transform-style:preserve-3d] cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Side */}
        <div 
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] p-3 rounded-xl border flex flex-col h-full overflow-hidden",
            "bg-white border-black/[0.03] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)]",
            highlight && !isNegative && "ring-2 ring-rodovia-verde/20 border-rodovia-verde/10",
            isNegative && "ring-2 ring-red-500/10 border-red-500/20 shadow-red-500/5"
          )}
        >
          {/* Background Ghosted Icon */}
          <KPIIcon icon={Icon} variant={variant} />

          {/* Header Fixo com Título e Linha Divisória */}
          <div className="w-full flex flex-col items-center relative z-10 mb-2 pt-1">
            <div className="h-[32px] flex items-center justify-center w-full px-2">
              <span className={cn(
                "block font-mono text-[9px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.25em] transition-colors leading-tight text-center line-clamp-2",
                isNegative ? "text-red-600" : "text-zinc-800 group-hover:text-rodovia-azul"
              )}>
                {label}
              </span>
            </div>
            
            {/* Linha Divisória Sutil */}
            <div className="w-12 h-px bg-zinc-200 mt-2" />

            {/* Oculta storytelling no modo comparação para dar espaço */}
            {!isComparisonMode && (
              <p className="mt-2 text-[8px] sm:text-[10px] text-zinc-500 font-bold italic leading-tight max-w-[140px] sm:max-w-[200px] mx-auto opacity-80 line-clamp-2 text-center h-[24px]">
                {storytelling}
              </p>
            )}
          </div>



          {/* Main Content Area */}
          <div className="flex-1 flex flex-col justify-center relative z-10 w-full">
            {isComparisonMode ? (
              // Layout de Comparação Vertical Limpo
              <div className="flex flex-col gap-2 py-1">
                {/* Bloco Atual (Hero) */}
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase tracking-[0.1em] text-zinc-400 mb-0.5 max-w-[180px] truncate">
                    {p1Label || "REF. 01"}
                  </span>
                  <span className={cn(
                    "text-lg sm:text-xl font-mono font-black tracking-tighter leading-none",
                    isNegative ? "text-red-600" : (highlight ? "text-rodovia-verde" : "text-rodovia-azul")
                  )}>
                    {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </span>
                </div>

                {/* Badge de Variação Centralizado */}
                <div className="flex justify-center -my-1.5 relative z-10">
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full shadow-sm border border-white/50 backdrop-blur-sm",
                    isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  )}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span className="text-[9px] font-black">{Math.abs(variation).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Bloco Anterior (Secundário) */}
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-xs sm:text-sm font-mono font-bold tracking-tighter leading-none text-zinc-600 line-through decoration-zinc-400/50"
                  )}>
                    {previousValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-[0.1em] text-zinc-500 mt-0.5 max-w-[180px] truncate">
                    {p2Label || "BASE 02"}
                  </span>
                </div>
              </div>
            ) : (
              // Layout Padrão (Valor Único)
              <div className="flex flex-col items-center w-full">
                <h3 className={cn(
                  "text-[14px] sm:text-[16px] lg:text-[18px] xl:text-[20px] font-mono font-black tracking-tighter leading-none mb-2 whitespace-nowrap",
                  isNegative ? "text-red-600" : (highlight ? "text-rodovia-verde" : "text-rodovia-azul")
                )}>
                  {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </h3>
                
                <div className="w-full space-y-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[8px] sm:text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest truncate mr-1">% S/ REC. BRUTA</span>
                    <span className={cn("text-[9px] sm:text-[11px] font-mono font-black", isNegative ? "text-red-600" : "text-zinc-900")}>{av.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 sm:h-2.5 w-full bg-zinc-200 rounded-full overflow-hidden border border-black/5">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out", 
                        isNegative ? "bg-red-500 shadow-red-500/20" : (highlight ? "bg-rodovia-verde shadow-rodovia-verde/20" : "bg-rodovia-azul shadow-rodovia-azul/20")
                      )}
                      style={{ width: `${Math.min(Math.abs(av), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={cn(
            "absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full blur-3xl",
            isNegative ? "bg-red-50/50" : "bg-zinc-50"
          )} />
        </div>

        {/* Back Side (Mantido igual) */}
        <div 
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] p-3 rounded-xl border flex flex-col h-full items-center text-center",
            "bg-slate-900 border-slate-800 text-white shadow-xl hover:bg-slate-800/95 transition-all z-30"
          )}
        >
          <div className="flex-1 flex flex-col justify-center space-y-4 w-full py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Calculator className="w-3 h-3 text-rodovia-verde" />
                <span className="text-[9px] font-mono font-black text-rodovia-verde uppercase tracking-[0.3em]">Cálculo</span>
              </div>
              <p className="text-[10px] font-bold text-slate-200 leading-snug px-1">
                {calculationDetail}
              </p>
            </div>

            <div className="w-12 h-px bg-white/10 mx-auto" />

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <PieChart className="w-3 h-3 text-rodovia-verde" />
                <span className="text-[9px] font-mono font-black text-rodovia-verde uppercase tracking-[0.3em]">Peso s/ Rec. Bruta</span>
              </div>
              <p className="text-[10px] font-bold text-slate-200 leading-snug px-1">
                {avDetail}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const DRELoadingScreen = () => {
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
          className="absolute inset-0 -m-8 rounded-full bg-rodovia-verde/20 blur-2xl"
        />
        
        {/* Main Logo Container */}
        <div className="relative bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-black/[0.03] flex flex-col items-center gap-6">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border-2 border-dashed border-rodovia-verde/30 rounded-full"
            />
            <div className="w-16 h-16 bg-rodovia-azul rounded-2xl flex items-center justify-center shadow-lg shadow-rodovia-azul/20">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <h2 className="text-lg font-black tracking-tighter text-rodovia-azul uppercase">
              Consolidando <span className="text-rodovia-verde italic">DRE</span>
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
                Processando Inteligência Financeira
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
              i === 0 ? "top-0 -left-12 bg-rodovia-verde" : 
              i === 1 ? "bottom-12 -right-16 bg-rodovia-azul" : 
              "top-12 -right-12 bg-rodovia-verde"
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

import { ModernSelect } from "@/components/ui/ModernSelect";

const ComparisonPanel = ({ 
  p1, p2, setP1, setP2, timePerspective, setTimePerspective, onClose 
}: { 
  p1: any, p2: any, setP1: any, setP2: any, timePerspective: string, setTimePerspective: (t: TimePerspective) => void, onClose: () => void 
}) => {
  const getPeriodOptions = () => {
    switch (timePerspective) {
      case 'month': return MONTH_LABELS_FULL.map((m, i) => ({ label: m, value: MONTH_LABELS[i] }));
      case 'bimestre': return BIMESTRE_LABELS.map((b, i) => ({ label: b, value: i }));
      case 'trimestre': return TRIMESTRE_LABELS.map((t, i) => ({ label: t, value: i }));
      case 'semestre': return SEMESTRE_LABELS.map((s, i) => ({ label: s, value: i }));
      default: return [];
    }
  };

  const options = getPeriodOptions();

  const perspectiveOptions = [
    { label: "Mensal", value: "month" },
    { label: "Bimestral", value: "bimestre" },
    { label: "Trimestral", value: "trimestre" },
    { label: "Semestral", value: "semestre" },
    { label: "Anual", value: "year" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white p-6 rounded-xl border border-black/[0.05] shadow-[0_15px_50px_-15px_rgba(0,0,0,0.08)] mb-6 relative"
    >
      {/* Background Decor - Wrapped to prevent overflow but allow dropdowns */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rodovia-verde/5 rounded-full blur-3xl -mr-32 -mt-32" />
      </div>
      
      <div className="flex flex-col gap-6 relative z-10">
        {/* Header: Tipo de Análise */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rodovia-azul/10 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-rodovia-azul" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rodovia-azul uppercase tracking-wide">Análise Comparativa</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Defina os parâmetros da comparação</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-2">Tipo de Análise:</span>
            <div className="flex bg-zinc-100/80 p-1 rounded-lg border border-black/5">
              {perspectiveOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTimePerspective(opt.value as TimePerspective);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all duration-300",
                    timePerspective === opt.value
                      ? "bg-white text-rodovia-azul shadow-sm ring-1 ring-black/5"
                      : "text-zinc-400 hover:text-zinc-600 hover:bg-black/5"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Seletores de Período (Storytelling Visual) */}
        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-8 justify-center py-2">
          {/* Lado A: Referência Principal */}
          <div className="flex-1 w-full bg-zinc-50/50 rounded-xl p-4 border border-zinc-100/80 flex flex-col gap-3 group hover:border-rodovia-azul/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-rodovia-azul uppercase tracking-widest bg-rodovia-azul/10 px-2 py-0.5 rounded-full">Referência (A)</span>
              <span className="text-[9px] font-bold text-zinc-400 italic">Período Principal</span>
            </div>
            
            <div className="flex gap-3">
              <ModernSelect 
                label="Ano"
                value={p1.year}
                onChange={(val) => setP1({ ...p1, year: val })}
                options={YEARS.map(y => ({ label: y, value: y }))}
                variant="azul"
                className="flex-1"
              />
              
              <AnimatePresence mode="wait">
                {timePerspective !== 'year' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex-1"
                  >
                    <ModernSelect 
                      label={timePerspective === 'month' ? 'Mês' : timePerspective === 'bimestre' ? 'Bimestre' : timePerspective === 'trimestre' ? 'Trimestre' : 'Semestre'}
                      value={p1.value}
                      onChange={(val) => setP1({ ...p1, value: val })}
                      options={options}
                      variant="azul"
                      className="w-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Conector VS */}
          <div className="flex flex-col items-center justify-center gap-2 shrink-0">
            <div className="w-12 h-12 rounded-full bg-white border-4 border-zinc-100 flex items-center justify-center shadow-sm relative z-20">
              <span className="font-black text-zinc-300 text-xs italic">VS</span>
            </div>
          </div>

          {/* Lado B: Base de Comparação */}
          <div className="flex-1 w-full bg-zinc-50/50 rounded-xl p-4 border border-zinc-100/80 flex flex-col gap-3 group hover:border-rodovia-verde/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-rodovia-verde uppercase tracking-widest bg-rodovia-verde/10 px-2 py-0.5 rounded-full">Comparado com (B)</span>
              <span className="text-[9px] font-bold text-zinc-400 italic">Período Base</span>
            </div>
            
            <div className="flex gap-3">
              <ModernSelect 
                label="Ano"
                value={p2.year}
                onChange={(val) => setP2({ ...p2, year: val })}
                options={YEARS.map(y => ({ label: y, value: y }))}
                variant="verde"
                className="flex-1"
              />
              
              <AnimatePresence mode="wait">
                {timePerspective !== 'year' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex-1"
                  >
                    <ModernSelect 
                      label={timePerspective === 'month' ? 'Mês' : timePerspective === 'bimestre' ? 'Bimestre' : timePerspective === 'trimestre' ? 'Trimestre' : 'Semestre'}
                      value={p2.value}
                      onChange={(val) => setP2({ ...p2, value: val })}
                      options={options}
                      variant="verde"
                      className="w-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

import { useFilter } from "@/contexts/FilterContext";

export default function DREDashboard() {
  const { period: year, month: monthLabel } = useFilter();
  const { contas, loading: loadingContas } = useContas();
  const { categoriasDRE, subcategoriasDRE, loading: loadingDominios } = useDominios();
  
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [compP1, setCompP1] = useState<{ value: string | number; year: string }>({ value: monthLabel, year: year });
  const [compP2, setCompP2] = useState<{ value: string | number; year: string }>({ value: "Jan", year: "2025" });
  const [timePerspective, setTimePerspective] = useState<TimePerspective>('month');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Estado para o Modal de Detalhes
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState<{
    title: string;
    value: number;
    dateLabel: string;
    contasIds: (number | string)[];
    dateRange: { start: string; end: string };
  } | null>(null);

  useEffect(() => {
    // Reset values when perspective changes to avoid index/month mismatch
    if (isComparisonMode) {
      if (timePerspective === 'month') {
        setCompP1(prev => ({ ...prev, value: monthLabel }));
        setCompP2(prev => ({ ...prev, value: 'Jan' }));
      } else {
        setCompP1(prev => ({ ...prev, value: 0 }));
        setCompP2(prev => ({ ...prev, value: 0 }));
      }
    }
  }, [timePerspective, isComparisonMode]);


  
  const currentRange = useMemo(() => {
    const monthIndex = MONTH_MAP[monthLabel];
    const date = new Date(parseInt(year), monthIndex, 1);
    
    let start = startOfMonth(date);
    let end = endOfMonth(date);

    if (isComparisonMode) {
      // No modo comparação, buscamos um range que cubra ambos os períodos
      const getPDate = (p: typeof compP1) => {
        const mIdx = typeof p.value === 'string' ? MONTH_MAP[p.value] : 0;
        return new Date(parseInt(p.year), mIdx, 1);
      };

      const dates = [getPDate(compP1), getPDate(compP2)].sort((a, b) => a.getTime() - b.getTime());
      
      // Expandimos para cobrir o ano todo se for visão agrupada
      if (['bimestre', 'trimestre', 'semestre', 'year'].includes(timePerspective)) {
        const startYear = Math.min(parseInt(String(compP1.year)), parseInt(String(compP2.year)));
        const endYear = Math.max(parseInt(String(compP1.year)), parseInt(String(compP2.year)));
        start = startOfYear(new Date(startYear, 0, 1));
        end = endOfYear(new Date(endYear, 0, 1));
      } else {
        start = startOfMonth(dates[0]);
        end = endOfMonth(dates[1]);
      }
    } else {
      if (timePerspective === 'month') {
        start = startOfMonth(subMonths(date, 1));
      }
      if (timePerspective === 'year') {
        // Pega desde Dezembro do ano anterior para cálculo de AH de Janeiro
        start = subMonths(startOfYear(date), 1);
        end = endOfYear(date);
      }
      if (timePerspective === 'trimestre') {
        // Pega desde Outubro do ano anterior (Q4) para cálculo de AH do Q1
        start = subMonths(startOfYear(date), 3);
        end = endOfYear(date);
      }
      if (timePerspective === 'bimestre') {
        // Pega desde Novembro do ano anterior (B6) para cálculo de AH do B1
        start = subMonths(startOfYear(date), 2);
        end = endOfYear(date);
      }
      if (timePerspective === 'semestre') {
        // Pega desde Julho do ano anterior (S2) para cálculo de AH do S1
        start = subMonths(startOfYear(date), 6);
        end = endOfYear(date);
      }
      if (timePerspective === 'multi-year') {
        start = startOfYear(new Date(parseInt(YEARS[0]), 0, 1));
        end = endOfYear(new Date(parseInt(YEARS[YEARS.length - 1]), 0, 1));
      }
    }

    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    };
  }, [year, monthLabel, timePerspective, isComparisonMode, compP1, compP2]);

  const columnLabels = useMemo(() => {
    if (isComparisonMode) {
      const getPeriodLabel = (p: typeof compP1) => {
        if (timePerspective === 'month') return `${p.value}/${p.year.slice(-2)}`;
        if (timePerspective === 'bimestre') return `${BIMESTRE_LABELS[p.value as number]} ${p.year}`;
        if (timePerspective === 'trimestre') return `${TRIMESTRE_LABELS[p.value as number]} ${p.year}`;
        if (timePerspective === 'semestre') return `${SEMESTRE_LABELS[p.value as number]} ${p.year}`;
        return `${p.year}`;
      };
      return [getPeriodLabel(compP1), getPeriodLabel(compP2), 'AH %', 'AV %', 'ANÁLISE SINTÉTICA'];
    }

    switch (timePerspective) {
      case 'month': {
        return [`${monthLabel}/${year.slice(-2)}`, 'Anterior', 'AH %', 'AV %'];
      }
      case 'bimestre': return [...BIMESTRE_LABELS, 'Total'];
      case 'trimestre': return ['1º Tri', '2º Tri', '3º Tri', '4º Tri', 'Total'];
      case 'semestre': return ['1º Semestre', '2º Semestre', 'Total'];
      case 'year': return [...MONTH_LABELS, 'Total'];
      case 'multi-year': return [...YEARS, 'Total'];
      default: return [];
    }
  }, [timePerspective, monthLabel, year, isComparisonMode, compP1, compP2]);

  useEffect(() => {
    const fetchMovimentos = async () => {
      setLoadingMov(true);
      setError(null);
      
      const query = `
        with unified_movs as (
            select reclan as lan, recconta as conta, recvalor as valor from tabreceb
            union all
            select deslan as lan, desconta as conta, desvalor as valor from tabdespesas
        )
        select
            u.conta as concod,
            m.movdatacxa as data,
            round(sum(u.valor), 2) as valor
        from tabmovimento as m
        inner join unified_movs u on m.movlanc = u.lan
        where m.movdatacxa between '${currentRange.start}' and '${currentRange.end}'
        group by u.conta, m.movdatacxa
      `;

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
  }, [currentRange]);

  const isP1AfterP2 = useMemo(() => {
    if (!isComparisonMode) return true; // Padrão: Mês Atual (P1) > Mês Anterior (P2)
    
    const y1 = parseInt(compP1.year);
    const y2 = parseInt(compP2.year);
    if (y1 !== y2) return y1 > y2;
    
    // Mesmo ano, compara value
    let v1 = 0, v2 = 0;
    if (typeof compP1.value === 'string') {
      v1 = MONTH_MAP[compP1.value];
      v2 = MONTH_MAP[compP2.value as string];
    } else {
      v1 = compP1.value as number;
      v2 = compP2.value as number;
    }
    return v1 > v2;
  }, [compP1, compP2, isComparisonMode]);

  // Lógica de Consolidação e Cálculo de Fórmulas
  const dreData = useMemo(() => {
    if (loadingContas || loadingDominios) return [];

    const configMap = new Map(contas.map(c => [c.concod, c]));
    const dreCategorias = categoriasDRE.filter(cat => cat.dre !== false).sort((a, b) => a.ordem - b.ordem);
    
    // Helper para resolver fórmulas em múltiplas colunas
    const resolveFormulaMulti = (formula: string, valuesMap: Map<string, number[]>) => {
      if (!formula) return [];
      const numCols = Array.from(valuesMap.values())[0]?.length || 0;
      const results = new Array(numCols).fill(0);
      
      for (let i = 0; i < numCols; i++) {
        const colMap = new Map<string, number>();
        valuesMap.forEach((vals, name) => colMap.set(name, vals[i]));
        
        // 1. Primeiro tenta substituir referências entre colchetes [NOME] ou [1]
        let expression = formula.replace(/\[(.*?)\]/g, (_, name) => {
          const val = colMap.get(name.trim()) || 0;
          return `(${val})`;
        });

        // 2. Depois tenta substituir números puros que correspondam a ordens (ex: 1-2)
        // Usamos \b para garantir que '1' não substitua o início de '10'
        expression = expression.replace(/\b(\d+)\b/g, (match) => {
          if (colMap.has(match)) {
            return `(${colMap.get(match)})`;
          }
          return match;
        });

        try {
          // eslint-disable-next-line no-new-func
          results[i] = new Function(`return ${expression}`)();
        } catch (e) {
          console.error(`Erro ao avaliar fórmula DRE: ${formula} -> ${expression}`, e);
          results[i] = 0;
        }
      }
      return results;
    };

    // Identifica o número de colunas de valores (excluindo AH/AV do array de values principal)
    let numCols = 0;
    if (isComparisonMode) {
      numCols = 2;
    } else {
      if (timePerspective === 'month') numCols = 2;
      if (timePerspective === 'bimestre') numCols = 7; // 6 bimestres + Total
      if (timePerspective === 'trimestre') numCols = 5; // 4 trimestres + total
      if (timePerspective === 'semestre') numCols = 3; // 2 semestres + total
      if (timePerspective === 'year') numCols = 13; // 12 meses + Total
      if (timePerspective === 'multi-year') numCols = YEARS.length + 1; // Years + Total
    }

    const getColIndex = (dateStr: string) => {
      // Parse manual da data para evitar problemas de fuso horário (GMT-3 vs UTC)
      // Formato esperado do banco: YYYY-MM-DD
      const parts = dateStr.split('-');
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1; // 0-based index (0=Jan, 11=Dez)

      if (isComparisonMode) {
        if (timePerspective === 'month') {
          if (y === parseInt(compP1.year) && m === MONTH_MAP[compP1.value as string]) return 0;
          if (y === parseInt(compP2.year) && m === MONTH_MAP[compP2.value as string]) return 1;
        } else if (timePerspective === 'year') {
          // Garante que a comparação de ano funcione mesmo com strings
          if (y === parseInt(String(compP1.year))) return 0;
          if (y === parseInt(String(compP2.year))) return 1;
        } else {
          // Bimestre, Trimestre, Semestre
          const getGroupIdx = (month: number) => {
            if (timePerspective === 'bimestre') return Math.floor(month / 2);
            if (timePerspective === 'trimestre') return Math.floor(month / 3);
            if (timePerspective === 'semestre') return Math.floor(month / 6);
            return -1;
          };

          const currentGroup = getGroupIdx(m);
          if (y === parseInt(compP1.year) && currentGroup === compP1.value) return 0;
          if (y === parseInt(compP2.year) && currentGroup === compP2.value) return 1;
        }
        return -1;
      }
      
      if (timePerspective === 'multi-year') {
         const yearIdx = YEARS.indexOf(String(y));
         return yearIdx; // -1 se não encontrar, o que é correto
      }

      const targetY = parseInt(year);
      if (timePerspective === 'month') {
        const targetM = MONTH_MAP[monthLabel];
        if (y === targetY && m === targetM) return 0;
        if (y === targetY && m === targetM - 1) return 1;
        if (targetM === 0 && y === targetY - 1 && m === 11) return 1;
        return -1;
      }
      
      // Lógica específica para Ano/Tri/Semestre: Se for período anterior, retorna código especial -99
      if (timePerspective === 'year') {
         if (y === targetY) return m; // 0..11
         if (y === targetY - 1 && m === 11) return -99; // Dezembro Anterior
         return -1;
      }
      
      if (timePerspective === 'bimestre') {
        if (y === targetY) return Math.floor(m / 2);
        // B6 Anterior (Nov, Dez) = 10, 11
        if (y === targetY - 1 && m >= 10) return -99;
        return -1;
      }
      
      if (timePerspective === 'trimestre') {
        if (y === targetY) return Math.floor(m / 3);
        // Q4 Anterior (Out, Nov, Dez) = 9, 10, 11
        if (y === targetY - 1 && m >= 9) return -99;
        return -1;
      }

      if (timePerspective === 'semestre') {
        if (y === targetY) return Math.floor(m / 6);
        // S2 Anterior (Jul..Dez) = 6..11
        if (y === targetY - 1 && m >= 6) return -99;
        return -1;
      }
      
      if (y !== targetY) return -1;

      // Mantido apenas como fallback
      switch (timePerspective) {
        // case 'trimestre': return Math.floor(m / 3); // Tratado acima
        // case 'semestre': return Math.floor(m / 6); // Tratado acima
        // case 'year': return m; // Já tratado acima
        default: return -1;
      }
    };

    const subcatValues = new Map<string, number[]>();
    // Mapa para guardar valor do período anterior de referência (Dezembro para Anual, Q4 para Trimestral, S2 para Semestral)
    // Mantivemos o nome 'previousDecemberValues' por compatibilidade, mas agora armazena o "Período Anterior" completo
    const previousDecemberValues = new Map<string, number>(); 
    
    movimentos.forEach(mov => {
      const config = configMap.get(mov.concod);
      const subcatId = config?.dre_subcategoria_id || 'nao_definido';
      
      const valor = (mov.valor || 0); 
      const colIdx = getColIndex(mov.data);

      if (colIdx === -99) {
        // Acumula valor de Dezembro anterior
        const current = previousDecemberValues.get(subcatId) || 0;
        previousDecemberValues.set(subcatId, current + valor);
      } else if (colIdx !== -1) {
        if (!subcatValues.has(subcatId)) subcatValues.set(subcatId, new Array(numCols).fill(0));
        subcatValues.get(subcatId)![colIdx] += valor;
        
        // Adiciona ao total anual se necessário (apenas valores do ano corrente, não do anterior)
        if (!isComparisonMode && ['bimestre', 'trimestre', 'semestre', 'year', 'multi-year'].includes(timePerspective)) {
          const totalIdx = numCols - 1;
          subcatValues.get(subcatId)![totalIdx] += valor;
        }
      }
    });

    const catValuesMap = new Map<string, number[]>();
    // Mapa auxiliar para Dezembro anterior de categorias (somatório das subcategorias)
    const catPrevDecMap = new Map<string, number>(); 
    
    const finalResult: any[] = [];

    // Primeiro passo: Categorias CONTA
    dreCategorias.forEach(cat => {
      if (cat.tipo === 'CONTA') {
        const subcats = subcategoriasDRE.filter(s => s.categoria_id === cat.id);
        const catValuesAbsolute = new Array(numCols).fill(0);
        const catValuesSigned = new Array(numCols).fill(0);
        let catPrevDecTotal = 0;

        const subcatRows = subcats.map(sub => {
          const valsAbs = subcatValues.get(sub.id) || new Array(numCols).fill(0);
          const prevDecVal = previousDecemberValues.get(sub.id) || 0;
          
          // Tenta descobrir o sinal médio dessa subcategoria a partir das contas
          const sampleConta = contas.find(c => c.dre_subcategoria_id === sub.id);
          const sinal = sampleConta?.dre_sinal ?? 1;
          
          const valsSigned = valsAbs.map(v => v * sinal);
          const prevDecValSigned = prevDecVal * sinal;
          
          valsAbs.forEach((v, i) => catValuesAbsolute[i] += v);
          valsSigned.forEach((v, i) => catValuesSigned[i] += v);
          catPrevDecTotal += prevDecValSigned;
          
          return { 
            id: sub.id, 
            name: sub.nome, 
            values: valsSigned, 
            prevDecValue: prevDecValSigned, // Passa valor anterior para cálculo
            level: 2, 
            tipo: 'CONTA' 
          };
        });
        
        // Mapeia tanto pelo nome quanto pela ordem (para fórmulas) - SEMPRE ABSOLUTO
        catValuesMap.set(cat.nome.trim(), catValuesAbsolute);
        catValuesMap.set(cat.ordem.toString(), catValuesAbsolute);
        catPrevDecMap.set(cat.nome.trim(), catPrevDecTotal); // Guarda para uso em fórmulas se precisar (mas fórmulas complexas de AH são raras)
        
        finalResult.push({ 
          ...cat, 
          values: catValuesSigned, 
          prevDecValue: catPrevDecTotal,
          subcategories: subcatRows, 
          level: 1 
        });
      }
    });

    // Segundo passo: SUBTOTALs (Respeitando a ordem para dependências de fórmulas)
    dreCategorias.filter(c => c.tipo === 'SUBTOTAL').forEach(cat => {
      const catValues = resolveFormulaMulti(cat.formula || '', catValuesMap);
      
      // Tenta calcular o valor de Dezembro anterior para Subtotais
      // Para isso, precisamos de um mapa simples de "Nome -> Valor"
      const prevDecValuesMap = new Map<string, number>();
      catPrevDecMap.forEach((val, key) => prevDecValuesMap.set(key, val));
      
      let prevDecValue = 0;
      try {
          // Simplificação: Assume que fórmulas só usam nomes, não índices de colunas complexas
          // Substitui [NOME] pelo valor do mapa
          let expression = (cat.formula || '').replace(/\[(.*?)\]/g, (_, name) => {
            const val = prevDecValuesMap.get(name.trim()) || 0;
            return `(${val})`;
          });
          // Substitui referências numéricas de ordem
          expression = expression.replace(/\b(\d+)\b/g, (match) => {
             // Procura no array finalResult já processado
             const found = finalResult.find(r => r.ordem === parseInt(match));
             if (found) return `(${found.prevDecValue || 0})`;
             // Ou procura no mapa de categorias base
             if (catPrevDecMap.has(match)) return `(${catPrevDecMap.get(match)})`;
             return match;
          });
          
          // eslint-disable-next-line no-new-func
          prevDecValue = new Function(`return ${expression}`)();
      } catch (e) {
          prevDecValue = 0;
      }

      // Mapeia o resultado do subtotal também
      catValuesMap.set(cat.nome.trim(), catValues);
      catValuesMap.set(cat.ordem.toString(), catValues);
      catPrevDecMap.set(cat.nome.trim(), prevDecValue); // Adiciona ao mapa para uso futuro
      
      const row = { ...cat, values: catValues, prevDecValue, subcategories: [], level: 1 };
      
      // Insere na posição correta baseado na ordem
      const insertIdx = finalResult.findIndex(r => r.ordem > cat.ordem);
      if (insertIdx === -1) finalResult.push(row);
      else finalResult.splice(insertIdx, 0, row);
    });

    // Terceiro passo: Cálculos finais (AV e AH)
    const receitaBrutaKey = Array.from(catValuesMap.keys()).find(k => k.toLowerCase() === "receita bruta") || "Receita Bruta";
    const receitaBruta = catValuesMap.get(receitaBrutaKey) || new Array(numCols).fill(1);
    
    return finalResult.map(row => {
      const p1Val = row.values[0] || 0;
      const p2Val = row.values[1] || 0;
      
      // AV baseada no primeiro valor ou total
      let avBaseIdx = 0;
      const isMultiPeriod = !isComparisonMode && ['bimestre', 'trimestre', 'semestre', 'year', 'multi-year'].includes(timePerspective);
      if (isMultiPeriod) avBaseIdx = numCols - 1;
      const avBase = Math.abs(receitaBruta[avBaseIdx]) || 1;

      // Cálculo de Arrays Mensais/Agrupados de AV e AH para Visão Anual/Agrupada
      let monthlyAV: number[] = [];
      let monthlyAH: number[] = [];

      if (timePerspective !== 'month' && !isComparisonMode) {
         monthlyAV = row.values.map((val: number, idx: number) => {
             // Se for Total (último índice), usa base Total (último índice)
             // Se for período, usa base do período correspondente
             const base = Math.abs(receitaBruta[idx]) || 1;
             return (val / base) * 100;
         });

         monthlyAH = row.values.map((val: number, idx: number) => {
             let prev = 0;
             if (idx === 0) {
                 // Primeiro período: Tenta pegar do anterior (prevDecValue se for anual/tri/sem)
                 if (['year', 'bimestre', 'trimestre', 'semestre'].includes(timePerspective)) prev = row.prevDecValue || 0;
                 else prev = 0;
             } else if (idx === row.values.length - 1) {
                 // Total: não calculamos AH mensal aqui
                 return 0; 
             } else {
                 prev = row.values[idx - 1];
             }
             return prev !== 0 ? ((val - prev) / Math.abs(prev)) * 100 : 0;
         });
      }

      // Calcula AV e AH para as subcategorias
      const subcategoriesWithMetrics = row.subcategories?.map((sub: any) => {
        const subP1Val = sub.values[0] || 0;
        const subP2Val = sub.values[1] || 0;
        
        let subMonthlyAV: number[] = [];
        let subMonthlyAH: number[] = [];

        if (timePerspective !== 'month' && !isComparisonMode) {
            subMonthlyAV = sub.values.map((val: number, idx: number) => {
                const base = Math.abs(receitaBruta[idx]) || 1;
                return (val / base) * 100;
            });

            subMonthlyAH = sub.values.map((val: number, idx: number) => {
                let prev = 0;
                if (idx === 0) {
                    // Primeiro período: Tenta pegar do anterior
                    if (['year', 'bimestre', 'trimestre', 'semestre'].includes(timePerspective)) prev = sub.prevDecValue || 0;
                    else prev = 0;
                } else if (idx === sub.values.length - 1) {
                    return 0;
                } else {
                    prev = sub.values[idx - 1];
                }
                return prev !== 0 ? ((val - prev) / Math.abs(prev)) * 100 : 0;
            });
        }
        
        let variation = 0;
        if (isComparisonMode) {
          if (isP1AfterP2) {
             variation = subP2Val !== 0 ? ((subP1Val - subP2Val) / Math.abs(subP2Val)) * 100 : 0;
          } else {
             variation = subP1Val !== 0 ? ((subP2Val - subP1Val) / Math.abs(subP1Val)) * 100 : 0;
          }
        } else {
          variation = subP2Val !== 0 ? ((subP1Val - subP2Val) / Math.abs(subP2Val)) * 100 : 0;
        }

        return {
          ...sub,
          variation,
          av: (sub.values[avBaseIdx] / avBase) * 100,
          monthlyAV, // Arrays completos
          monthlyAH: subMonthlyAH
        };
      });

      let variation = 0;
      if (isComparisonMode) {
        if (isP1AfterP2) {
           variation = p2Val !== 0 ? ((p1Val - p2Val) / Math.abs(p2Val)) * 100 : 0;
        } else {
           variation = p1Val !== 0 ? ((p2Val - p1Val) / Math.abs(p1Val)) * 100 : 0;
        }
      } else {
        variation = p2Val !== 0 ? ((p1Val - p2Val) / Math.abs(p2Val)) * 100 : 0;
      }

      return {
        ...row,
        subcategories: subcategoriesWithMetrics,
        current: isComparisonMode ? p1Val : (isMultiPeriod ? row.values[numCols - 1] : p1Val),
        previous: p2Val,
        variation,
        av: (row.values[avBaseIdx] / avBase) * 100,
        monthlyAV,
        monthlyAH
      };
    });
  }, [categoriasDRE, subcategoriasDRE, contas, movimentos, loadingContas, loadingDominios, timePerspective, year, monthLabel, isComparisonMode, compP1, compP2, isP1AfterP2]);

  const handleValueClick = (row: any, colIndex: number, value: number) => {
    // Se não tiver valor ou for subtotal sem contas mapeadas, ignora
    if (value === 0 && row.tipo === 'CONTA') {
      // Opcional: permitir clicar mesmo se for 0? Talvez sim, para ver que não tem nada.
    }
    
    // 1. Determina as contas envolvidas
    let contasIds: (string | number)[] = [];
    
    if (row.tipo === 'CONTA') {
      if (row.level === 2) {
        // É subcategoria
        contasIds = contas
          .filter(c => String(c.dre_subcategoria_id) === String(row.id))
          .map(c => c.concod);
      } else {
        // É categoria (Nível 1) - pega todas as subcategorias
        const subcatsIds = subcategoriasDRE
          .filter(s => String(s.categoria_id) === String(row.id))
          .map(s => String(s.id));
          
        contasIds = contas
          .filter(c => subcatsIds.includes(String(c.dre_subcategoria_id || '')))
          .map(c => c.concod);
      }
    } else if (row.tipo === 'SUBTOTAL') {
       // Tenta encontrar categorias filhas baseadas na ordem ou nome se possível
       // Por enquanto, não suportamos drill-down em fórmulas complexas
       return;
    }

    // Filtra IDs válidos (strings não vazias ou números)
    const validContasIds = contasIds.filter(id => (typeof id === 'number' && !isNaN(id)) || (typeof id === 'string' && id.trim() !== ''));
    
    if (validContasIds.length === 0) {
      console.warn("Nenhuma conta vinculada encontrada para:", row.nome);
      return;
    }

    // 2. Determina o range de datas
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let label = "";

    const targetYear = parseInt(year);

    if (isComparisonMode) {
      // Modo Comparação (2 colunas de valor: 0 e 1)
      if (colIndex > 1) return; // AH/AV não são clicáveis para detalhe temporal direto (ou são?)
      
      const p = colIndex === 0 ? compP1 : compP2;
      const pYear = parseInt(p.year);
      
      if (timePerspective === 'month') {
        const mIdx = MONTH_MAP[p.value as string];
        startDate = new Date(pYear, mIdx, 1);
        endDate = endOfMonth(startDate);
        label = `${p.value}/${p.year}`;
      } else if (timePerspective === 'year') {
        startDate = new Date(pYear, 0, 1);
        endDate = new Date(pYear, 11, 31);
        label = `${p.year}`;
      } else {
        // Bimestre, Trimestre, Semestre
        const idx = p.value as number;
        let startMonth = 0;
        let monthsToAdd = 0;
        
        if (timePerspective === 'bimestre') { startMonth = idx * 2; monthsToAdd = 2; label = `${BIMESTRE_LABELS[idx]} ${p.year}`; }
        if (timePerspective === 'trimestre') { startMonth = idx * 3; monthsToAdd = 3; label = `${TRIMESTRE_LABELS[idx]} ${p.year}`; }
        if (timePerspective === 'semestre') { startMonth = idx * 6; monthsToAdd = 6; label = `${SEMESTRE_LABELS[idx]} ${p.year}`; }
        
        startDate = new Date(pYear, startMonth, 1);
        endDate = endOfMonth(new Date(pYear, startMonth + monthsToAdd - 1, 1));
      }
    } else {
      // Modo Padrão
      if (timePerspective === 'month') {
        // col 0 = Mês Atual, col 1 = Mês Anterior
        if (colIndex > 1) return; // AH/AV
        
        const currentM = MONTH_MAP[monthLabel];
        if (colIndex === 0) {
            startDate = new Date(targetYear, currentM, 1);
            label = `${monthLabel}/${year}`;
        } else {
            startDate = subMonths(new Date(targetYear, currentM, 1), 1);
            label = format(startDate, 'MMM/yyyy', { locale: ptBR });
        }
        endDate = endOfMonth(startDate);
      } else if (timePerspective === 'year') {
        // colIndex 0..11 (Jan..Dez)
        if (colIndex > 11) return;
        startDate = new Date(targetYear, colIndex, 1);
        endDate = endOfMonth(startDate);
        label = `${MONTH_LABELS[colIndex]}/${year}`;
      } else if (timePerspective === 'multi-year') {
         if (colIndex >= YEARS.length) {
            // Total Column
            startDate = new Date(parseInt(YEARS[0]), 0, 1);
            endDate = new Date(parseInt(YEARS[YEARS.length - 1]), 11, 31);
            label = "Total Histórico";
         } else {
            const y = parseInt(YEARS[colIndex]);
            startDate = new Date(y, 0, 1);
            endDate = new Date(y, 11, 31);
            label = `Ano ${y}`;
         }
      } else {
        // Bimestre, Trimestre, Semestre
        // Verifica se é coluna de Total
        let numCols = 0;
        if (timePerspective === 'bimestre') numCols = 6;
        if (timePerspective === 'trimestre') numCols = 4;
        if (timePerspective === 'semestre') numCols = 2;
        
        const isTotal = colIndex === numCols;
        
        if (isTotal) {
          startDate = new Date(targetYear, 0, 1);
          endDate = new Date(targetYear, 11, 31);
          label = `Total ${year}`;
        } else if (colIndex < numCols) {
           let startMonth = 0;
           let monthsToAdd = 0;
           
           if (timePerspective === 'bimestre') { startMonth = colIndex * 2; monthsToAdd = 2; label = BIMESTRE_LABELS[colIndex]; }
           if (timePerspective === 'trimestre') { startMonth = colIndex * 3; monthsToAdd = 3; label = TRIMESTRE_LABELS[colIndex]; }
           if (timePerspective === 'semestre') { startMonth = colIndex * 6; monthsToAdd = 6; label = SEMESTRE_LABELS[colIndex]; }
           
           startDate = new Date(targetYear, startMonth, 1);
           endDate = endOfMonth(new Date(targetYear, startMonth + monthsToAdd - 1, 1));
        } else {
          return;
        }
      }
    }

    if (startDate && endDate) {
      setDetailModalData({
        title: row.nome || row.name,
        value: value,
        dateLabel: label,
        contasIds: validContasIds,
        dateRange: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd')
        }
      });
      setDetailModalOpen(true);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isLoading = loadingContas || loadingDominios || loadingMov;

    // Helper para formatar o label do período (P1 e P2)
    const getPeriodLabel = (p: { value: string | number, year: string }) => {
      if (timePerspective === 'month') {
        // Se for string ("Jan", "Fev"), usa o MONTH_MAP
        if (typeof p.value === 'string') {
           // O MONTH_MAP retorna 0-based index, precisamos usar para pegar o nome completo
           const idx = MONTH_MAP[p.value];
           if (idx !== undefined) return `${MONTH_LABELS_FULL[idx]} de ${p.year}`;
           // Fallback se não achar no mapa
           return `${p.value} de ${p.year}`;
        }
        // Se por acaso vier número
        return `${MONTH_LABELS_FULL[p.value as number]} de ${p.year}`;
      }
      if (timePerspective === 'year') {
        return `Ano de ${p.year}`;
      }
      if (timePerspective === 'bimestre') return `${BIMESTRE_LABELS[p.value as number]} de ${p.year}`;
      if (timePerspective === 'trimestre') return `${TRIMESTRE_LABELS[p.value as number]} de ${p.year}`;
      if (timePerspective === 'semestre') return `${SEMESTRE_LABELS[p.value as number]} de ${p.year}`;
      return `${p.value}/${p.year}`;
    };

    const getComparisonSubtitle = () => {
      if (!isComparisonMode) return null;
      return `${getPeriodLabel(compP1)} vs ${getPeriodLabel(compP2)}`;
    };

    // KPIs Estratégicos (Financeiro Sênior)
    const kpis = useMemo(() => {
      const findRow = (name: string) => dreData.find(d => d.nome.trim().toLowerCase() === name.toLowerCase());
      
      const getVal = (name: string) => {
        const row = findRow(name);
        if (row) return row.current || 0;
        
        // Fallbacks para nomes específicos do banco
        if (name.toLowerCase() === "ebitda") return findRow("EBITDA Gerencial")?.current || 0;
        if (name.toLowerCase() === "resultado líquido") return findRow("Resultado Líquido do Período")?.current || 0;
        if (name.toLowerCase() === "despesas operacionais") {
          return (findRow("Despesa Fixa")?.current || 0) + (findRow("Despesa Variável")?.current || 0);
        }
        return 0;
      };

      const getPrev = (name: string) => {
        const row = findRow(name);
        if (row) return row.previous || 0;
        
        if (name.toLowerCase() === "ebitda") return findRow("EBITDA Gerencial")?.previous || 0;
        if (name.toLowerCase() === "resultado líquido") return findRow("Resultado Líquido do Período")?.previous || 0;
        if (name.toLowerCase() === "despesas operacionais") {
          return (findRow("Despesa Fixa")?.previous || 0) + (findRow("Despesa Variável")?.previous || 0);
        }
        return 0;
      };

      const getAV = (name: string) => {
        const row = findRow(name);
        if (row) return row.av || 0;
        
        if (name.toLowerCase() === "ebitda") return findRow("EBITDA Gerencial")?.av || 0;
        if (name.toLowerCase() === "resultado líquido") return findRow("Resultado Líquido do Período")?.av || 0;
        if (name.toLowerCase() === "despesas operacionais") {
          return (findRow("Despesa Fixa")?.av || 0) + (findRow("Despesa Variável")?.av || 0);
        }
        return 0;
      };

      const p1Label = isComparisonMode ? getPeriodLabel(compP1) : "";
      const p2Label = isComparisonMode ? getPeriodLabel(compP2) : "";

      return [
        { 
          label: "Receita Bruta", 
          value: getVal("Receita Bruta"), 
          previousValue: getPrev("Receita Bruta"),
          av: getAV("Receita Bruta"), 
          icon: BarChart3,
          storytelling: "Volume total de vendas e fretes realizados",
          calculationDetail: "Soma de todos os recebimentos brutos de fretes e vendas de mercadorias, antes de qualquer dedução ou imposto.",
          avDetail: "Como base do DRE, representa 100% da operação. Todos os outros pesos são calculados em relação a este valor.",
          p1Label, p2Label
        },
        { 
          label: "Receita Líquida", 
          value: getVal("Receita Líquida"), 
          previousValue: getPrev("Receita Líquida"),
          av: getAV("Receita Líquida"), 
          icon: TrendingUp,
          storytelling: "Faturamento real após impostos e deduções",
          calculationDetail: "Receita Bruta menos as deduções (Impostos sobre vendas, devoluções e cancelamentos).",
          avDetail: "Representa quanto do faturamento bruto realmente entra para a empresa após as obrigações tributárias iniciais.",
          p1Label, p2Label
        },
        { 
          label: "Margem Bruta", 
          value: getVal("Margem Bruta"), 
          previousValue: getPrev("Margem Bruta"),
          av: getAV("Margem Bruta"), 
          icon: BarChart3,
          storytelling: "Eficiência direta da operação de transporte",
          calculationDetail: "Receita Líquida menos os Custos Diretos (Custo Fixo + Custo Variável da operação).",
          avDetail: "Indica a lucratividade direta da operação antes de considerar as despesas administrativas e de vendas.",
          p1Label, p2Label
        },
        { 
          label: "Marg. Contribuição", 
          value: getVal("Margem de Contribuição"), 
          previousValue: getPrev("Margem de Contribuição"),
          av: getAV("Margem de Contribuição"), 
          icon: BarChart3,
          storytelling: "O que sobra para pagar os custos fixos e gerar lucro",
          calculationDetail: "Margem Bruta menos as Despesas Variáveis (comissões, taxas de cartão, etc).",
          avDetail: "É o valor que 'sobra' para cobrir as despesas fixas da empresa e gerar o lucro final.",
          p1Label, p2Label
        },
        { 
          label: "EBITDA", 
          value: getVal("EBITDA"), 
          previousValue: getPrev("EBITDA"),
          av: getAV("EBITDA"), 
          icon: TrendingUp,
          storytelling: "Potencial de geração de caixa operacional",
          calculationDetail: "Margem de Contribuição menos as Despesas Fixas Operacionais.",
          avDetail: "Mede a capacidade de geração de caixa apenas pela operação, desconsiderando impostos e efeitos financeiros.",
          p1Label, p2Label
        },
        { 
          label: "Desp. Operacionais", 
          value: getVal("Despesas Operacionais"), 
          previousValue: getPrev("Despesas Operacionais"),
          av: getAV("Despesas Operacionais"), 
          icon: Layers,
          storytelling: "Custo para manter a estrutura funcionando",
          calculationDetail: "Soma de todas as Despesas Fixas e Variáveis administrativas da empresa.",
          avDetail: "Mostra o peso da estrutura administrativa e comercial em relação ao faturamento total.",
          p1Label, p2Label
        },
        { 
          label: "Resultado Líquido", 
          value: getVal("Resultado Líquido"), 
          previousValue: getPrev("Resultado Líquido"),
          av: getAV("Resultado Líquido"), 
          highlight: true, 
          icon: PieChart,
          storytelling: "O lucro real que sobra no bolso da empresa",
          calculationDetail: "EBITDA somado ao Resultado Financeiro e ajustes não operacionais, subtraindo impostos finais.",
          avDetail: "É a Lucratividade Final. Indica quantos centavos de cada Real vendido realmente sobraram como lucro.",
          p1Label, p2Label
        },
      ];
    }, [dreData, isComparisonMode, compP1, compP2, timePerspective]);

  return (
    <div className="space-y-3 pb-20">
      <AnimatePresence>
        {isLoading && <DRELoadingScreen />}
      </AnimatePresence>

      {/* Modern Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-black/[0.03] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rodovia-verde/5 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-3.5 bg-rodovia-verde/10 rounded-2xl shadow-inner">
            <FileText className="w-6 h-6 text-rodovia-verde" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-rodovia-azul uppercase flex items-center gap-2">
              DRE <span className="text-rodovia-verde italic">Gerencial</span>
              <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 text-[10px] font-mono border-none py-0.5">V2.0</Badge>
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rodovia-verde/5 rounded-full border border-rodovia-verde/10">
                <CalendarDays className="w-3 h-3 text-rodovia-verde" />
                <span className="text-[10px] font-mono font-black text-rodovia-verde uppercase">{monthLabel} {year}</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.15em] hidden sm:block">Demonstração Consolidada</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-end lg:items-center gap-3 relative z-10 w-full md:w-auto">
          {/* Segmented Control: Perspectiva */}
          {!isComparisonMode && (
            <div className="flex items-center bg-zinc-100/80 p-1 rounded-[1.25rem] border border-black/5 backdrop-blur-md shadow-inner overflow-x-auto scrollbar-hide max-w-[calc(100vw-3rem)] lg:max-w-none">
              {(['month', 'bimestre', 'trimestre', 'semestre', 'year', 'multi-year'] as TimePerspective[]).map((p) => {
                const isActive = timePerspective === p;
                
                let label = '';
                switch (p) {
                  case 'month': label = 'Mensal'; break;
                  case 'bimestre': label = 'Bimestral'; break;
                  case 'trimestre': label = 'Trimestral'; break;
                  case 'semestre': label = 'Semestral'; break;
                  case 'year': label = 'Anual'; break;
                  case 'multi-year': label = 'Histórico'; break;
                  default: label = p;
                }

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTimePerspective(p);
                    }}
                    className={cn(
                      "relative px-3 lg:px-4 py-2 rounded-xl text-[10px] font-mono font-black uppercase transition-all duration-300 tracking-wider whitespace-nowrap",
                      isActive
                        ? "text-white bg-rodovia-verde shadow-[0_4px_12px_-2px_rgba(16,185,129,0.4)] border border-emerald-400/20" 
                        : "text-zinc-500 hover:text-rodovia-azul hover:bg-black/5"
                    )}
                  >
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Toggle: Comparar Períodos */}
          <button
            onClick={() => {
              if (!isComparisonMode && timePerspective === 'multi-year') {
                setTimePerspective('year');
              }
              setIsComparisonMode(!isComparisonMode);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap",
              isComparisonMode
                ? "bg-rodovia-azul text-white shadow-[0_10px_25px_-5px_rgba(15,23,42,0.3)] ring-4 ring-rodovia-azul/10"
                : "bg-white text-zinc-500 border border-black/5 hover:border-rodovia-verde/30 hover:bg-zinc-50 shadow-sm"
            )}
          >
            <ArrowRightLeft className={cn("w-3.5 h-3.5 transition-transform duration-500", isComparisonMode && "rotate-180")} />
            {isComparisonMode ? "Comparando" : "Comparar"}
          </button>

          <div className="h-8 w-px bg-zinc-200/60 mx-1 hidden lg:block" />
        </div>
      </section>

      <AnimatePresence>
        {isComparisonMode && (
          <ComparisonPanel 
            p1={compP1}
            p2={compP2}
            setP1={setCompP1}
            setP2={setCompP2}
            timePerspective={timePerspective}
            setTimePerspective={setTimePerspective}
            onClose={() => setIsComparisonMode(false)}
          />
        )}
      </AnimatePresence>

      {/* Strategic KPIs Section */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3">
        {kpis.map((kpi, i) => (
          <KPICard 
            key={i}
            label={kpi.label}
            value={kpi.value}
            previousValue={kpi.previousValue}
            av={kpi.av}
            icon={kpi.icon}
            highlight={kpi.highlight}
            storytelling={kpi.storytelling}
            calculationDetail={kpi.calculationDetail}
            avDetail={kpi.avDetail}
            isComparisonMode={isComparisonMode}
            p1Label={kpi.p1Label}
            p2Label={kpi.p2Label}
          />
        ))}
      </section>

      {/* Professional DRE Table */}
      <section className="bg-white border border-black/[0.03] rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden flex flex-col max-w-full">
        {/* Table Header / Title Section */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-black tracking-tight text-rodovia-azul uppercase flex items-center gap-2">
              <Layers className="w-5 h-5 text-rodovia-verde" />
              Detalhamento <span className="text-rodovia-verde italic">Financeiro</span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest pl-7">
              {isComparisonMode 
                ? (
                  <>
                    <span className="text-rodovia-azul">Comparativo:</span> {getComparisonSubtitle()}
                  </>
                )
                : timePerspective === 'month'
                  ? `Demonstrativo de ${MONTH_LABELS_FULL[MONTH_MAP[monthLabel]] || monthLabel} de ${year}`
                  : timePerspective === 'multi-year'
                    ? `Visão Histórica Consolidada (${YEARS[0]} - ${YEARS[YEARS.length - 1]})`
                    : `Visão ${
                        timePerspective === 'year' ? 'Evolutiva Mensal' 
                        : timePerspective === 'bimestre' ? 'Bimestral'
                        : timePerspective === 'trimestre' ? 'Trimestral' 
                        : 'Semestral'
                      } Consolidada de ${year}`
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-zinc-200 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${isComparisonMode ? 'bg-purple-500' : 'bg-rodovia-verde'} animate-pulse`} />
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                  {isComparisonMode ? 'Modo Comparativo' : 'Tempo Real'}
                </span>
             </div>
          </div>
        </div>

        {error ? (
          <div className="p-20 flex flex-col items-center justify-center text-center gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h3 className="text-lg font-bold">Falha na Sincronização</h3>
            <p className="text-muted-foreground max-w-sm">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </div>
        ) : (
          <div className={cn(
            "w-full overflow-auto max-h-[850px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200/50 hover:scrollbar-thumb-zinc-300",
            (timePerspective === 'year' || timePerspective === 'multi-year' || timePerspective === 'bimestre' || timePerspective === 'trimestre') && !isComparisonMode && "max-w-[calc(100vw-2.5rem)]"
          )}>
            <div className={cn(
              "pb-4",
              timePerspective === 'bimestre' && !isComparisonMode && "min-w-[2000px]",
              timePerspective === 'trimestre' && !isComparisonMode && "min-w-[1700px]",
              timePerspective === 'semestre' && !isComparisonMode && "min-w-[1040px]",
              timePerspective === 'multi-year' && !isComparisonMode && "min-w-[2600px]",
              timePerspective === 'year' && !isComparisonMode && "min-w-[3920px]"
            )}>
              <DRERow 
                id="header"
                name="ESTRUTURA GERENCIAL" 
                labels={columnLabels}
                isHeader={true} 
                timePerspective={timePerspective}
                isComparisonMode={isComparisonMode}
              />
              
              {dreData.length === 0 && !isLoading ? (
                <div className="p-20 text-center text-muted-foreground italic">Nenhum dado financeiro encontrado para os parâmetros selecionados.</div>
              ) : (
                dreData.map((cat, idx) => {
                  const hasChildren = cat.subcategories && cat.subcategories.length > 0;
                  const isExpanded = expandedRows.has(cat.id);
                  
                  return (
                    <React.Fragment key={cat.id}>
                      <DRERow 
                        id={cat.id}
                        name={cat.nome_dre || cat.nome} 
                        values={cat.values}
                        variation={cat.variation} 
                        av={cat.av}
                        monthlyAV={cat.monthlyAV}
                        monthlyAH={cat.monthlyAH}
                        hasChildren={hasChildren}
                        isExpanded={isExpanded}
                        tipo={cat.tipo}
                        timePerspective={timePerspective}
                        isComparisonMode={isComparisonMode}
                        onToggle={() => toggleRow(cat.id)}
                        onValueClick={(colIdx, val) => handleValueClick(cat, colIdx, val)}
                      />
                      
                      {isExpanded && cat.subcategories.map((sub: any, sIdx: number) => (
                        <DRERow 
                          key={sub.id}
                          id={sub.id}
                          name={sub.name} 
                          values={sub.values}
                          variation={sub.variation} 
                          av={sub.av}
                          monthlyAV={sub.monthlyAV}
                          monthlyAH={sub.monthlyAH}
                          level={2}
                          tipo="CONTA"
                          timePerspective={timePerspective}
                          isComparisonMode={isComparisonMode}
                          onValueClick={(colIdx, val) => handleValueClick(sub, colIdx, val)}
                        />
                      ))}
                    </React.Fragment>
                  );
                })
              )}

              {/* Totalizador de Rodapé - Opcional se já tiver Resultado Líquido como SUBTOTAL */}
              {dreData.length > 0 && !dreData.some(d => d.nome.toLowerCase().includes('resultado líquido')) && (
                <div className="bg-slate-900 mt-auto">
                  <DRERow 
                    id="total"
                    name="RESULTADO LÍQUIDO CONSOLIDADO" 
                    values={(() => {
                      const numValCols = dreData[0]?.values?.length || 1;
                      const results = new Array(numValCols).fill(0);
                      dreData.forEach(c => {
                        if (c.tipo === 'CONTA') {
                          c.values.forEach((v: number, i: number) => results[i] += v);
                        }
                      });
                      return results;
                    })()} 
                    isHeader={false}
                    isTotal={true}
                    timePerspective={timePerspective}
                    isComparisonMode={isComparisonMode}
                    className="text-white border-none h-16"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <DREDetailModal 
        isOpen={detailModalOpen} 
        onClose={() => setDetailModalOpen(false)} 
        data={detailModalData} 
      />
    </div>
  );
}


