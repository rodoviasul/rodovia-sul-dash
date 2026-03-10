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
  ReferenceLine
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CashFlowEvolutionChartProps {
  data: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
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
      // fallback
    }

    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-2xl min-w-[220px]">
        <p className="text-slate-400 text-xs font-mono mb-3 uppercase tracking-widest border-b border-slate-800 pb-2">
          {formattedLabel}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            // Define colors and labels based on dataKey
            let labelText = "";
            let colorClass = "";
            
            switch(entry.dataKey) {
              case "fluxo_operacional": labelText = "Fluxo Operacional"; colorClass = "text-emerald-400"; break;
              case "fluxo_investimento": labelText = "Fluxo Investimento"; colorClass = "text-amber-400"; break;
              case "fluxo_financiamento": labelText = "Fluxo Financiamento"; colorClass = "text-blue-400"; break;
              case "saldo_final": labelText = "Saldo Final"; colorClass = "text-white font-bold"; break;
              default: labelText = entry.name; colorClass = "text-slate-300";
            }

            return (
              <div key={index} className="flex justify-between items-center gap-4">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {labelText}
                </span>
                <span className={`text-sm font-mono font-bold tracking-tight ${colorClass}`}>
                  {entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const CashFlowEvolutionChart = ({ data }: CashFlowEvolutionChartProps) => {
  return (
    <div className="w-full h-[450px] bg-white rounded-xl border border-zinc-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-5 md:p-6 relative overflow-hidden group flex flex-col">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all duration-1000 group-hover:bg-blue-500/10" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 relative z-10 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase">
            Evolução do <span className="text-blue-600">Caixa</span>
          </h2>
          <p className="text-sm text-zinc-400 font-medium mt-1">
            Composição do fluxo de caixa e saldo final acumulado
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-end gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Operacional</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Investimento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Financiamento</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-6 h-0.5 bg-slate-800 border-t border-slate-800" />
          <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider">Saldo Final</span>
        </div>
      </div>

      <style>{`
        .recharts-surface:focus { outline: none !important; }
        .recharts-layer:focus { outline: none !important; }
        path:focus { outline: none !important; stroke: none !important; }
      `}</style>

      <div className="w-full flex-1 relative z-10 [&_.recharts-surface]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradOperacional" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
              </linearGradient>
              <linearGradient id="gradInvestimento" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.4}/>
              </linearGradient>
              <linearGradient id="gradFinanciamento" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
            
            <XAxis 
              dataKey="periodo" 
              tickFormatter={(value) => {
                if (!value) return "";
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
              yAxisId="left"
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

            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              hide={true} // Oculta eixo secundário visualmente, mas usa para escala se necessário
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            
            {/* Stacked Bars for Flows */}
            <Bar dataKey="fluxo_operacional" stackId="a" fill="url(#gradOperacional)" radius={[0, 0, 4, 4]} maxBarSize={50} yAxisId="left" />
            <Bar dataKey="fluxo_investimento" stackId="a" fill="url(#gradInvestimento)" radius={[0, 0, 0, 0]} maxBarSize={50} yAxisId="left" />
            <Bar dataKey="fluxo_financiamento" stackId="a" fill="url(#gradFinanciamento)" radius={[4, 4, 0, 0]} maxBarSize={50} yAxisId="left" />
            
            {/* Line for Final Balance */}
            <Line 
              type="monotone" 
              dataKey="saldo_final" 
              stroke="#1e293b" 
              strokeWidth={3}
              dot={{ r: 4, fill: "#1e293b", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "#1e293b" }}
              animationDuration={2000}
              yAxisId="left" // Usa mesmo eixo para comparação direta de escala
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
