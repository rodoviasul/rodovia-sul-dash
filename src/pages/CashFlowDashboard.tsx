import React, { useState } from "react";
import { Wallet, Landmark, ArrowDownCircle, ArrowUpCircle, ShieldCheck, TrendingUp, TrendingDown, Info, Calendar, Download } from "lucide-react";
import { motion } from "framer-motion";
import AssessorSheet from "@/components/dashboard/AssessorSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const CashMetric = ({ label, value, subtext, icon: Icon, color, onClick }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className="bg-card border border-border p-6 rounded-[32px] flex items-start gap-4 cursor-pointer transition-all hover:border-rodovia-verde/30 shadow-sm hover:shadow-xl group"
  >
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1">
      <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest">{label}</span>
      <h3 className="text-3xl font-mono font-bold mt-1 text-foreground tracking-tighter">{value}</h3>
      <p className="text-[10px] font-sans text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-foreground transition-colors">
        {subtext}
      </p>
    </div>
  </motion.div>
);

export default function CashFlowDashboard() {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleMetricClick = (label: string, value: string, subtext: string) => {
    setSelectedItem({
      title: label,
      value: value,
      change: 4.2,
      description: `Detalhamento de ${label}. ${subtext}. Análise referente ao fluxo de caixa projetado para Q2/2024.`,
      details: [
        { label: "Disponível Imediato", value: "R$ 450.000", trend: "up" as const },
        { label: "Aplicações Curto Prazo", value: "R$ 250.000", trend: "up" as const },
        { label: "Reservas de Contingência", value: "R$ 150.400", trend: "down" as const },
      ]
    });
  };

  return (
    <div className="space-y-10 pb-20">
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
              Tesouraria
            </Badge>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Live Update</span>
          </div>
          <h1 className="text-5xl font-serif font-bold tracking-tight text-foreground">Fluxo de Caixa</h1>
          <p className="text-muted-foreground font-sans max-w-2xl">
            Monitoramento de liquidez, prazos médios e projeção de solvência. 
            Visão estratégica de capital de giro para suporte operacional.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border bg-card text-xs font-mono uppercase hover:bg-accent shadow-sm">
            <Calendar className="w-4 h-4 mr-2 text-rodovia-verde" /> Próximos 90 Dias
          </Button>
          <Button variant="outline" className="border-border bg-card text-xs font-mono uppercase hover:bg-accent shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Conciliação
          </Button>
        </div>
      </section>

      {/* Liquidity Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CashMetric 
          label="Saldo em Caixa" 
          value="R$ 850.400" 
          subtext="Disponibilidade imediata em 3 bancos"
          icon={Landmark}
          color="bg-rodovia-verde/20 border border-rodovia-verde/30 shadow-rodovia-verde/5"
          onClick={() => handleMetricClick("Saldo em Caixa", "R$ 850.400", "Disponibilidade imediata em 3 bancos")}
        />
        <CashMetric 
          label="Contas a Receber" 
          value="R$ 1.120.000" 
          subtext="Próximos 30 dias (94% adimplência)"
          icon={ArrowUpCircle}
          color="bg-blue-500/20 border border-blue-500/30 shadow-blue-500/5"
          onClick={() => handleMetricClick("Contas a Receber", "R$ 1.120.000", "Próximos 30 dias (94% adimplência)")}
        />
        <CashMetric 
          label="Contas a Pagar" 
          value="R$ 680.500" 
          subtext="Compromissos fixos e variáveis"
          icon={ArrowDownCircle}
          color="bg-destructive/20 border border-destructive/30 shadow-destructive/5"
          onClick={() => handleMetricClick("Contas a Pagar", "R$ 680.500", "Compromissos fixos e variáveis")}
        />
        <CashMetric 
          label="Reserva de Emergência" 
          value="R$ 300.000" 
          subtext="Cobertura de 45 dias operacionais"
          icon={ShieldCheck}
          color="bg-zinc-800/50 border border-white/10 shadow-white/5"
          onClick={() => handleMetricClick("Reserva de Emergência", "R$ 300.000", "Cobertura de 45 dias operacionais")}
        />
      </section>

      {/* Main Analysis Area */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cash Flow Timeline */}
        <div className="lg:col-span-8 bg-card border border-border rounded-[40px] p-10 relative overflow-hidden group shadow-sm transition-all hover:shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rodovia-verde/5 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
          
          <div className="flex justify-between items-center mb-12 relative z-10">
            <div>
              <h4 className="text-2xl font-serif font-bold tracking-tight text-foreground">Projeção de Solvência</h4>
              <p className="text-sm text-muted-foreground mt-1 font-sans">Previsão estatística de entradas e saídas (90 dias).</p>
            </div>
            <div className="flex bg-muted p-1 rounded-xl border border-border">
              <button className="px-4 py-1.5 text-[10px] font-mono uppercase bg-rodovia-verde text-white font-bold rounded-lg shadow-sm">30 Dias</button>
              <button className="px-4 py-1.5 text-[10px] font-mono uppercase text-muted-foreground hover:text-foreground transition-colors">90 Dias</button>
            </div>
          </div>

          <div className="h-[400px] w-full bg-secondary/50 rounded-[32px] border border-border p-8 flex flex-col items-center justify-center gap-6 group-hover:border-rodovia-verde/30 transition-all shadow-inner">
             <div className="w-full h-full flex items-end gap-2 px-4">
                {[30, 45, 25, 60, 85, 45, 70, 95, 110, 85, 65, 40].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className={cn(
                        "w-full rounded-t-lg transition-all hover:brightness-110 cursor-help",
                        i === 8 ? "bg-rodovia-verde shadow-[0_0_20px_rgba(36,172,132,0.4)]" : "bg-muted"
                      )} 
                      style={{ height: `${h}%` }} 
                    />
                    <span className="text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-tighter">W{i+1}</span>
                  </div>
                ))}
             </div>
             <div className="flex gap-6 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rodovia-verde" />
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Superávit Projetado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted" />
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Custos Fixos</span>
                </div>
             </div>
          </div>
        </div>

        {/* Working Capital & Insights */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-card border border-border rounded-[40px] p-8 h-full shadow-sm">
            <h4 className="text-xl font-serif font-bold tracking-tight text-foreground mb-8">Ciclo Financeiro</h4>
            <div className="space-y-8">
              {[
                { label: "Recebimento Médio", value: "32 Dias", icon: ArrowUpCircle, color: "text-rodovia-verde" },
                { label: "Pagamento Médio", value: "28 Dias", icon: ArrowDownCircle, color: "text-destructive" },
                { label: "Giro de Operação", value: "45 Dias", icon: Wallet, color: "text-rodovia-verde/50" },
              ].map((item) => (
                <div key={item.label} className="group flex items-center justify-between p-2 rounded-xl hover:bg-accent transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center group-hover:border-rodovia-verde/20 transition-all">
                      <item.icon className={cn("w-5 h-5", item.color)} />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{item.label}</p>
                      <p className="text-sm font-sans font-medium text-muted-foreground">Padrão Setorial: 30D</p>
                    </div>
                  </div>
                  <span className="font-mono text-xl font-bold text-foreground tracking-tighter">{item.value}</span>
                </div>
              ))}
            </div>

            <Separator className="my-8 bg-border" />

            <div className="p-6 bg-rodovia-verde/5 border border-rodovia-verde/20 rounded-[24px]">
              <span className="font-mono text-[10px] uppercase text-rodovia-verde font-bold block mb-2">Necessidade de Giro</span>
              <div className="flex items-baseline gap-2">
                <h5 className="text-3xl font-mono font-bold text-foreground tracking-tighter">R$ 240.0k</h5>
                <span className="text-xs font-mono text-rodovia-verde font-bold">+2.4%</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                Baseado no volume de fretes projetados para os próximos 15 dias de operação intensa.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { cn } from "@/lib/utils";

