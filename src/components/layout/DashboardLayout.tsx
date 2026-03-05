import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Settings, 
  LogOut, 
  Maximize2,
  Minimize2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import DashboardFilters from "@/components/dashboard/DashboardFilters";

import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        toast.error("Erro ao ativar tela cheia", { description: e.message });
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logout realizado com sucesso");
      navigate("/login");
    } catch (error: any) {
      toast.error("Erro ao sair", {
        description: error.message
      });
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
  }, []);

  const menuItems = [
    { label: "GERAL", href: "/" },
    { label: "DRE GERENCIAL", href: "/dre" },
    { label: "FLUXO DE CAIXA", href: "/cash-flow" },
  ];

  return (
    <div className="flex min-h-screen transition-colors duration-500 relative bg-[#f8f9fa] text-[#1a1a1a]">
      {/* Background Video Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover transition-opacity duration-1000 opacity-70 grayscale"
        >
          <source src="https://wnombkybmahknwcyzfqz.supabase.co/storage/v1/object/public/utils/fundo.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlays to ensure readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8f9fa] via-transparent to-[#f8f9fa]" />
      </div>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col">
        {/* Top Header Section */}
        <div className="w-full px-12 pt-12 flex flex-col items-center gap-8 relative">
          {/* Top Right Utility Buttons */}
          <div className="absolute top-8 right-12 flex items-center gap-3">
            <button 
              onClick={toggleFullScreen}
              className="flex items-center gap-2 px-4 py-2 border rounded-full transition-all group bg-white border-black/5 shadow-sm hover:shadow-md"
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-rodovia-verde transition-colors" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900">MINIMIZAR</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-rodovia-verde transition-colors" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900">MAXIMIZAR</span>
                </>
              )}
            </button>

            <Link to="/configuracao" className="flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 bg-white border-black/5 shadow-sm hover:shadow-md">
              <Settings className="w-4 h-4 text-rodovia-verde" />
            </Link>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border rounded-full transition-all group bg-white border-black/5 shadow-sm hover:bg-red-50 hover:border-red-100 shadow-red-100/20"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500 group-hover:text-red-600 transition-colors" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest transition-colors text-zinc-400 group-hover:text-red-600">SAIR</span>
            </button>
          </div>

          {/* Logo & Centered Green Title */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white shadow-2xl p-3 border border-black/5 flex items-center justify-center transition-all duration-500 hover:scale-110">
              <img 
                src="https://wnombkybmahknwcyzfqz.supabase.co/storage/v1/object/public/utils/logo-rodovia.png" 
                alt="Rodovia Sul Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-sm font-mono font-black uppercase tracking-[1em] transition-all duration-500 text-rodovia-verde">
              PERFORMANCE GERAL RODOVIA SUL
            </h1>
          </div>

          {/* Integrated HUD Bar (Tabs + Filters) */}
          <div className="flex items-center gap-1 p-1 backdrop-blur-md border rounded-full transition-all duration-500 shadow-2xl bg-white/80 border-black/5 shadow-zinc-200">
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
                        ? "bg-zinc-900 text-white shadow-lg"
                        : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-6 w-px mx-2 bg-black/5" />

            {/* Filter Component Integration */}
            <DashboardFilters />
          </div>
        </div>

        {/* Content Area */}
        <div className="px-12 py-8 flex-1">
          <motion.div 
            key={location.pathname}
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
