import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  FileText, 
  ArrowLeftRight, 
  Settings, 
  ChevronLeft,
  Menu
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, Outlet, useLocation } from 'react-router-dom';

interface SettingsLayoutProps {
  children?: React.ReactNode;
}

const MENU_ITEMS = [
  {
    category: "Financeiro",
    items: [
      { label: "De/Para Contas", href: "/configuracao/plano-contas", icon: ArrowLeftRight },
      { label: "Estrutura DRE", href: "/configuracao/estrutura-dre", icon: FileText },
      { label: "Estrutura Fluxo", href: "/configuracao/estrutura-fluxo", icon: Wallet },
    ]
  },
  {
    category: "Sistema",
    items: [
      { label: "Geral", href: "/configuracao/geral", icon: Settings },
    ]
  }
];

export default function SettingsLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          !sidebarOpen && "-translate-x-full md:w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Back */}
          <div className="h-16 flex items-center px-6 border-b border-zinc-100 dark:border-zinc-800">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-zinc-500 hover:text-rodovia-azul transition-colors group"
            >
              <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                <ChevronLeft className="w-4 h-4" />
              </div>
              {sidebarOpen && <span className="font-semibold text-sm tracking-wide">Voltar ao Dash</span>}
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
            {MENU_ITEMS.map((group, idx) => (
              <div key={idx}>
                {sidebarOpen && (
                  <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    {group.category}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    
                    return (
                      <Link 
                        key={item.href} 
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive 
                            ? "bg-rodovia-azul/10 text-rodovia-azul dark:bg-blue-500/10 dark:text-blue-400" 
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                        )}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-rodovia-azul dark:text-blue-400")} />
                        {sidebarOpen && <span>{item.label}</span>}
                        
                        {isActive && sidebarOpen && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-rodovia-azul dark:bg-blue-400" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center justify-center w-full p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
