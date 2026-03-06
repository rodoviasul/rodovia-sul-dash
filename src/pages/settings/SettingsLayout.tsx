import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  FileText, 
  Wallet, 
  Settings, 
  ChevronLeft,
  Menu,
  X,
  LogOut,
  Code2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const MENU_ITEMS = [
  {
    category: "FINANCEIRO",
    items: [
      { label: "PLANO DE CONTAS", href: "/configuracao/plano-contas", icon: ArrowLeftRight },
      { label: "ESTRUTURA DRE", href: "/configuracao/estrutura-dre", icon: FileText },
      { label: "ESTRUTURA FLUXO", href: "/configuracao/estrutura-fluxo", icon: Wallet },
    ]
  },
  {
    category: "LABORATÓRIO",
    items: [
      { label: "CONSULTAS SQL", href: "/configuracao/query-tester", icon: Code2 },
    ]
  },
  {
    category: "SISTEMA",
    items: [
      { label: "CONFIGURAÇÕES GERAIS", href: "/configuracao/geral", icon: Settings },
    ]
  }
];

export default function SettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logout realizado com sucesso");
      navigate("/login");
    } catch (error: any) {
      toast.error("Erro ao sair", { description: error.message });
    }
  };

  return (
    <div className="flex min-h-screen transition-colors duration-500 relative overflow-hidden bg-[#f1f3f5] text-[#1a1a1a] shadow-[inset_0_0_150px_rgba(0,0,0,0.08)]">
      {/* Background Video Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-70 grayscale transition-opacity duration-1000"
        >
          <source src="https://pub-d9db78d936464174b9a91bdd40fe3805.r2.dev/utils/fundo.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8f9fa] via-[#f8f9fa]/40 to-[#f8f9fa]" />
      </div>

      {/* Modern Glass Sidebar */}
      <aside 
        className={cn(
          "relative z-20 transition-all duration-500 ease-in-out h-screen",
          sidebarOpen ? "w-80" : "w-36"
        )}
      >
        <div className="h-[calc(100vh-2rem)] m-4 rounded-[2.5rem] border backdrop-blur-2xl flex flex-col shadow-2xl transition-all duration-500 bg-white border-black/5 shadow-zinc-200/50 relative">
          {/* Toggle Button - Half-in, half-out */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-zinc-200 shadow-md z-50 flex items-center justify-center text-rodovia-verde hover:scale-110 transition-all cursor-pointer"
          >
            <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform duration-500", !sidebarOpen && "rotate-180")} />
          </button>

          {/* Sidebar Header */}
          <div className={cn("p-8 transition-all duration-500", !sidebarOpen && "px-0 flex justify-center")}>
            <Link 
              to="/" 
              className={cn("flex items-center gap-4 group", !sidebarOpen && "gap-0")}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg bg-zinc-50 group-hover:bg-rodovia-verde/10 shrink-0">
                <ChevronLeft className="w-6 h-6 text-rodovia-verde" />
              </div>
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col overflow-hidden"
                  >
                    <span className="text-[10px] font-mono font-black text-rodovia-verde tracking-widest uppercase truncate">Voltar ao</span>
                    <span className="text-sm font-black tracking-tight uppercase truncate">Dashboard</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 space-y-10 py-4 scrollbar-none">
            {MENU_ITEMS.map((group, idx) => (
              <React.Fragment key={idx}>
                {/* Separator between Financeiro and Sistema when collapsed */}
                {!sidebarOpen && idx > 0 && (
                  <div className="mx-auto w-14 h-[2px] bg-rodovia-verde/80 my-10 shadow-[0_0_15px_rgba(36,172,132,0.4)]" />
                )}
                
                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    {sidebarOpen ? (
                      <motion.h3 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-6 text-[10px] font-black uppercase tracking-[0.3em] text-rodovia-verde opacity-60 truncate"
                      >
                        {group.category}
                      </motion.h3>
                    ) : null}
                  </AnimatePresence>
                  
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      const Icon = item.icon;
                      
                      return (
                        <Link 
                          key={item.href} 
                          to={item.href}
                          title={!sidebarOpen ? item.label : ""}
                          className={cn(
                            "flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black transition-all duration-300 group relative overflow-hidden",
                            isActive 
                              ? "bg-rodovia-verde text-white shadow-xl shadow-rodovia-verde/20" 
                              : "text-zinc-500 hover:text-zinc-900 hover:bg-black/5",
                            !sidebarOpen && "px-0 justify-center"
                          )}
                        >
                          <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-300", !isActive && "group-hover:scale-110")} />
                          <AnimatePresence mode="wait">
                            {sidebarOpen && (
                              <motion.span 
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="tracking-widest uppercase whitespace-nowrap"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          
                          {isActive && sidebarOpen && (
                            <motion.div 
                              layoutId="active-pill"
                              className="absolute left-0 w-1 h-6 bg-white rounded-full"
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Sidebar Footer - Logo & Company Name */}
          <div className={cn(
            "p-8 border-t border-black/5 flex flex-col items-center gap-4 transition-all duration-500",
            !sidebarOpen && "px-0 pb-8"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-white border border-black/5 overflow-hidden transition-all duration-500",
              !sidebarOpen && "w-10 h-10"
            )}>
              <img 
                src="https://wnombkybmahknwcyzfqz.supabase.co/storage/v1/object/public/utils/logo-rodovia.png" 
                alt="Rodovia Sul Logo" 
                className="w-full h-full object-contain p-2"
              />
            </div>
            
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-[11px] font-mono font-black text-rodovia-verde uppercase tracking-[0.4em] whitespace-nowrap">
                    RODOVIA SUL
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 flex flex-col h-screen">
        {/* Top Header Section with Logout */}
        <header className="flex-shrink-0 px-12 pt-8 pb-4 flex items-center justify-between">
          <div className="flex-1" /> {/* Spacer */}
          
          <div className="text-center space-y-1">
            <h1 className="text-sm font-mono font-black uppercase tracking-[1em] transition-all duration-500 text-rodovia-verde">
              CONFIGURAÇÕES DO SISTEMA
            </h1>
          </div>

          <div className="flex-1 flex justify-end">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border rounded-full transition-all group bg-white border-black/5 shadow-sm hover:bg-red-50 hover:border-red-100 shadow-red-100/20"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500 group-hover:text-red-600 transition-colors" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest transition-colors text-zinc-400 group-hover:text-red-600">SAIR</span>
            </button>
          </div>
        </header>

        {/* Page Content Area - Fixed Height with Sidebar Alignment */}
        <div className="flex-1 min-h-0 pt-4 pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
