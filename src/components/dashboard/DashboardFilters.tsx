import { Filter } from "lucide-react";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { useFilter } from "@/contexts/FilterContext";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTH_LABELS_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function DashboardFilters() {
  const { period, month, setPeriod, setMonth } = useFilter();

  const setFilter = (key: string, value: string) => {
    if (key === "period") setPeriod(value);
    if (key === "month") setMonth(value);
  };

  const yearOptions = [
    { label: "2024", value: "2024" },
    { label: "2025", value: "2025" },
    { label: "2026", value: "2026" },
  ];

  const monthOptions = MONTH_LABELS.map((abbr, index) => ({
    label: MONTH_LABELS_FULL[index],
    value: abbr
  }));

  return (
    <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl p-1.5 h-full shadow-sm">
      {/* Filters Label Button */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-rodovia-verde/10 rounded-xl">
        <Filter className="w-3.5 h-3.5 text-rodovia-verde" />
        <span className="text-[10px] font-mono font-black text-rodovia-verde tracking-[0.2em]">FILTROS</span>
      </div>

      <div className="h-8 w-px bg-zinc-200" />

      {/* Year Selection */}
      <div className="w-[80px]">
        <ModernSelect
          label="ANO"
          value={period}
          onChange={(v) => setFilter("period", v)}
          options={yearOptions}
          variant="verde"
          className="min-w-0"
        />
      </div>

      {/* Month Selection */}
      <div className="w-[110px]">
        <ModernSelect
          label="MÊS"
          value={month}
          onChange={(v) => setFilter("month", v)}
          options={monthOptions}
          variant="verde"
          className="min-w-0"
        />
      </div>
    </div>
  );
}
