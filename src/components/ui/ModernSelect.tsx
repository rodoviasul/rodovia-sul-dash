import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernSelectProps {
  value: string | number;
  onChange: (val: any) => void;
  options: { label: string; value: any }[];
  label: string;
  variant?: "azul" | "verde";
  className?: string;
}

export const ModernSelect = ({ 
  value, 
  onChange, 
  options, 
  label,
  variant = "azul",
  className
}: ModernSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative min-w-[80px] group", className)}>
      <label className={cn(
        "absolute -top-2 left-3 px-1.5 text-[8px] font-black uppercase tracking-widest z-10 rounded-full bg-white transition-colors",
        variant === "azul" ? "text-rodovia-azul" : "text-rodovia-verde"
      )}>
        {label}
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-8 px-3 rounded-lg flex items-center justify-between transition-all duration-300 border text-[11px] font-bold",
          isOpen 
            ? (variant === "azul" ? "border-rodovia-azul ring-2 ring-rodovia-azul/10 bg-white" : "border-rodovia-verde ring-2 ring-rodovia-verde/10 bg-white")
            : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 shadow-sm hover:shadow-md"
        )}
      >
        <span className="truncate mr-2">{selectedOption?.label || value}</span>
        <ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform duration-300 opacity-50", isOpen && "rotate-180 opacity-100")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            className="absolute top-full mt-1 left-0 w-full bg-white rounded-lg border border-zinc-100 shadow-xl z-50 overflow-hidden py-1 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-1.5 text-left text-[11px] font-bold transition-colors hover:bg-zinc-50 whitespace-nowrap",
                  value === opt.value 
                    ? (variant === "azul" ? "text-rodovia-azul bg-rodovia-azul/5" : "text-rodovia-verde bg-rodovia-verde/5")
                    : "text-zinc-500"
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
