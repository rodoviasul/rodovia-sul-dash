import React, { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Calculator, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className={cn(
        "absolute inset-0 rounded-full blur-[80px]",
        theme.glow
      )} />
      <Icon className={cn("w-32 h-32 relative z-10 opacity-40 rotate-12", theme.icon)} />
    </div>
  );
};

interface ModernKPICardProps {
  label: string;
  value: number;
  previousValue: number;
  av?: number;
  icon: any;
  highlight?: boolean;
  storytelling?: string;
  calculationDetail?: string;
  avDetail?: string;
  formatAsCurrency?: boolean;
  avLabel?: string;
}

export const ModernKPICard = ({ 
  label, 
  value, 
  previousValue, 
  av, 
  icon: Icon, 
  highlight = false,
  storytelling,
  calculationDetail,
  avDetail,
  formatAsCurrency = true,
  avLabel = "Margem"
}: ModernKPICardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Calculate variation
  const variation = previousValue !== 0 ? ((value - previousValue) / Math.abs(previousValue)) * 100 : 0;
  const isPositive = variation >= 0;
  // For cost/expense items, negative variation might be "good", but usually in DRE positive numbers are good (Revenue, Margin, Profit).
  // If the value passed is negative (e.g. loss), we might want to flag it.
  const isNegativeValue = value < 0;

  const variant = isNegativeValue ? 'danger' : (highlight ? 'success' : 'info');

  const formatValue = (val: number) => {
    if (formatAsCurrency) {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    }
    return val.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + "%";
  };

  return (
    <div className="relative h-[200px] w-full [perspective:1000px] group">
      <motion.div
        className="w-full h-full relative [transform-style:preserve-3d] cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Side */}
        <div 
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] p-4 rounded-xl border flex flex-col h-full overflow-hidden transition-all duration-300",
            "bg-white border-zinc-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)]",
            highlight && !isNegativeValue && "ring-1 ring-emerald-500/20 border-emerald-500/10",
            isNegativeValue && "ring-1 ring-red-500/20 border-red-500/10"
          )}
        >
          <KPIIcon icon={Icon} variant={variant} />

          {/* Header */}
          <div className="w-full flex flex-col items-center relative z-10 mb-2">
            <span className={cn(
              "font-mono text-xs sm:text-sm font-black uppercase tracking-[0.2em] transition-colors text-center",
              isNegativeValue ? "text-red-600" : "text-zinc-600 group-hover:text-rodovia-azul"
            )}>
              {label}
            </span>
          </div>

          {/* Main Value */}
          <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full gap-3">
            <h3 className={cn(
              "text-2xl lg:text-3xl font-mono font-black tracking-tighter leading-none",
              isNegativeValue ? "text-red-600" : (highlight ? "text-emerald-600" : "text-rodovia-azul")
            )}>
              {formatValue(value)}
            </h3>

            {/* Trend Badge */}
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border backdrop-blur-sm",
              isPositive 
                ? "bg-emerald-50/50 text-emerald-600 border-emerald-100/50" 
                : "bg-red-50/50 text-red-600 border-red-100/50"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(variation).toFixed(1)}% vs. Mês Ant.</span>
            </div>

            {/* AV Bar if available */}
            {av !== undefined && (
              <div className="w-full max-w-[180px] mt-2 space-y-1.5">
                <div className="flex justify-between items-end px-0.5">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">{avLabel}</span>
                  <span className={cn("text-xs font-black", isNegativeValue ? "text-red-600" : "text-zinc-700")}>
                    {av.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.abs(av), 100)}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={cn(
                      "h-full rounded-full shadow-sm", 
                      isNegativeValue ? "bg-red-500" : (highlight ? "bg-emerald-500" : "bg-rodovia-azul")
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Side (Details) */}
        <div 
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] p-5 rounded-xl border flex flex-col h-full items-center text-center",
            "bg-slate-900 border-slate-800 text-white shadow-xl z-30"
          )}
        >
          <div className="flex-1 flex flex-col justify-center space-y-5 w-full">
            {calculationDetail && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-[0.2em]">O que é</span>
                </div>
                <p className="text-xs font-medium text-slate-300 leading-snug">
                  {calculationDetail}
                </p>
              </div>
            )}

            {calculationDetail && avDetail && <div className="w-12 h-px bg-white/10 mx-auto" />}

            {avDetail && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <PieChart className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-[0.2em]">Análise</span>
                </div>
                <p className="text-xs font-medium text-slate-300 leading-snug">
                  {avDetail}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
