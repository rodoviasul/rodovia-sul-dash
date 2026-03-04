import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  BarChart3, 
  Wallet, 
  Settings, 
  LogOut, 
  Maximize2,
  ChevronDown,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import DashboardFilters from "@/components/dashboard/DashboardFilters";

import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logout realizado com sucesso");
    } catch (error: any) {
      toast.error("Erro ao sair", {
        description: error.message
      });
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const menuItems = [
    { label: "GERAL", href: "/" },
    { label: "DRE GERENCIAL", href: "/dre" },
    { label: "FLUXO DE CAIXA", href: "/cash-flow" },
  ];

  return (
    <div className={cn(
      "flex min-h-screen transition-colors duration-500 relative",
      theme === "dark" ? "bg-black text-white" : "bg-[#f8f9fa] text-[#1a1a1a]"
    )}>
      {/* Background Video Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className={cn(
            "w-full h-full object-cover transition-opacity duration-1000",
            "opacity-50 grayscale"
          )}
        >
          <source src="https://wnombkybmahknwcyzfqz.supabase.co/storage/v1/object/public/utils/fundo.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlays to ensure readability */}
        <div className={cn(
          "absolute inset-0",
          theme === "dark" 
            ? "bg-gradient-to-b from-black via-transparent to-black" 
            : "bg-gradient-to-b from-[#f8f9fa] via-transparent to-[#f8f9fa]"
        )} />
      </div>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col">
        {/* Top Header Section */}
        <div className="w-full px-12 pt-12 flex flex-col items-center gap-8 relative">
          {/* Top Right Utility Buttons */}
          <div className="absolute top-8 right-12 flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300",
                theme === "dark" 
                  ? "bg-zinc-900/50 border-white/5 hover:bg-zinc-800" 
                  : "bg-white border-black/5 shadow-sm hover:shadow-md"
              )}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-rodovia-verde" />
              ) : (
                <Moon className="w-4 h-4 text-rodovia-verde" />
              )}
            </button>
            <button className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-full transition-all group",
              theme === "dark"
                ? "bg-zinc-900/50 border-white/5 hover:bg-zinc-800"
                : "bg-white border-black/5 shadow-sm hover:shadow-md"
            )}>
              <Maximize2 className="w-3.5 h-3.5 text-rodovia-verde transition-colors" />
              <span className={cn(
                "text-[10px] font-mono font-bold uppercase tracking-widest",
                theme === "dark" ? "text-zinc-500 group-hover:text-white" : "text-zinc-400 group-hover:text-zinc-900"
              )}>MAXIMIZAR</span>
            </button>

            <Link to="/configuracao" className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300",
              theme === "dark" 
                ? "bg-zinc-900/50 border-white/5 hover:bg-zinc-800" 
                : "bg-white border-black/5 shadow-sm hover:shadow-md"
            )}>
              <Settings className="w-4 h-4 text-rodovia-verde" />
            </Link>

            <button 
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border rounded-full transition-all group",
                theme === "dark"
                  ? "bg-zinc-900/50 border-white/5 hover:bg-red-950/30"
                  : "bg-white border-black/5 shadow-sm hover:bg-red-50 hover:border-red-100 shadow-red-100/20"
              )}
            >
              <LogOut className="w-3.5 h-3.5 text-red-500 group-hover:text-red-600 transition-colors" />
              <span className={cn(
                "text-[10px] font-mono font-bold uppercase tracking-widest transition-colors",
                theme === "dark" ? "text-zinc-500 group-hover:text-red-400" : "text-zinc-400 group-hover:text-red-600"
              )}>SAIR</span>
            </button>
          </div>

          {/* Centered Green Title */}
          <div className="text-center space-y-1">
            <h1 className={cn(
              "text-sm font-mono font-black uppercase tracking-[0.8em] transition-all duration-500",
              theme === "dark" 
                ? "text-rodovia-verde drop-shadow-[0_0_15px_rgba(36,172,132,0.3)]" 
                : "text-rodovia-verde tracking-[1em]"
            )}>
              PERFORMANCE GERAL RODOVIA SUL
            </h1>
          </div>

          {/* Integrated HUD Bar (Tabs + Filters) */}
          <div className={cn(
            "flex items-center gap-1 p-1 backdrop-blur-md border rounded-full transition-all duration-500 shadow-2xl",
            theme === "dark"
              ? "bg-card/80 border-white/10 shadow-black"
              : "bg-white/80 border-black/5 shadow-zinc-200"
          )}>
            {/* Navigation Tabs */}
            <div className="flex items-center gap-0.5">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "px-6 py-2.5 rounded-full text-[10px] font-mono font-bold tracking-[0.2em] transition-all duration-300",
                      isActive 
                        ? (theme === "dark" 
                            ? "bg-primary text-white border border-primary/20 shadow-[0_0_20px_rgba(36,172,132,0.3)]" 
                            : "bg-zinc-900 text-white shadow-lg")
                        : (theme === "dark"
                            ? "text-zinc-400 hover:text-white hover:bg-white/5"
                            : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50")
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className={cn(
              "h-6 w-px mx-2",
              theme === "dark" ? "bg-white/10" : "bg-black/5"
            )} />

            {/* Filter Component Integration */}
            <DashboardFilters />
          </div>
        </div>

        {/* Content Area */}
        <div className="px-12 py-8 flex-1">
          <motion.div 
            key={location.pathname + theme}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
