import React, { useState } from "react";
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, ArrowRight, ShieldCheck, Zap, Info } from "lucide-react";
import { motion } from "framer-motion";
import { WaterfallChart } from "@/components/WaterfallChart";
import { TimeSeriesChart } from "@/components/TimeSeriesChart";
import AssessorSheet from "@/components/dashboard/AssessorSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KPICard = ({ 
  label, 
  value, 
  trend, 
  trendValue, 
  description, 
  highlight = false,
  onClick
}: { 
  label: string; 
  value: string; 
  trend: "up" | "down"; 
  trendValue: string; 
  description: string;
  highlight?: boolean;
  onClick: () => void;
}) => (
  <div 
    onClick={onClick}
    className={cn(
      "p-6 rounded-3xl relative overflow-hidden group cursor-pointer transition-all duration-300 border backdrop-blur-sm",
      "bg-card/60 border-border hover:border-rodovia-verde/30 shadow-sm hover:shadow-xl",
      highlight && "border-rodovia-verde/50 shadow-[0_0_30px_rgba(36,172,132,0.15)]"
    )}
  >
    <div className="flex flex-col gap-1 relative z-10">
      <div className="flex justify-between items-start">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        {highlight && <Zap className="w-3 h-3 text-rodovia-verde animate-pulse" />}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <h3 className={cn(
          "text-4xl font-mono font-bold tracking-tighter",
          highlight ? "text-rodovia-verde" : "text-foreground"
        )}>
          {value}
        </h3>
        <div className={cn(
          "flex items-center gap-0.5 text-[10px] font-bold",
          trend === 'up' ? 'text-rodovia-verde' : 'text-destructive'
        )}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trendValue}
        </div>
      </div>
      <p className="text-xs text-muted-foreground font-serif italic mt-3 leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
        {description}
      </p>
    </div>
    
    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
      <ArrowRight className="w-4 h-4 text-muted-foreground" />
    </div>

    {/* Subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

export default function MasterDashboard() {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleKPIClick = (label: string, value: string, trendValue: string) => {
    setSelectedItem({
      title: label,
      value: value,
      change: parseFloat(trendValue),
      description: `Análise consolidada do indicador ${label} para o fechamento de Março/2024.`,
      details: [
        { label: "Performance vs Meta", value: "+4.2%", trend: "up" as const },
        { label: "Projeção Abr/24", value: "R$ 1.38M", trend: "up" as const },
        { label: "Risco de Quebra", value: "Baixo", trend: "up" as const },
      ]
    });
  };

  return (
    <div className="space-y-12 pb-20">
      <AssessorSheet 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        data={selectedItem} 
      />

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          label="Receita Bruta" 
          value="R$ 1.25M" 
          trend="up" 
          trendValue="+15.3%" 
          description="Crescimento robusto puxado pelo setor de agronegócio e fretes especiais."
          onClick={() => handleKPIClick("Receita Bruta", "R$ 1.25M", "+15.3%")}
        />
        <KPICard 
          label="Lucro Líquido" 
          value="R$ 285k" 
          trend="up" 
          trendValue="+49.2%" 
          description="Rentabilidade superada pelo 3º mês consecutivo com eficiência operacional."
          highlight={true}
          onClick={() => handleKPIClick("Lucro Líquido", "R$ 285k", "+49.2%")}
        />
        <KPICard 
          label="EBITDA Gerencial" 
          value="R$ 425k" 
          trend="up" 
          trendValue="+12.4%" 
          description="Geração de caixa operacional atingindo níveis históricos de maturidade."
          onClick={() => handleKPIClick("EBITDA Gerencial", "R$ 425k", "+12.4%")}
        />
        <KPICard 
          label="Margem Operacional" 
          value="34.2%" 
          trend="down" 
          trendValue="-1.2%" 
          description="Leve compressão devido ao aumento sazonal de combustíveis e manutenção."
          onClick={() => handleKPIClick("Margem Operacional", "34.2%", "-1.2%")}
        />
      </section>

      {/* Main Analysis Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <TimeSeriesChart />
        </div>

        <div className="lg:col-span-4">
          <div className="bg-card border border-border rounded-[40px] p-8 h-full flex flex-col justify-between shadow-sm transition-all hover:shadow-xl group">
            <div>
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-xl font-serif font-bold text-foreground tracking-tight">Corrida de Performance</h4>
                <Badge variant="secondary" className="bg-secondary text-foreground font-mono text-[10px] font-bold">UNIDADES</Badge>
              </div>
              
              <div className="space-y-8">
                {[
                  { name: "Matriz RS", value: 94, color: "bg-rodovia-verde" },
                  { name: "Filial Norte", value: 72, color: "bg-rodovia-verde/60" },
                  { name: "Filial Leste", value: 58, color: "bg-muted-foreground/30" },
                ].map((unit, idx) => (
                  <div key={unit.name} className="space-y-3 group/item">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-1 font-bold">Rank #{idx+1}</span>
                        <span className="font-serif font-bold text-foreground text-lg group-hover/item:text-rodovia-verde transition-colors">{unit.name}</span>
                      </div>
                      <span className="font-mono font-bold text-rodovia-verde text-xl">{unit.value}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${unit.value}%` }}
                        transition={{ duration: 1.5, delay: idx * 0.2, ease: "circOut" }}
                        className={cn("h-full rounded-full shadow-[0_0_15px_rgba(36,172,132,0.4)]", unit.color)} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Visualization */}
      <section>
        <WaterfallChart />
      </section>
    </div>
  );
}

