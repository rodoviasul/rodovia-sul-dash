import React, { useState, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  ReferenceLine
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ExpensesEvolutionChartProps {
  data: any[];
}

const METRICS = [
  { id: 'custo_fixo', label: 'Custos Fixos' },
  { id: 'custo_variavel', label: 'Custos Variáveis' },
  { id: 'despesa_fixa', label: 'Despesas Fixas' },
  { id: 'despesa_variavel', label: 'Despesas Variáveis' },
];

const CustomTooltip = ({ active, payload, label, activeMetricLabel }: any) => {
  if (active && payload && payload.length) {
    let formattedLabel = label;
    try {
      if (typeof label === 'string' && label.includes('-')) {
        const [y, m] = label.split('-');
        const date = new Date(parseInt(y), parseInt(m) - 1);
        const str = format(date, 'MMM-yyyy', { locale: ptBR });
        formattedLabel = str.charAt(0).toUpperCase() + str.slice(1);
      }
    } catch (e) {
      // fallback to original label
    }

    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-2xl min-w-[200px]">
        <p className="text-slate-400 text-xs font-mono mb-2 uppercase tracking-widest border-b border-slate-800 pb-2">
          {formattedLabel}
        </p>
        <div className="space-y-3">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                {entry.name === "value" ? activeMetricLabel : "Média 12 Meses"}
              </span>
              <span className={`text-lg font-mono font-black tracking-tight ${
                entry.name === "value" ? "text-red-400" : "text-slate-400"
              }`}>
                {entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = (props: any) => {
  const { x, y, width, value } = props;
  
  if (value === 0 || value === null || value === undefined) return null;

  let formattedValue = "";
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    formattedValue = `R$ ${(value / 1000000).toFixed(2)} Mi`;
  } else if (absValue >= 1000) {
    formattedValue = `R$ ${(value / 1000).toFixed(2)} k`;
  } else {
    formattedValue = `R$ ${value.toFixed(2)}`;
  }

  // Ajuste fino para centralizar o "badge"
  const rectWidth = formattedValue.length * 7 + 10; // Largura aproximada baseada no texto
  const rectHeight = 20;
  const rectX = x + width / 2 - rectWidth / 2;
  const rectY = y - 25; // Sobe um pouco mais para dar espaço

  return (
    <g>
      <rect 
        x={rectX} 
        y={rectY} 
        width={rectWidth} 
        height={rectHeight} 
        rx={6} 
        fill="white" 
        stroke="#e2e8f0"
        strokeWidth={1}
        className="shadow-sm"
      />
      <text 
        x={x + width / 2} 
        y={rectY + 14} 
        fill="#475569" 
        textAnchor="middle" 
        fontSize={11} 
        fontWeight={800}
        fontFamily="monospace"
      >
        {formattedValue}
      </text>
    </g>
  );
};

export const ExpensesEvolutionChart = ({ data }: ExpensesEvolutionChartProps) => {
  const [activeMetric, setActiveMetric] = useState('custo_fixo');

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Calcula a média para a métrica selecionada
    // Como os valores já vem positivos da query (ABS), a média será positiva
    const total = data.reduce((acc, item) => acc + (item[activeMetric] || 0), 0);
    const avg = total / data.length;

    return data.map(item => ({
      ...item,
      value: item[activeMetric],
      media: avg
    }));
  }, [data, activeMetric]);

  const activeMetricLabel = METRICS.find(m => m.id === activeMetric)?.label || 'Despesas Fixas';

  return (
    <div className="w-full h-[400px] bg-white rounded-xl border border-zinc-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-5 md:p-6 relative overflow-hidden group flex flex-col">
      {/* Background Decor - Red theme for expenses */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all duration-1000 group-hover:bg-red-500/10" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 relative z-10 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase">
            Análise de <span className="text-red-600">{activeMetricLabel}</span>
          </h2>
          <p className="text-sm text-zinc-400 font-medium mt-1">
            Evolução de custos e despesas dos últimos 12 meses
          </p>
        </div>
        
        {/* Metric Selector */}
        <div className="flex bg-zinc-100/80 p-1 rounded-lg border border-zinc-200/50">
          {METRICS.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setActiveMetric(metric.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap",
                activeMetric === metric.id
                  ? "bg-white text-red-600 shadow-sm ring-1 ring-black/5"
                  : "text-zinc-400 hover:text-zinc-600 hover:bg-black/5"
              )}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end mb-4 relative z-10">
         {/* Legend */}
         <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/30" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Realizado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-[#24445C] border-t border-dashed border-[#24445C]" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Média</span>
          </div>
        </div>
      </div>

      {/* 
        Adicionada regra CSS inline para garantir que nenhum elemento SVG receba outline ao focar.
        Isso é mais robusto que apenas classes Tailwind em alguns casos de SVG shadow DOM.
      */}
      <style>{`
        .recharts-surface:focus { outline: none !important; }
        .recharts-layer:focus { outline: none !important; }
        path:focus { outline: none !important; stroke: none !important; }
      `}</style>

      <div className="w-full flex-1 relative z-10 [&_.recharts-surface]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {/* Red Gradient for Expenses */}
              <linearGradient id="barGradientExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6}/>
              </linearGradient>
              {/* Darker Red Gradient for Above Average */}
              <linearGradient id="barGradientExpenseHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b91c1c" stopOpacity={0.95}/>
                <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
            
            <XAxis 
              dataKey="periodo" 
              tickFormatter={(value) => {
                if (!value) return "";
                // Parse YYYY-MM
                try {
                  const [y, m] = value.split('-');
                  const date = new Date(parseInt(y), parseInt(m) - 1);
                  return format(date, 'MMM/yy', { locale: ptBR }).toUpperCase();
                } catch { return value; }
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
              dy={10}
              interval={0} 
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(value) => 
                new Intl.NumberFormat('pt-BR', { 
                  notation: "compact", 
                  compactDisplay: "short" 
                }).format(value)
              }
            />
            
            <Tooltip content={<CustomTooltip activeMetricLabel={activeMetricLabel} />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            
            <Line 
              type="monotone" 
              dataKey="media" 
              stroke="#94a3b8" 
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#94a3b8' }}
              animationDuration={2000}
            />
            
            <Bar 
              dataKey="value" 
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
              animationDuration={1500}
              stroke="none"
              strokeWidth={0}
            >
              <LabelList dataKey="value" content={renderCustomLabel} />
              
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  // Lógica invertida: Se for MAIOR que a média (custo alto), usa vermelho escuro
                  // Se for MENOR que a média (economia), usa vermelho normal
                  fill={entry.value >= entry.media ? "url(#barGradientExpenseHigh)" : "url(#barGradientExpense)"}
                  fillOpacity={1} 
                  style={{ outline: 'none' }} 
                  tabIndex={-1}
                  stroke="none"
                  strokeWidth={0}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};