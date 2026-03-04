import React, { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import { mockSummary } from '@/data/mock';

export const TimeSeriesChart = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const data = mockSummary.map(d => ({
      periodo: new Date(d.periodo + '-01'),
      receita: d.receitaBruta,
      resultado: d.resultadoLiquido,
    }));

    const plot = Plot.plot({
      width: containerRef.current.clientWidth,
      height: 400,
      marginTop: 40,
      marginRight: 40,
      marginBottom: 40,
      marginLeft: 60,
      style: {
        background: "transparent",
        color: "currentColor",
        fontFamily: "JetBrains Mono",
        fontSize: "10px",
      },
      x: {
        label: null,
        grid: true,
        tickFormat: (d) => d.toLocaleString("pt-BR", { month: "short" }).toUpperCase(),
      },
      y: {
        label: "Valor (R$)",
        grid: true,
        tickFormat: (d) => `${(d / 1000).toFixed(0)}k`,
      },
      marks: [
        Plot.areaY(data, {
          x: "periodo",
          y: "receita",
          fill: "var(--rodovia-verde)",
          fillOpacity: 0.1,
          curve: "monotone-x",
        }),
        Plot.lineY(data, {
          x: "periodo",
          y: "receita",
          stroke: "var(--rodovia-verde)",
          strokeWidth: 4,
          curve: "monotone-x",
        }),
        Plot.dot(data, {
          x: "periodo",
          y: "receita",
          fill: "var(--rodovia-verde)",
          stroke: "var(--card)",
          strokeWidth: 2,
          r: 6,
        }),
        Plot.lineY(data, {
          x: "periodo",
          y: "resultado",
          stroke: "currentColor",
          strokeWidth: 2,
          strokeDasharray: "4,4",
          curve: "monotone-x",
          opacity: 0.5,
        }),
        Plot.tip(data, Plot.pointer({
          x: "periodo",
          y: "receita",
          title: (d) => `PERÍODO: ${d.periodo.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}\nRECEITA: R$ ${d.receita.toLocaleString()}\nLUCRO: R$ ${d.resultado.toLocaleString()}`,
          format: {
             x: null,
             y: null
          }
        })),
      ],
    });

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(plot);

    return () => plot.remove();
  }, []);

  return (
    <div className="bg-card border border-border p-10 rounded-[40px] h-full group hover:border-rodovia-verde/30 transition-all shadow-sm">
      <div className="flex justify-between items-start mb-10">
        <div>
          <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-[0.3em]">Trajectory Analysis</span>
          <h4 className="font-serif font-bold text-3xl text-foreground mt-2 tracking-tight">Evolução de Performance</h4>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rodovia-verde shadow-[0_0_10px_rgba(36,172,132,0.4)]" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase">Receita Bruta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-muted-foreground border-dashed rounded-full" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase">Lucro Líquido</span>
          </div>
        </div>
      </div>
      <div className="bg-secondary/20 rounded-[32px] border border-border p-6 shadow-inner">
        <div ref={containerRef} className="w-full text-muted-foreground" />
      </div>
    </div>
  );
};

