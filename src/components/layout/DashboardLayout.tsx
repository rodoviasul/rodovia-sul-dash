import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Settings, 
  LogOut, 
  Maximize2,
  Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <div className="flex min-h-screen relative bg-[#f8f9fa] text-[#1a1a1a]">
      {/* Background Video Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-70 grayscale"
        >
          <source src="https://pub-d9db78d936464174b9a91bdd40fe3805.r2.dev/utils/fundo.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlays to ensure readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8f9fa] via-transparent to-[#f8f9fa]" />
      </div>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col">
        {/* Modern Sticky Header */}
        <header className="sticky top-0 z-50 w-full px-8 py-3 backdrop-blur-xl border-b border-black/[0.03] bg-white/70 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)]">
          <div className="max-w-[1800px] mx-auto flex items-center justify-between">
            {/* Left: Brand & Title */}
            <div className="flex items-center gap-6 group cursor-pointer" onClick={() => navigate("/")}>
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-lg p-2.5 border border-black/5 flex items-center justify-center group-hover:scale-105 group-hover:shadow-rodovia-verde/20 group-hover:shadow-2xl">
                  <img 
                    src="https://wnombkybmahknwcyzfqz.supabase.co/storage/v1/object/public/utils/logo-rodovia.png" 
                    alt="Rodovia Sul Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Status indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-rodovia-verde border-2 border-white rounded-full shadow-sm" />
              </div>
              
              <div className="flex flex-col">
                <h1 className="text-sm font-black uppercase tracking-[0.4em] text-rodovia-azul leading-none group-hover:text-rodovia-verde">
                  RODOVIA SUL
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-mono font-black text-rodovia-verde uppercase tracking-[0.2em]">PERFORMANCE GERAL</span>
                </div>
              </div>
            </div>

            {/* Right: Navigation, Filters & Actions */}
            <div className="flex items-center gap-3">
              {/* Main Navigation HUD */}
              <div className="flex items-center gap-1 p-1 bg-zinc-100/50 backdrop-blur-md border border-black/[0.03] rounded-2xl shadow-inner">
                {/* Nav Tabs */}
                <nav className="flex items-center gap-1 pr-2">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          "relative px-5 py-2 rounded-2xl text-[10px] font-mono font-black tracking-widest overflow-hidden",
                          isActive 
                            ? "bg-rodovia-azul text-white shadow-lg shadow-rodovia-azul/20"
                            : "text-zinc-400 hover:text-rodovia-azul hover:bg-white"
                        )}
                      >
                        {item.label}
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rodovia-verde" />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                <div className="h-6 w-px bg-zinc-200 mx-1" />

                {/* Filters Integrated */}
                <DashboardFilters />
              </div>

              <div className="h-8 w-px bg-zinc-200 mx-2" />

              {/* Action Buttons Group */}
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={toggleFullScreen}
                        className="flex items-center justify-center w-10 h-10 rounded-2xl border border-black/5 bg-white shadow-sm hover:shadow-md hover:bg-zinc-50 text-zinc-400 hover:text-rodovia-verde group"
                      >
                        {isFullScreen ? (
                          <Minimize2 className="w-4 h-4" />
                        ) : (
                          <Maximize2 className="w-4 h-4 group-hover:scale-110" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-900 text-white border-none text-[10px] font-mono font-bold">
                      {isFullScreen ? "REDUZIR TELA" : "TELA CHEIA"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Link to="/configuracao">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center w-10 h-10 rounded-2xl border border-black/5 bg-white shadow-sm hover:shadow-md hover:bg-zinc-50 text-zinc-400 hover:text-rodovia-verde">
                          <Settings className="w-4 h-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-900 text-white border-none text-[10px] font-mono font-bold">
                        CONFIGURAÇÕES
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Link>

                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 border border-black/5 rounded-2xl bg-white shadow-sm hover:bg-red-50 hover:border-red-100 hover:shadow-lg hover:shadow-red-500/10 group"
                >
                  <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-500 group-hover:scale-110" />
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 group-hover:text-red-600">SAIR</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="px-12 py-8 flex-1">
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
