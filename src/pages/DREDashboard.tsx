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
import AssessorSheet from "@/components/dashboard/AssessorSheet";
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
const BIMESTRE_LABELS = ["1º Bim", "2º Bim", "3º Bim", "4º Bim", "5º Bim", "6º Bim"];
const TRIMESTRE_LABELS = ["1º Tri", "2º Tri", "3º Tri", "4º Tri"];
const SEMESTRE_LABELS = ["1º Semestre", "2º Semestre"];

type TimePerspective = 'month' | 'bimestre' | 'trimestre' | 'semestre' | 'year';

import { DREDetailModal } from "@/components/dashboard/DREDetailModal";

const DRERow = ({ 
  id,
  name, 
  values, // Array de valores dinâmicos
  labels, // Array de labels para o header
  variation, 
  av,
  level = 1,
  isHeader = false,
  isTotal = false,
  isExpanded = false,
  hasChildren = false,
  tipo = 'CONTA',
  timePerspective = 'month',
  isComparisonMode = false,
  className,
  onToggle,
  onClick,
  onValueClick
}: { 
  id: string;
  name: string; 
  values?: number[];
  labels?: string[];
  variation?: number;
  av?: number;
  level?: number;
  isHeader?: boolean;
  isTotal?: boolean;
  isExpanded?: boolean;
  hasChildren?: boolean;
  tipo?: 'CONTA' | 'SUBTOTAL';
  timePerspective?: TimePerspective;
  isComparisonMode?: boolean;
  className?: string;
  onToggle?: () => void;
  onClick?: () => void;
  onValueClick?: (colIndex: number, value: number) => void;
}) => {
  const isSubtotal = tipo === 'SUBTOTAL';
  
  // Define o grid dinamicamente baseado na perspectiva
  const gridClass = useMemo(() => {
    if (isComparisonMode) return "grid-cols-[minmax(350px,3fr)_140px_140px_100px_100px]";

    switch (timePerspective) {
      case 'month': return "grid-cols-[minmax(350px,3fr)_140px_140px_100px_100px]";
      case 'bimestre': return "grid-cols-[minmax(350px,3fr)_repeat(6,120px)_140px]";
      case 'trimestre': return "grid-cols-[minmax(350px,3fr)_repeat(4,130px)_150px]";
      case 'semestre': return "grid-cols-[minmax(350px,3fr)_repeat(2,160px)_160px]";
      case 'year': return "grid-cols-[minmax(300px,3fr)_repeat(12,110px)]";
      default: return "grid-cols-12";
    }
  }, [timePerspective, isComparisonMode]);

  return (
    <div 
      className={cn(
        "grid items-center py-2 pr-8 border-b border-zinc-100 relative",
        gridClass,
        isHeader ? 'bg-rodovia-azul font-mono text-[11px] uppercase tracking-widest text-white sticky top-0 z-40 h-12' : (isTotal ? '' : 'hover:bg-zinc-50/80 cursor-pointer group'),
        isSubtotal && !isHeader ? 'bg-zinc-100/90 font-black border-y border-zinc-200/50' : '',
        isTotal ? 'bg-rodovia-azul text-white font-black' : '',
        level === 1 && !isHeader ? 'text-[14px] text-zinc-900' : (!isHeader ? 'text-[12px] text-zinc-500' : ''),
        className
      )}
      onClick={onClick}
    >
      {/* Nome com Expand/Collapse Moderno */}
      <div className={cn(
        "flex items-center gap-3 overflow-hidden h-full transition-colors relative",
        isHeader ? "text-white font-black" : "group-hover:text-rodovia-azul",
        level === 1 ? 'pl-8' : level === 2 ? 'pl-16' : 'pl-24',
        // Sticky logic for Annual View
        timePerspective === 'year' && "sticky left-0 border-r border-zinc-100/50 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.05)]",
        // Background logic to prevent transparency issues during scroll
        timePerspective === 'year' && !isHeader && !isTotal && !isSubtotal && "bg-white group-hover:bg-zinc-50 z-20",
        timePerspective === 'year' && isSubtotal && !isHeader && "bg-zinc-100 z-20",
        timePerspective === 'year' && isTotal && "bg-rodovia-azul z-20",
        timePerspective === 'year' && isHeader && "bg-rodovia-azul z-50"
      )}>
        {/* Indicador de Subtotal (Barra lateral) - Movido para dentro do sticky */}
        {isSubtotal && !isHeader && !isTotal && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rodovia-verde" />
        )}

        {hasChildren && !isHeader && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
            className={cn(
              "w-5 h-5 flex items-center justify-center rounded-md shadow-sm",
              isExpanded ? "bg-rodovia-azul text-white rotate-180" : "bg-white text-zinc-400 border border-zinc-200 hover:border-rodovia-azul hover:text-rodovia-azul"
            )}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
        {!hasChildren && !isHeader && <div className="w-5" />}
        <span className={cn(
          "truncate tracking-tight",
          isSubtotal && !isHeader ? "text-rodovia-azul uppercase font-black" : "",
          isHeader ? "text-[11px]" : ""
        )}>
          {name}
        </span>
      </div>
      
      {/* Valores Dinâmicos */}
      {isHeader ? (
        <>
          {labels?.map((label, idx) => (
            <div key={idx} className="text-right font-black text-white px-2 leading-tight">
              {label}
            </div>
          ))}
        </>
      ) : (
        <>
          {(timePerspective === 'month' || isComparisonMode) ? (
            <>
              {/* Layout para Mês ou Comparação: P1, P2, AH, AV */}
              {/* 1. Mês Atual / P1 */}
              <div 
                className={cn(
                  "text-right font-mono font-bold px-2 transition-all",
                  isSubtotal ? "text-rodovia-azul text-[13px]" : "text-zinc-700",
                  values && values[0] > 0 ? "text-emerald-700" : values && values[0] < 0 ? "text-red-700" : "",
                  onValueClick && !isTotal && "cursor-pointer hover:bg-black/5 hover:scale-105 active:scale-95 rounded"
                )}
                onClick={(e) => {
                  if (onValueClick && !isTotal) {
                    e.stopPropagation();
                    onValueClick(0, values?.[0] || 0);
                  }
                }}
              >
                {values?.[0]?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </div>

              {/* 2. Anterior */}
              <div 
                className={cn(
                  "text-right font-mono font-bold px-2 transition-all",
                  isSubtotal ? "text-rodovia-azul text-[13px]" : "text-zinc-700",
                  values && values[1] > 0 ? "text-emerald-700" : values && values[1] < 0 ? "text-red-700" : "",
                  onValueClick && !isTotal && "cursor-pointer hover:bg-black/5 hover:scale-105 active:scale-95 rounded"
                )}
                onClick={(e) => {
                  if (onValueClick && !isTotal) {
                    e.stopPropagation();
                    onValueClick(1, values?.[1] || 0);
                  }
                }}
              >
                {values?.[1]?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </div>

              {/* 3. Variação (AH) */}
              <div className={cn(
                "text-right font-mono flex items-center justify-end gap-1 font-black px-2.5 rounded-lg py-1 text-[11px]",
                variation !== undefined && variation > 0 ? 'bg-emerald-50 text-emerald-600' : variation !== undefined && variation < 0 ? 'bg-red-50 text-red-600' : 'bg-zinc-50 text-zinc-400'
              )}>
                {variation !== undefined && variation !== 0 && (variation > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />)}
                {variation !== undefined && variation !== 0 ? `${Math.abs(variation).toFixed(1)}%` : "-"}
              </div>

              {/* 4. Análise Vertical (AV) */}
              <div className={cn(
                "text-right font-mono flex items-center justify-end font-black px-2.5 rounded-lg py-1 text-[11px]",
                av !== undefined && av > 0 ? "bg-emerald-50 text-emerald-600" : av !== undefined && av < 0 ? "bg-red-50 text-red-600" : "bg-zinc-50 text-zinc-400"
              )}>
                {av !== undefined ? `${av.toFixed(1)}%` : "-"}
              </div>
            </>
          ) : (
            <>
              {/* Layout Padrão para outras perspectivas (Sem AH/AV) */}
              {values?.map((val, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "text-right font-mono font-bold px-2 transition-all",
                    isSubtotal ? "text-rodovia-azul text-[13px]" : "text-zinc-700",
                    val > 0 ? "text-emerald-700" : val < 0 ? "text-red-700" : "",
                    onValueClick && !isTotal && "cursor-pointer hover:bg-black/5 hover:scale-105 active:scale-95 rounded"
                  )}
                  onClick={(e) => {
                    if (onValueClick && !isTotal) {
                      e.stopPropagation();
                      onValueClick(idx, val);
                    }
                  }}
                >
                  {val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};

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
  avDetail
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
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const variation = previousValue !== 0 ? ((value - previousValue) / Math.abs(previousValue)) * 100 : 0;
  const isPositive = variation >= 0;
  const isNegative = value < 0;

  // Define a variante de cor para o ícone
  const variant = isNegative ? 'danger' : (highlight ? 'success' : 'info');

  return (
    <div className="relative h-[220px] lg:h-[240px] xl:h-[260px] w-full [perspective:1000px]">
      <motion.div
        className="w-full h-full relative [transform-style:preserve-3d] cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Side */}
        <div 
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] p-3 sm:p-4 lg:p-6 rounded-2xl border flex flex-col h-full overflow-hidden",
            "bg-white border-black/[0.03] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)]",
            highlight && !isNegative && "ring-2 ring-rodovia-verde/20 border-rodovia-verde/10",
            isNegative && "ring-2 ring-red-500/10 border-red-500/20 shadow-red-500/5"
          )}
        >
          {/* Background Ghosted Icon */}
          <KPIIcon icon={Icon} variant={variant} />

          {/* Variação Badge */}
          <div className={cn(
            "absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-mono font-black shadow-sm",
            isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {isPositive ? <TrendingUp className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" /> : <TrendingDown className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />}
            {Math.abs(variation).toFixed(1)}%
          </div>

          {/* Title Centered with Padding */}
          <div className="flex flex-col items-center text-center gap-0.5 sm:gap-1 relative z-10 mb-2 sm:mb-4 mt-4 sm:mt-8">
            <div className="space-y-0.5 sm:space-y-1">
              <span className={cn(
                "block font-mono text-[9px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.25em] transition-colors leading-tight",
                isNegative ? "text-red-600" : "text-zinc-800 group-hover:text-rodovia-azul"
              )}>
                {label}
              </span>
              <p className="text-[8px] sm:text-[10px] text-zinc-500 font-bold italic leading-tight max-w-[140px] sm:max-w-[200px] mx-auto opacity-80 line-clamp-2">
                {storytelling}
              </p>
            </div>
          </div>

          {/* Main Value & Progress */}
          <div className="mt-auto relative z-10 flex flex-col items-center w-full">
            <h3 className={cn(
              "text-[16px] sm:text-[18px] lg:text-[20px] xl:text-[22px] font-mono font-black tracking-tighter leading-none mb-2 sm:mb-4 whitespace-nowrap",
              isNegative ? "text-red-600" : (highlight ? "text-rodovia-verde" : "text-rodovia-azul")
            )}>
              {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </h3>
            
            <div className="w-full space-y-1 sm:space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[8px] sm:text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest truncate mr-1">% s/ Venda</span>
                <span className={cn("text-[9px] sm:text-[11px] font-mono font-black", isNegative ? "text-red-600" : "text-zinc-900")}>{av.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 sm:h-2.5 w-full bg-zinc-100/80 rounded-full overflow-hidden border border-black/[0.02]">
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

          <div className={cn(
            "absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full blur-3xl",
            isNegative ? "bg-red-50/50" : "bg-zinc-50"
          )} />
        </div>

        {/* Back Side */}
        <div 
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] p-6 rounded-2xl border flex flex-col h-full items-center text-center",
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
                <span className="text-[9px] font-mono font-black text-rodovia-verde uppercase tracking-[0.3em]">Peso s/ Venda</span>
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

const YEARS = ["2024", "2025", "2026"];

const ModernSelect = ({ 
  value, 
  onChange, 
  options, 
  label,
  variant = "azul" 
}: { 
  value: string | number, 
  onChange: (val: any) => void, 
  options: { label: string, value: any }[],
  label: string,
  variant?: "azul" | "verde"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative flex-1 group">
      <label className={cn(
        "absolute -top-2 left-3 px-1.5 text-[8px] font-black uppercase tracking-widest z-10 rounded-full bg-white",
        variant === "azul" ? "text-rodovia-azul" : "text-rodovia-verde"
      )}>
        {label}
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 px-4 rounded-xl flex items-center justify-between transition-all duration-300 border text-xs font-bold",
          isOpen 
            ? (variant === "azul" ? "border-rodovia-azul ring-2 ring-rodovia-azul/10 bg-white" : "border-rodovia-verde ring-2 ring-rodovia-verde/10 bg-white")
            : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 shadow-sm"
        )}
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 ml-2 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.98 }}
              className="absolute top-full mt-1.5 w-full bg-white rounded-xl border border-zinc-100 shadow-xl z-40 overflow-hidden py-1 max-h-60 overflow-y-auto"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2 text-left text-[11px] font-bold transition-colors hover:bg-zinc-50",
                    value === opt.value 
                      ? (variant === "azul" ? "text-rodovia-azul bg-rodovia-azul/5" : "text-rodovia-verde bg-rodovia-verde/5")
                      : "text-zinc-500"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ComparisonPanel = ({ 
  p1, p2, setP1, setP2, timePerspective, onClose 
}: { 
  p1: any, p2: any, setP1: any, setP2: any, timePerspective: string, onClose: () => void 
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white p-5 rounded-[2rem] border border-black/[0.05] shadow-[0_15px_50px_-15px_rgba(0,0,0,0.08)] mb-8 relative"
    >
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* P1 Section */}
        <div className="flex-1 w-full flex items-center gap-4">
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-full bg-rodovia-azul/10 flex items-center justify-center">
              <span className="text-[10px] font-black text-rodovia-azul">01</span>
            </div>
            <span className="text-[8px] font-black text-zinc-400 uppercase">Ref</span>
          </div>
          
          <div className="flex-1 flex gap-3">
            <ModernSelect 
              label="Ano"
              value={p1.year}
              onChange={(val) => setP1({ ...p1, year: val })}
              options={YEARS.map(y => ({ label: y, value: y }))}
              variant="azul"
            />
            {timePerspective !== 'year' && (
              <ModernSelect 
                label={timePerspective === 'month' ? 'Mês' : timePerspective.charAt(0).toUpperCase() + timePerspective.slice(1)}
                value={p1.value}
                onChange={(val) => setP1({ ...p1, value: val })}
                options={options}
                variant="azul"
              />
            )}
          </div>
        </div>

        {/* Central Icon */}
        <div className="shrink-0">
          <div className="w-10 h-10 rounded-xl bg-rodovia-verde/10 flex items-center justify-center border border-rodovia-verde/20">
            <ArrowRightLeft className="w-4 h-4 text-rodovia-verde" />
          </div>
        </div>

        {/* P2 Section */}
        <div className="flex-1 w-full flex items-center gap-4">
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-full bg-rodovia-verde/10 flex items-center justify-center">
              <span className="text-[10px] font-black text-rodovia-verde">02</span>
            </div>
            <span className="text-[8px] font-black text-zinc-400 uppercase">Base</span>
          </div>
          
          <div className="flex-1 flex gap-3">
            <ModernSelect 
              label="Ano"
              value={p2.year}
              onChange={(val) => setP2({ ...p2, year: val })}
              options={YEARS.map(y => ({ label: y, value: y }))}
              variant="verde"
            />
            {timePerspective !== 'year' && (
              <ModernSelect 
                label={timePerspective === 'month' ? 'Mês' : timePerspective.charAt(0).toUpperCase() + timePerspective.slice(1)}
                value={p2.value}
                onChange={(val) => setP2({ ...p2, value: val })}
                options={options}
                variant="verde"
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function DREDashboard() {
  const [searchParams] = useSearchParams();
  const { contas, loading: loadingContas } = useContas();
  const { categoriasDRE, subcategoriasDRE, loading: loadingDominios } = useDominios();
  
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isAnnualView, setIsAnnualView] = useState(false);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [compP1, setCompP1] = useState<{ value: string | number; year: string }>({ value: searchParams.get("month") || "Jan", year: searchParams.get("period") || "2026" });
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

  const year = searchParams.get("period") || "2026";
  const monthLabel = searchParams.get("month") || "Jan";

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

  useEffect(() => {
    if (timePerspective === 'year') {
      setIsAnnualView(true);
      setIsComparisonMode(false);
    } else {
      setIsAnnualView(false);
    }
  }, [timePerspective]);
  
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
        const startYear = Math.min(parseInt(compP1.year), parseInt(compP2.year));
        const endYear = Math.max(parseInt(compP1.year), parseInt(compP2.year));
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
      if (['bimestre', 'trimestre', 'semestre', 'year'].includes(timePerspective)) {
        start = startOfYear(date);
        end = endOfYear(date);
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
      return [getPeriodLabel(compP1), getPeriodLabel(compP2), 'AH %', 'AV %'];
    }

    switch (timePerspective) {
      case 'month': {
        return [`${monthLabel}/${year.slice(-2)}`, 'Anterior', 'AH %', 'AV %'];
      }
      case 'bimestre': return ['1º Bim', '2º Bim', '3º Bim', '4º Bim', '5º Bim', '6º Bim', 'Total'];
      case 'trimestre': return ['1º Tri', '2º Tri', '3º Tri', '4º Tri', 'Total'];
      case 'semestre': return ['1º Semestre', '2º Semestre', 'Total'];
      case 'year': return MONTH_LABELS;
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
      if (timePerspective === 'bimestre') numCols = 7; // 6 bimestres + total
      if (timePerspective === 'trimestre') numCols = 5; // 4 trimestres + total
      if (timePerspective === 'semestre') numCols = 3; // 2 semestres + total
      if (timePerspective === 'year') numCols = 12; // 12 meses
    }

    const getColIndex = (dateStr: string) => {
      const date = new Date(dateStr);
      const m = date.getMonth();
      const y = date.getFullYear();

      if (isComparisonMode) {
        if (timePerspective === 'month') {
          if (y === parseInt(compP1.year) && m === MONTH_MAP[compP1.value as string]) return 0;
          if (y === parseInt(compP2.year) && m === MONTH_MAP[compP2.value as string]) return 1;
        } else if (timePerspective === 'year') {
          if (y === parseInt(compP1.year)) return 0;
          if (y === parseInt(compP2.year)) return 1;
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

      const targetY = parseInt(year);
      if (timePerspective === 'month') {
        const targetM = MONTH_MAP[monthLabel];
        if (y === targetY && m === targetM) return 0;
        if (y === targetY && m === targetM - 1) return 1;
        if (targetM === 0 && y === targetY - 1 && m === 11) return 1;
        return -1;
      }
      if (y !== targetY) return -1;

      switch (timePerspective) {
        case 'bimestre': return Math.floor(m / 2);
        case 'trimestre': return Math.floor(m / 3);
        case 'semestre': return Math.floor(m / 6);
        case 'year': return m;
        default: return -1;
      }
    };

    const subcatValues = new Map<string, number[]>();
    movimentos.forEach(mov => {
      const config = configMap.get(mov.concod);
      const subcatId = config?.dre_subcategoria_id || 'nao_definido';
      
      const valor = (mov.valor || 0); 
      const colIdx = getColIndex(mov.data);

      if (colIdx !== -1) {
        if (!subcatValues.has(subcatId)) subcatValues.set(subcatId, new Array(numCols).fill(0));
        subcatValues.get(subcatId)![colIdx] += valor;
        
        // Adiciona ao total anual se necessário
        if (!isComparisonMode && ['bimestre', 'trimestre', 'semestre'].includes(timePerspective)) {
          const totalIdx = numCols - 1;
          subcatValues.get(subcatId)![totalIdx] += valor;
        }
      }
    });

    const catValuesMap = new Map<string, number[]>();
    const finalResult: any[] = [];

    // Primeiro passo: Categorias CONTA
    dreCategorias.forEach(cat => {
      if (cat.tipo === 'CONTA') {
        const subcats = subcategoriasDRE.filter(s => s.categoria_id === cat.id);
        const catValuesAbsolute = new Array(numCols).fill(0);
        const catValuesSigned = new Array(numCols).fill(0);

        const subcatRows = subcats.map(sub => {
          const valsAbs = subcatValues.get(sub.id) || new Array(numCols).fill(0);
          
          // Tenta descobrir o sinal médio dessa subcategoria a partir das contas
          const sampleConta = contas.find(c => c.dre_subcategoria_id === sub.id);
          const sinal = sampleConta?.dre_sinal ?? 1;
          
          const valsSigned = valsAbs.map(v => v * sinal);
          
          valsAbs.forEach((v, i) => catValuesAbsolute[i] += v);
          valsSigned.forEach((v, i) => catValuesSigned[i] += v);
          
          return { id: sub.id, name: sub.nome, values: valsSigned, level: 2, tipo: 'CONTA' };
        });
        
        // Mapeia tanto pelo nome quanto pela ordem (para fórmulas) - SEMPRE ABSOLUTO
        catValuesMap.set(cat.nome.trim(), catValuesAbsolute);
        catValuesMap.set(cat.ordem.toString(), catValuesAbsolute);
        
        finalResult.push({ ...cat, values: catValuesSigned, subcategories: subcatRows, level: 1 });
      }
    });

    // Segundo passo: SUBTOTALs (Respeitando a ordem para dependências de fórmulas)
    dreCategorias.filter(c => c.tipo === 'SUBTOTAL').forEach(cat => {
      const catValues = resolveFormulaMulti(cat.formula || '', catValuesMap);
      
      // Mapeia o resultado do subtotal também (para fórmulas que dependem de subtotais)
      catValuesMap.set(cat.nome.trim(), catValues);
      catValuesMap.set(cat.ordem.toString(), catValues);
      
      const row = { ...cat, values: catValues, subcategories: [], level: 1 };
      
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
      const isMultiPeriod = !isComparisonMode && ['bimestre', 'trimestre', 'semestre'].includes(timePerspective);
      if (isMultiPeriod) avBaseIdx = numCols - 1;
      const avBase = Math.abs(receitaBruta[avBaseIdx]) || 1;

      // Calcula AV e AH para as subcategorias
      const subcategoriesWithMetrics = row.subcategories?.map((sub: any) => {
        const subP1Val = sub.values[0] || 0;
        const subP2Val = sub.values[1] || 0;
        
        let variation = 0;
        if (isComparisonMode) {
          if (isP1AfterP2) {
             // P1 é mais recente: (P1 - P2) / P2
             variation = subP2Val !== 0 ? ((subP1Val - subP2Val) / Math.abs(subP2Val)) * 100 : 0;
          } else {
             // P2 é mais recente: (P2 - P1) / P1
             variation = subP1Val !== 0 ? ((subP2Val - subP1Val) / Math.abs(subP1Val)) * 100 : 0;
          }
        } else {
          variation = subP2Val !== 0 ? ((subP1Val - subP2Val) / Math.abs(subP2Val)) * 100 : 0;
        }

        return {
          ...sub,
          variation,
          av: (sub.values[avBaseIdx] / avBase) * 100
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
        av: (row.values[avBaseIdx] / avBase) * 100
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

  const handleRowClick = (name: string, value: number, variation: number, code: string) => {
    setSelectedItem({
      title: name,
      value: value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      change: variation,
      description: `Análise detalhada de ${name} referente ao período de ${monthLabel}/${year}.`,
      details: [
        { label: "Realizado", value: value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), trend: value >= 0 ? "up" : "down" as const },
      ]
    });
  };

  const isLoading = loadingContas || loadingDominios || loadingMov;

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

    return [
      { 
        label: "Receita Bruta", 
        value: getVal("Receita Bruta"), 
        previousValue: getPrev("Receita Bruta"),
        av: getAV("Receita Bruta"), 
        icon: BarChart3,
        storytelling: "Volume total de vendas e fretes realizados",
        calculationDetail: "Soma de todos os recebimentos brutos de fretes e vendas de mercadorias, antes de qualquer dedução ou imposto.",
        avDetail: "Como base do DRE, representa 100% da operação. Todos os outros pesos são calculados em relação a este valor."
      },
      { 
        label: "Receita Líquida", 
        value: getVal("Receita Líquida"), 
        previousValue: getPrev("Receita Líquida"),
        av: getAV("Receita Líquida"), 
        icon: TrendingUp,
        storytelling: "Faturamento real após impostos e deduções",
        calculationDetail: "Receita Bruta menos as deduções (Impostos sobre vendas, devoluções e cancelamentos).",
        avDetail: "Representa quanto do faturamento bruto realmente entra para a empresa após as obrigações tributárias iniciais."
      },
      { 
        label: "Margem Bruta", 
        value: getVal("Margem Bruta"), 
        previousValue: getPrev("Margem Bruta"),
        av: getAV("Margem Bruta"), 
        icon: BarChart3,
        storytelling: "Eficiência direta da operação de transporte",
        calculationDetail: "Receita Líquida menos os Custos Diretos (Custo Fixo + Custo Variável da operação).",
        avDetail: "Indica a lucratividade direta da operação antes de considerar as despesas administrativas e de vendas."
      },
      { 
        label: "Margem de Contribuição", 
        value: getVal("Margem de Contribuição"), 
        previousValue: getPrev("Margem de Contribuição"),
        av: getAV("Margem de Contribuição"), 
        icon: BarChart3,
        storytelling: "O que sobra para pagar os custos fixos e gerar lucro",
        calculationDetail: "Margem Bruta menos as Despesas Variáveis (comissões, taxas de cartão, etc).",
        avDetail: "É o valor que 'sobra' para cobrir as despesas fixas da empresa e gerar o lucro final."
      },
      { 
        label: "EBITDA", 
        value: getVal("EBITDA"), 
        previousValue: getPrev("EBITDA"),
        av: getAV("EBITDA"), 
        icon: TrendingUp,
        storytelling: "Potencial de geração de caixa operacional",
        calculationDetail: "Margem de Contribuição menos as Despesas Fixas Operacionais.",
        avDetail: "Mede a capacidade de geração de caixa apenas pela operação, desconsiderando impostos e efeitos financeiros."
      },
      { 
        label: "Despesas Operacionais", 
        value: getVal("Despesas Operacionais"), 
        previousValue: getPrev("Despesas Operacionais"),
        av: getAV("Despesas Operacionais"), 
        icon: Layers,
        storytelling: "Custo para manter a estrutura funcionando",
        calculationDetail: "Soma de todas as Despesas Fixas e Variáveis administrativas da empresa.",
        avDetail: "Mostra o peso da estrutura administrativa e comercial em relação ao faturamento total."
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
        avDetail: "É a Lucratividade Final. Indica quantos centavos de cada Real vendido realmente sobraram como lucro."
      },
    ];
  }, [dreData]);

  return (
    <div className="space-y-6 pb-20">
      <AnimatePresence>
        {isLoading && <DRELoadingScreen />}
      </AnimatePresence>

      <AssessorSheet 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        data={selectedItem} 
      />

      {/* Modern Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-black/[0.03] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] relative overflow-hidden">
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

        <div className="flex flex-wrap items-center gap-4 relative z-10">
          {/* Segmented Control: Perspectiva */}
          <div className="flex items-center bg-zinc-100/80 p-1 rounded-[1.25rem] border border-black/5 backdrop-blur-md shadow-inner">
            {(['month', 'bimestre', 'trimestre', 'semestre'] as TimePerspective[]).map((p) => (
              <button
                key={p}
                onClick={() => setTimePerspective(p)}
                className={cn(
                  "relative px-5 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase transition-all duration-300 tracking-wider",
                  timePerspective === p 
                    ? "text-white bg-rodovia-verde shadow-[0_4px_12px_-2px_rgba(16,185,129,0.4)] border border-emerald-400/20" 
                    : "text-zinc-500 hover:text-rodovia-azul hover:bg-black/5"
                )}
              >
                <span className="relative z-10">{p === 'month' ? 'Mês' : p}</span>
              </button>
            ))}
          </div>

          {/* Toggle: Visão Anual */}
          <button
            onClick={() => setTimePerspective(isAnnualView ? 'month' : 'year')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-mono text-[10px] font-black uppercase tracking-widest transition-all duration-500",
              isAnnualView 
                ? "bg-rodovia-azul text-white shadow-[0_10px_25px_-5px_rgba(15,23,42,0.3)] ring-4 ring-rodovia-azul/10" 
                : "bg-white text-zinc-500 border border-black/5 hover:border-rodovia-azul/30 hover:bg-zinc-50 shadow-sm"
            )}
          >
            <CalendarRange className={cn("w-4 h-4 transition-transform duration-500", isAnnualView && "rotate-12")} />
            {isAnnualView ? "Visão Anual Ativa" : "Mudar p/ Anual"}
          </button>

          {/* Toggle: Comparar Períodos */}
          {!isAnnualView && (
            <button
              onClick={() => setIsComparisonMode(!isComparisonMode)}
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-mono text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                isComparisonMode
                  ? "bg-rodovia-verde text-white shadow-[0_10px_25px_-5px_rgba(16,185,129,0.3)] ring-4 ring-rodovia-verde/10"
                  : "bg-white text-zinc-500 border border-black/5 hover:border-rodovia-verde/30 hover:bg-zinc-50 shadow-sm"
              )}
            >
              <ArrowRightLeft className={cn("w-4 h-4 transition-transform duration-500", isComparisonMode && "rotate-180")} />
              {isComparisonMode ? "Comparação Ativa" : "Comparar Períodos"}
            </button>
          )}

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
            onClose={() => setIsComparisonMode(false)}
          />
        )}
      </AnimatePresence>

      {/* Strategic KPIs Section */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4 lg:gap-5">
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
          />
        ))}
      </section>

      {/* Professional DRE Table */}
      <section className="bg-white border border-black/[0.03] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden">
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
            timePerspective === 'year' && "max-w-[94vw] mx-auto"
          )}>
            <div className={cn(
              "pb-4",
              timePerspective === 'bimestre' && "min-w-[1400px]",
              timePerspective === 'trimestre' && "min-w-[1200px]",
              timePerspective === 'semestre' && "min-w-[1000px]",
              timePerspective === 'year' && "min-w-[1800px]"
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
                        hasChildren={hasChildren}
                        isExpanded={isExpanded}
                        tipo={cat.tipo}
                        timePerspective={timePerspective}
                        isComparisonMode={isComparisonMode}
                        onToggle={() => toggleRow(cat.id)}
                        onClick={() => hasChildren ? undefined : handleRowClick(cat.nome, cat.values[0], cat.variation, cat.id)}
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
                          level={2}
                          tipo="CONTA"
                          timePerspective={timePerspective}
                          isComparisonMode={isComparisonMode}
                          onClick={() => handleRowClick(sub.name, sub.values[0], sub.variation, sub.id)}
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


