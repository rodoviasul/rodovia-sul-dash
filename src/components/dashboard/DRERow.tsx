import React, { useMemo } from "react";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimePerspective = 'month' | 'bimestre' | 'trimestre' | 'semestre' | 'year' | 'multi-year';

interface DRERowProps {
  id: string;
  name: string;
  values?: number[];
  labels?: string[];
  variation?: number;
  av?: number;
  monthlyAV?: number[];
  monthlyAH?: number[];
  level?: number;
  isHeader?: boolean;
  isTotal?: boolean;
  isExpanded?: boolean;
  hasChildren?: boolean;
  tipo?: 'CONTA' | 'SUBTOTAL';
  timePerspective?: TimePerspective;
  isComparisonMode?: boolean;
  showAH?: boolean;
  showAV?: boolean;
  className?: string;
  onToggle?: () => void;
  onClick?: () => void;
  onValueClick?: (colIndex: number, value: number) => void;
}

export const DRERow = ({
  id,
  name,
  values,
  labels,
  variation,
  av,
  monthlyAV,
  monthlyAH,
  level = 1,
  isHeader = false,
  isTotal = false,
  isExpanded = false,
  hasChildren = false,
  tipo = 'CONTA',
  timePerspective = 'month',
  isComparisonMode = false,
  showAH = true,
  showAV = true,
  className,
  onToggle,
  onClick,
  onValueClick
}: DRERowProps) => {
  const isSubtotal = tipo === 'SUBTOTAL';

  // Define o grid dinamicamente baseado na perspectiva
  const gridClass = useMemo(() => {
    if (isComparisonMode) return "grid-cols-[420px_140px_140px_100px_100px_minmax(300px,1fr)]";

    switch (timePerspective) {
      case 'month': return "grid-cols-[minmax(420px,3fr)_140px_140px_100px_100px]";
      case 'bimestre': return "grid-cols-[420px_repeat(6,minmax(200px,1fr))_140px]";
      case 'trimestre': return "grid-cols-[420px_repeat(4,minmax(280px,1fr))_140px]";
      case 'semestre': return "grid-cols-[420px_repeat(2,minmax(240px,1fr))_140px]";
      case 'year': return "grid-cols-[420px_repeat(12,minmax(240px,1fr))_140px]";
      case 'multi-year': return undefined; // Handled by inline style
      default: return "grid-cols-12";
    }
  }, [timePerspective, isComparisonMode]);

  const gridStyle = useMemo(() => {
    if (timePerspective === 'multi-year' && !isComparisonMode) {
      const count = (labels?.length || values?.length || 8) - 1;
      return {
        gridTemplateColumns: `420px repeat(${Math.max(1, count)}, minmax(240px, 1fr)) 140px`
      };
    }
    return {};
  }, [timePerspective, isComparisonMode, labels, values]);

  return (
    <div
      className={cn(
        "grid items-center border-b border-zinc-100 relative min-h-[40px]",
        (timePerspective === 'month' || isComparisonMode) && "pr-8",
        gridClass,
        isHeader ? 'bg-rodovia-azul font-mono text-[11px] uppercase tracking-widest text-white sticky top-0 z-40 h-12' : (isTotal ? '' : cn('hover:bg-zinc-50/80 group', onClick && 'cursor-pointer')),
        isSubtotal && !isHeader ? 'bg-zinc-100/90 font-black border-y border-zinc-200/50' : '',
        isTotal ? 'bg-rodovia-azul text-white font-black' : '',
        level === 1 && !isHeader ? 'text-[14px] text-zinc-900' : (!isHeader ? 'text-[12px] text-zinc-500' : ''),
        className
      )}
      style={gridStyle}
      onClick={onClick}
    >
      {/* Nome com Expand/Collapse Moderno */}
      <div className={cn(
        "flex items-center gap-3 overflow-hidden h-full transition-colors relative",
        isHeader ? "text-white font-black" : "group-hover:text-rodovia-azul",
        level === 1 ? 'pl-8' : level === 2 ? 'pl-16' : 'pl-24',
        // Sticky logic for Annual View
        timePerspective !== 'month' && !isComparisonMode && "sticky left-0 border-r border-zinc-100/50 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.05)]",
        // Background logic to prevent transparency issues during scroll
        timePerspective !== 'month' && !isComparisonMode && !isHeader && !isTotal && !isSubtotal && "bg-white group-hover:bg-zinc-50 z-20",
        timePerspective !== 'month' && !isComparisonMode && isSubtotal && !isHeader && "bg-zinc-100 z-20",
        timePerspective !== 'month' && !isComparisonMode && isTotal && "bg-rodovia-azul z-20",
        timePerspective !== 'month' && !isComparisonMode && isHeader && "bg-rodovia-azul z-50"
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
            <div
              key={idx}
              className={cn(
                "font-black text-white px-2 leading-tight flex flex-col justify-center h-full",
                // Se não for comparação e não for mensal (ou seja, Trimestral/Semestral/Anual), centraliza
                // OU se for a última coluna (Análise Sintética) no modo comparação, centraliza também
                (timePerspective !== 'month' && !isComparisonMode) || (isComparisonMode && idx === labels.length - 1)
                  ? "text-center"
                  : "text-right",
                timePerspective !== 'month' && !isComparisonMode && idx === labels.length - 1 && "text-rodovia-verde border-l border-white/20 pl-4" // Destaque no header do Total com borda
              )}
            >
              <span>{label}</span>
              {timePerspective !== 'month' && !isComparisonMode && (
                <div className={cn(
                  "w-full mt-1 pt-1 border-t border-white/20 opacity-80 font-mono gap-1",
                  idx === labels.length - 1 ? "grid grid-cols-1" : (showAH && showAV ? "grid grid-cols-3" : (showAH || showAV ? "grid grid-cols-2" : "grid grid-cols-1"))
                )}>
                  <div className="text-right">R$</div>
                  {idx !== labels.length - 1 && showAH && <div className="text-right">AH%</div>}
                  {idx !== labels.length - 1 && showAV && <div className="text-right">AV%</div>}
                </div>
              )}
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

              {/* 5. Análise Descritiva (Comparativo) */}
              {isComparisonMode && (
                <div className="px-2 py-1 flex items-center justify-center h-full">
                  {(() => {
                    if (variation === undefined || variation === 0) return <span className="text-zinc-300 text-[10px]">-</span>;

                    const isPositive = variation > 0;
                    const absVar = Math.abs(variation);

                    // Definição de Cores e Textos (Storytelling Executivo)
                    let text = "";
                    let colorMain = "";
                    let strokeColor = "";

                    if (absVar < 2) {
                      text = "Estabilidade";
                      colorMain = "text-zinc-500";
                      strokeColor = "#71717a"; // zinc-500
                    } else if (isPositive) {
                      if (absVar > 20) { text = "Performance Excepcional"; colorMain = "text-emerald-700"; strokeColor = "#047857"; }
                      else if (absVar > 10) { text = "Crescimento Sólido"; colorMain = "text-emerald-600"; strokeColor = "#059669"; }
                      else { text = "Viés Positivo"; colorMain = "text-emerald-600"; strokeColor = "#10b981"; }
                    } else {
                      if (absVar > 20) { text = "Atenção Crítica"; colorMain = "text-red-700"; strokeColor = "#b91c1c"; }
                      else if (absVar > 10) { text = "Desaceleração"; colorMain = "text-red-600"; strokeColor = "#dc2626"; }
                      else { text = "Viés Negativo"; colorMain = "text-amber-600"; strokeColor = "#d97706"; }
                    }

                    // Mini Sparkline SVG
                    const width = 40;
                    const height = 20;
                    const padding = 4;

                    const yStart = isPositive ? height - padding : padding;
                    const yEnd = isPositive ? padding : height - padding;

                    const yFlat = height / 2;

                    const y1 = absVar < 2 ? yFlat : yStart;
                    const y2 = absVar < 2 ? yFlat : yEnd;

                    return (
                      <div className="flex items-center gap-3 px-2 py-1 w-full justify-center">
                        {/* Área do Gráfico Sparkline */}
                        <div className="relative w-[32px] h-[16px] shrink-0 opacity-80">
                          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                            <defs>
                              <linearGradient id={`grad-${id}-${isPositive}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
                                <stop offset="100%" stopColor={strokeColor} stopOpacity="1" />
                              </linearGradient>
                            </defs>

                            <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#e4e4e7" strokeWidth="1" strokeDasharray="2 2" />

                            <path
                              d={`M 0 ${y1} C ${width * 0.4} ${y1}, ${width * 0.6} ${y2}, ${width} ${y2}`}
                              fill="none"
                              stroke={`url(#grad-${id}-${isPositive})`}
                              strokeWidth="2"
                              strokeLinecap="round"
                            />

                            <circle cx={width} cy={y2} r="2" fill={strokeColor} />
                          </svg>
                        </div>

                        {/* Conteúdo Textual */}
                        <div className="flex flex-col leading-tight overflow-hidden text-left min-w-[110px]">
                          <span className={cn("text-[10px] font-black uppercase tracking-wide truncate", colorMain)}>
                            {text}
                          </span>
                          <span className={cn("text-[9px] font-bold truncate mt-0.5", isPositive ? "text-emerald-600/70" : "text-red-600/70")}>
                            {absVar < 2 ? "Variação mínima" : `${isPositive ? '+' : ''}${variation.toFixed(1)}% vs. anterior`}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Layout Anual/Agrupado Detalhado (Valor, AH, AV por período) */}
              {values?.map((val, idx) => {
                const curAH = monthlyAH?.[idx] || 0;
                const curAV = monthlyAV?.[idx] || 0;
                const isTotalCol = idx === (values.length - 1);

                return (
                  <div key={idx} className={cn(
                    "h-full flex flex-col justify-center px-1 relative",
                    idx % 2 !== 0 && !isSubtotal && !isTotal && "bg-zinc-50/30",
                    isTotalCol && "border-l-2 border-l-zinc-300 bg-zinc-50/50 pl-2", // Total
                    onValueClick && !isTotal && "cursor-pointer hover:bg-black/5 transition-colors"
                  )}
                    onClick={(e) => {
                      if (onValueClick && !isTotal) {
                        e.stopPropagation();
                        onValueClick(idx, val);
                      }
                    }}
                  >
                    {/* Custom Separator (Linha Azul Menor) */}
                    {!isTotalCol && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[60%] w-[2px] bg-rodovia-azul/60 pointer-events-none" />
                    )}

                    <div className={cn(
                      "grid gap-1 items-center w-full",
                      isTotalCol ? "grid-cols-1" : (showAH && showAV ? "grid-cols-3" : (showAH || showAV ? "grid-cols-2" : "grid-cols-1"))
                    )}>
                      {/* Valor */}
                      <div className={cn(
                        "text-right font-mono font-bold whitespace-nowrap overflow-hidden text-ellipsis",
                        isTotalCol ? "text-[12px] sm:text-[13px] pr-4" : "text-[11px] sm:text-[12px]",
                        isSubtotal ? "text-rodovia-azul" : "text-zinc-700",
                        val > 0 ? "text-emerald-700" : val < 0 ? "text-red-700" : ""
                      )}>
                        {val !== 0 ? val.toLocaleString('pt-BR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "-"}
                      </div>

                      {/* AH - Apenas se não for Total */}
                      {!isTotalCol && showAH && (
                        <div className={cn(
                          "flex items-center justify-end gap-1 text-right font-mono text-[10px] sm:text-[11px] font-black whitespace-nowrap overflow-hidden text-ellipsis",
                          curAH > 0 ? "text-emerald-600" : curAH < 0 ? "text-red-600" : "text-zinc-400"
                        )}>
                          {curAH !== 0 && Math.abs(curAH) < 999 ? (
                            <>
                              {curAH > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {Math.abs(curAH).toFixed(0)}%
                            </>
                          ) : "-"}
                        </div>
                      )}

                      {/* AV */}
                      {!isTotalCol && showAV && (
                        <div className={cn(
                          "text-right font-mono font-bold whitespace-nowrap overflow-hidden text-ellipsis",
                          "text-[11px] sm:text-[12px]",
                          curAV > 0 ? "text-emerald-600" : curAV < 0 ? "text-red-600" : "text-zinc-500"
                        )}>
                          {curAV !== 0 ? `${curAV.toFixed(0)}%` : "-"}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </>
      )}
    </div>
  );
};
