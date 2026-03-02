import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  Info,
  Calendar,
  DollarSign
} from "lucide-react";
import { TimeSeriesChart } from "@/components/TimeSeriesChart";

interface AssessorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    value: string;
    change: number;
    description: string;
    details: Array<{ label: string; value: string; trend?: "up" | "down" }>;
  } | null;
}

export default function AssessorSheet({ isOpen, onClose, data }: AssessorSheetProps) {
  if (!data) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-zinc-950 border-white/10 text-white overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="border-rodovia-verde/50 text-rodovia-verde font-mono text-[10px] uppercase">
              Detalhes do Indicador
            </Badge>
          </div>
          <SheetTitle className="font-serif text-3xl font-bold text-white leading-tight">
            {data.title}
          </SheetTitle>
          <SheetDescription className="text-zinc-400 font-sans mt-2">
            {data.description}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-8">
          {/* Main Metric */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-zinc-500 uppercase">Valor Atual</span>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold",
                data.change > 0 ? "text-rodovia-verde" : "text-destructive"
              )}>
                {data.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(data.change)}% vs mês ant.
              </div>
            </div>
            <div className="text-4xl font-mono font-bold tracking-tighter">
              {data.value}
            </div>
          </div>

          {/* Evolution Chart (Placeholder style) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-serif font-semibold">Evolução Histórica</h4>
              <Badge variant="secondary" className="bg-white/5 text-zinc-400 text-[10px]">6 Meses</Badge>
            </div>
            <div className="h-48 w-full bg-black/40 rounded-xl border border-white/5 p-4">
               {/* Simplified visualization for the sheet */}
               <div className="w-full h-full flex items-end gap-1">
                  {[40, 60, 45, 70, 85, 95].map((h, i) => (
                    <div 
                      key={i}
                      className="flex-1 bg-rodovia-verde/20 border-t border-rodovia-verde/50 rounded-t-sm transition-all hover:bg-rodovia-verde/40"
                      style={{ height: `${h}%` }}
                    />
                  ))}
               </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-4">
            <h4 className="text-sm font-serif font-semibold">Composição do Valor</h4>
            <div className="space-y-2">
              {data.details.map((detail, idx) => (
                <div 
                  key={idx}
                  className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                      <DollarSign className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-300">{detail.label}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">ID: 00{idx + 1}-24</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-white">{detail.value}</p>
                    {detail.trend && (
                      <p className={cn(
                        "text-[10px] font-mono",
                        detail.trend === "up" ? "text-rodovia-verde" : "text-destructive"
                      )}>
                        {detail.trend === "up" ? "+" : "-"}2.4%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* Action Footer */}
          <div className="bg-rodovia-verde/5 border border-rodovia-verde/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rodovia-verde/20 flex items-center justify-center">
              <Info className="w-5 h-5 text-rodovia-verde" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-rodovia-verde">Análise de IA</p>
              <p className="text-[10px] text-zinc-400 leading-tight mt-1">
                Este indicador está 12% acima da média do setor. Recomendamos manter a estratégia atual de custos.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { cn } from "@/lib/utils";
