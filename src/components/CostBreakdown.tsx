import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisLeft } from '@visx/axis';
import { Text } from '@visx/text';
import { ParentSize } from '@visx/responsive';

const costs = [
  { nome: 'Combustíveis', valorAbs: 185000, codigo: 'CUSTO_COMB' },
  { nome: 'Manutenção', valorAbs: 120000, codigo: 'CUSTO_MANT' },
  { nome: 'Mão de Obra', valorAbs: 97500, codigo: 'CUSTO_MAO' },
  { nome: 'Pneus', valorAbs: 45000, codigo: 'CUSTO_PNEU' },
  { nome: 'Seguros', valorAbs: 32000, codigo: 'CUSTO_SEG' },
];

export const CostBreakdown = () => {
  return (
    <div className="bg-black/40 border border-white/5 p-8 rounded-[40px] h-full group hover:border-white/10 transition-all">
      <h4 className="font-serif font-bold text-2xl text-white mb-8 tracking-tight">Composição de Custos</h4>
      
      <div className="h-[300px] w-full">
        <ParentSize>
          {({ width, height }) => {
            const margin = { top: 10, right: 60, bottom: 10, left: 120 };
            const xMax = width - margin.left - margin.right;
            const yMax = height - margin.top - margin.bottom;

            const xScale = scaleLinear({
              range: [0, xMax],
              domain: [0, Math.max(...costs.map(d => d.valorAbs)) * 1.1],
            });

            const yScale = scaleBand({
              range: [0, yMax],
              domain: costs.map(d => d.nome),
              padding: 0.4,
            });

            return (
              <svg width={width} height={height} className="overflow-visible">
                <Group left={margin.left} top={margin.top}>
                  {costs.map((d, i) => {
                    const barWidth = xScale(d.valorAbs);
                    const barHeight = yScale.bandwidth();
                    const barY = yScale(d.nome);
                    return (
                      <g key={`cost-${i}`} className="hover:opacity-80 transition-opacity cursor-pointer">
                        <Bar
                          x={0}
                          y={barY}
                          width={barWidth}
                          height={barHeight}
                          fill="var(--rodovia-verde)"
                          fillOpacity={0.2 + (i * 0.15)}
                          rx={4}
                        />
                        <Text
                          x={barWidth + 10}
                          y={(barY || 0) + barHeight / 2}
                          verticalAnchor="middle"
                          fontSize={12}
                          fontWeight="bold"
                          fontFamily="JetBrains Mono"
                          fill="white"
                        >
                          {`R$ ${(d.valorAbs / 1000).toFixed(0)}k`}
                        </Text>
                      </g>
                    );
                  })}
                  <AxisLeft
                    scale={yScale}
                    stroke="none"
                    tickStroke="none"
                    tickLabelProps={{
                      fill: "var(--zinc-500)",
                      fontSize: 10,
                      fontFamily: "JetBrains Mono",
                      textAnchor: "end",
                      dx: -10,
                    }}
                  />
                </Group>
              </svg>
            );
          }}
        </ParentSize>
      </div>
    </div>
  );
};

