import { useSearchParams } from "react-router-dom";
import { Filter, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const period = searchParams.get("period") || "2026";
  const month = searchParams.get("month") || "Jan";

  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const setFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set(key, value);
    setSearchParams(newParams);
  };

  return (
    <div className="flex items-center gap-1 bg-background/40 border border-border rounded-2xl p-1 h-full">
      {/* Filters Label Button */}
      <button className="flex items-center gap-2 px-5 py-1.5 hover:bg-muted transition-colors rounded-xl group">
        <Filter className="w-3.5 h-3.5 text-rodovia-verde fill-rodovia-verde/20 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-mono font-black text-foreground/70 tracking-[0.2em]">FILTROS</span>
      </button>

      {/* Year Selection */}
      <div className="flex items-center">
        <Select value={period} onValueChange={(v) => setFilter("period", v)}>
          <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 text-[10px] font-mono font-bold text-muted-foreground hover:text-foreground transition-colors gap-1 px-3">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-popover-foreground min-w-[80px]">
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <span className="text-border text-[10px]">•</span>

      {/* Month Selection */}
      <div className="flex items-center mr-2">
        <Select value={month} onValueChange={(v) => setFilter("month", v)}>
          <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 text-[10px] font-mono font-bold text-muted-foreground hover:text-foreground transition-colors gap-1 px-3">
            <SelectValue placeholder="Mês" />
            <ChevronDown className="w-3 h-3 opacity-30" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-popover-foreground min-w-[80px]">
            {months.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
