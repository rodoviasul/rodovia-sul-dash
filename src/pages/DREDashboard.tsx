import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Info, Filter, FileText, Download, Share2, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AssessorSheet from "@/components/dashboard/AssessorSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DRERow = ({ 
  code, 
  name, 
  current, 
  previous, 
  variation, 
  level = 1,
  isHeader = false,
  onClick
}: { 
  code: string; 
  name: string; 
  current: string; 
  previous: string; 
  variation: number;
  level?: number;
  isHeader?: boolean;
  onClick?: () => void;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "grid grid-cols-12 py-3 px-4 border-b border-border transition-all duration-200",
      isHeader ? 'bg-muted/50 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sticky top-0 z-10' : 'hover:bg-accent cursor-pointer group',
      level === 1 && !isHeader ? 'font-serif text-lg font-bold text-foreground' : 'font-sans text-sm text-muted-foreground'
    )}
    onClick={onClick}
  >
    <div className={cn(
      "col-span-2 font-mono text-[10px] flex items-center transition-colors",
      isHeader ? "text-muted-foreground" : "text-muted-foreground group-hover:text-foreground",
      level > 1 ? 'pl-4' : ''
    )}>
      {code}
    </div>
    <div className={cn(
      "col-span-4 flex items-center transition-colors",
      isHeader ? "text-muted-foreground" : "group-hover:text-foreground",
      level === 2 ? 'pl-6' : level === 3 ? 'pl-10' : ''
    )}>
      {name}
      {!isHeader && level === 1 && <Badge variant="outline" className="ml-2 text-[8px] h-4 border-border text-muted-foreground">Total</Badge>}
    </div>
    <div className="col-span-2 text-right font-mono flex items-center justify-end text-foreground">
      {current}
    </div>
    <div className="col-span-2 text-right font-mono text-muted-foreground flex items-center justify-end">
      {previous}
    </div>
    <div className={cn(
      "col-span-2 text-right font-mono flex items-center justify-end gap-1 font-bold",
      variation > 0 ? 'text-rodovia-verde' : variation < 0 ? 'text-destructive' : 'text-muted-foreground'
    )}>
      {variation !== 0 && (variation > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
      {variation !== 0 ? `${Math.abs(variation)}%` : "-"}
    </div>
  </motion.div>
);

export default function DREDashboard() {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleRowClick = (name: string, value: string, variation: number, code: string) => {
    setSelectedItem({
      title: name,
      value: `R$ ${value}`,
      change: variation,
      description: `Análise detalhada da conta ${code} - ${name} referente ao período de Março/2024.`,
      details: [
        { label: "Unidade Sul", value: "R$ 450.000", trend: "up" as const },
        { label: "Unidade Norte", value: "R$ 380.000", trend: "down" as const },
        { label: "Unidade Leste", value: "R$ 420.000", trend: "up" as const },
      ]
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <AssessorSheet 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        data={selectedItem} 
      />

      {/* Editorial Header */}
      <section className="flex justify-between items-end border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-rodovia-verde/50 text-rodovia-verde font-mono text-[10px] uppercase px-2 py-0">
              Auditado
            </Badge>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Março 2024</span>
          </div>
          <h1 className="text-5xl font-serif font-bold tracking-tight text-foreground">Demonstração de Resultados</h1>
          <p className="text-muted-foreground font-sans max-w-2xl">
            Relatório gerencial consolidado das operações logísticas da Rodovia Sul. 
            Dados processados em tempo real com integração direta ao ERP.
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="border-border bg-card hover:bg-accent shadow-sm">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Compartilhar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" className="border-border bg-card text-xs font-mono uppercase hover:bg-accent shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
      </section>

      {/* KPI Headline Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Receita Líquida", value: "R$ 1.12M", change: "+15.2%", trend: "up" },
          { label: "Margem Bruta", value: "64.2%", change: "+2.4%", trend: "up" },
          { label: "EBITDA", value: "R$ 425k", change: "+49.1%", trend: "up", highlight: true },
          { label: "Lucro Líquido", value: "R$ 285k", change: "+49.2%", trend: "up" },
        ].map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "p-6 rounded-2xl border transition-all duration-300 backdrop-blur-sm",
              "bg-card/60 border-border hover:border-rodovia-verde/30 shadow-sm hover:shadow-md",
              kpi.highlight && "border-rodovia-verde/50 shadow-[0_0_20px_rgba(36,172,132,0.15)]"
            )}
          >
            <span className="font-mono text-[10px] uppercase text-muted-foreground">{kpi.label}</span>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className={cn(
                "text-3xl font-mono font-bold tracking-tighter",
                kpi.highlight ? "text-rodovia-verde" : "text-foreground"
              )}>{kpi.value}</h3>
              <span className={cn(
                "text-[10px] font-mono font-bold",
                kpi.trend === "up" ? "text-rodovia-verde" : "text-destructive"
              )}>{kpi.change}</span>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Main DRE Table with Editorial Styling */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm">
        <DRERow 
          code="CÓDIGO" 
          name="CONTA NOMINAL" 
          current="MAR/24 (R$)" 
          previous="FEV/24 (R$)" 
          variation={0} 
          isHeader={true} 
        />
        
        <div className="max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
          <DRERow code="3.01" name="RECEITA BRUTA OPERACIONAL" current="1.250.000" previous="1.085.000" variation={15.3} onClick={() => handleRowClick("Receita Bruta", "1.250.000", 15.3, "3.01")} />
          <DRERow code="3.01.01" name="Vendas de Serviços Logísticos" current="980.000" previous="820.000" variation={19.5} level={2} onClick={() => handleRowClick("Serviços Logísticos", "980.000", 19.5, "3.01.01")} />
          <DRERow code="3.01.02" name="Locação de Equipamentos" current="270.000" previous="265.000" variation={1.8} level={2} onClick={() => handleRowClick("Locação", "270.000", 1.8, "3.01.02")} />
          
          <DRERow code="3.02" name="(-) DEDUÇÕES DA RECEITA" current="(125.000)" previous="(108.500)" variation={-15.2} />
          <DRERow code="3.02.01" name="Impostos Incidentes" current="(95.000)" previous="(82.000)" variation={-15.8} level={2} />
          <DRERow code="3.02.02" name="Devoluções e Abatimentos" current="(30.000)" previous="(26.500)" variation={-13.2} level={2} />

          <DRERow code="3.03" name="(=) RECEITA LÍQUIDA" current="1.125.000" previous="976.500" variation={15.2} />

          <DRERow code="3.04" name="(-) CUSTOS OPERACIONAIS (CPV)" current="(402.500)" previous="(385.000)" variation={-4.5} />
          <DRERow code="3.04.01" name="Combustíveis e Lubrificantes" current="(185.000)" previous="(162.000)" variation={-14.2} level={2} onClick={() => handleRowClick("Combustíveis", "185.000", -14.2, "3.04.01")} />
          <DRERow code="3.04.02" name="Manutenção de Frota" current="(120.000)" previous="(145.000)" variation={17.2} level={2} onClick={() => handleRowClick("Manutenção", "120.000", 17.2, "3.04.02")} />
          <DRERow code="3.04.03" name="Mão de Obra Direta" current="(97.500)" previous="(78.000)" variation={-25.0} level={2} />

          <DRERow code="3.05" name="(=) LUCRO BRUTO" current="722.500" previous="591.500" variation={22.1} />

          <DRERow code="3.06" name="(-) DESPESAS OPERACIONAIS" current="(297.500)" previous="(306.500)" variation={2.9} />
          <DRERow code="3.06.01" name="Despesas Administrativas" current="(112.000)" previous="(118.000)" variation={5.1} level={2} />
          <DRERow code="3.06.02" name="Despesas Comerciais" current="(85.500)" previous="(72.500)" variation={-17.9} level={2} />
          <DRERow code="3.06.03" name="Depreciação e Amortização" current="(100.000)" previous="(116.000)" variation={13.8} level={2} />

          <DRERow code="3.07" name="(=) RESULTADO ANTES DO IR/CS" current="425.000" previous="285.000" variation={49.1} />
          
          <DRERow code="3.08" name="(-) IR / CONTRIBUIÇÃO SOCIAL" current="(140.000)" previous="(94.000)" variation={-48.9} />
          
          <DRERow code="3.09" name="(=) LUCRO LÍQUIDO DO PERÍODO" current="285.000" previous="191.000" variation={49.2} />
        </div>
      </section>

      {/* Editorial Insight Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-rodovia-verde/5 border border-rodovia-verde/20 p-10 rounded-3xl flex gap-10 items-start relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-rodovia-verde/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="w-16 h-16 rounded-2xl bg-rodovia-verde/20 flex items-center justify-center shrink-0 border border-rodovia-verde/30 shadow-lg">
          <FileText className="w-8 h-8 text-rodovia-verde" />
        </div>
        
        <div className="space-y-6 relative z-10">
          <div>
            <h4 className="text-2xl font-serif font-bold tracking-tight text-white mb-2">Análise Estratégica</h4>
            <div className="h-1 w-20 bg-rodovia-verde rounded-full" />
          </div>
          
          <p className="font-serif text-2xl leading-relaxed text-zinc-300 italic">
            "A expansão de <span className="text-white font-bold underline decoration-rodovia-verde decoration-4">49.2% no lucro líquido</span> é reflexo direto do programa de eficiência em manutenção, que reduziu custos em 17.2%, compensando a volatilidade do diesel. A alavancagem operacional permitiu que o lucro crescesse 3x mais rápido que a receita bruta."
          </p>
          
          <div className="flex flex-wrap gap-6 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rodovia-verde animate-pulse" />
              <span className="font-mono text-xs uppercase text-zinc-400">Manutenção Otimizada</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rodovia-verde" />
              <span className="font-mono text-xs uppercase text-zinc-400">Mix de Serviços +4.2%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="font-mono text-xs uppercase text-zinc-400">Inflação Diesel (Risco)</span>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

import { cn } from "@/lib/utils";

