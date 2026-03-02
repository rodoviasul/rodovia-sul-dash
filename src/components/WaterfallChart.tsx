import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Text } from '@visx/text';
import { ParentSize } from '@visx/responsive';

const data = [
  { label: 'Rec. Bruta', value: 1250000, type: 'total' },
  { label: 'Deduções', value: -125000, type: 'step' },
  { label: 'Rec. Líquida', value: 1125000, type: 'total' },
  { label: 'Custos', value: -402500, type: 'step' },
  { label: 'Lucro Bruto', value: 722500, type: 'total' },
  { label: 'Despesas', value: -297500, type: 'step' },
  { label: 'EBITDA', value: 425000, type: 'total' },
];

export const WaterfallChart = () => {
  return (
    <div className="bg-card border border-border p-10 rounded-[40px] h-full group hover:border-rodovia-verde/30 transition-all shadow-sm">
      <div className="flex justify-between items-start mb-10">
        <div>
          <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-[0.3em]">Value Chain Analysis</span>
          <h4 className="font-serif font-bold text-3xl text-foreground mt-2 tracking-tight">Jornada do Valor</h4>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rodovia-verde" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase">Totalizador</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase">Saídas/Custos</span>
          </div>
        </div>
      </div>
      
      <div className="h-[400px] w-full bg-secondary/20 rounded-[32px] border border-border p-6 shadow-inner">
        <ParentSize>
          {({ width, height }) => {
            const margin = { top: 40, right: 30, bottom: 50, left: 60 };
            const xMax = width - margin.left - margin.right;
            const yMax = height - margin.top - margin.bottom;

            const xScale = scaleBand({
              range: [0, xMax],
              round: true,
              domain: data.map(d => d.label),
              padding: 0.3,
            });

            const yScale = scaleLinear({
              range: [yMax, 0],
              round: true,
              domain: [0, 1300000],
              nice: true,
            });

            let cumulative = 0;

            return (
              <svg width={width} height={height} className="overflow-visible">
                <Group left={margin.left} top={margin.top}>
                  {data.map((d, i) => {
                    const barWidth = xScale.bandwidth();
                    const isTotal = d.type === 'total';
                    
                    let barHeight, barY;
                    
                    if (isTotal) {
                      barHeight = yMax - yScale(d.value);
                      barY = yScale(d.value);
                      cumulative = d.value;
                    } else {
                      const start = cumulative;
                      const end = cumulative + d.value;
                      barHeight = Math.abs(yScale(start) - yScale(end));
                      barY = yScale(Math.max(start, end));
                      cumulative = end;
                    }

                    return (
                      <g key={`bar-${i}`} className="hover:opacity-80 transition-opacity cursor-pointer">
                        <Bar
                          x={xScale(d.label)}
                          y={barY}
                          width={barWidth}
                          height={barHeight}
                          fill={isTotal ? "var(--rodovia-verde)" : "var(--destructive)"}
                          rx={8}
                          opacity={isTotal ? 1 : 0.8}
                        />
                        <Text
                          x={(xScale(d.label) || 0) + barWidth / 2}
                          y={barY - 12}
                          verticalAnchor="end"
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight="bold"
                          fontFamily="JetBrains Mono"
                          fill="currentColor"
                          className="text-foreground"
                        >
                          {`${(d.value / 1000).toFixed(0)}k`}
                        </Text>
                      </g>
                    );
                  })}
                  <AxisBottom
                    top={yMax}
                    scale={xScale}
                    stroke="currentColor"
                    axisClassName="text-muted-foreground/20"
                    tickStroke="currentColor"
                    tickLabelProps={() => ({
                      fill: "currentColor",
                      fontSize: 10,
                      textAnchor: "middle",
                    })}
                  />
                  <AxisLeft
                    scale={yScale}
                    stroke="currentColor"
                    axisClassName="text-muted-foreground/20"
                    tickStroke="currentColor"
                    tickFormat={(v) => `${(Number(v) / 1000000).toFixed(1)}M`}
                    tickLabelProps={() => ({
                      fill: "currentColor",
                      fontSize: 10,
                      textAnchor: "end",
                      dx: -5,
                    })}
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

