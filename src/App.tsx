import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MasterDashboard from "@/pages/MasterDashboard";
import DREDashboard from "@/pages/DREDashboard";
import CashFlowDashboard from "@/pages/CashFlowDashboard";
import Login from "@/pages/Login";
import SettingsLayout from "@/pages/settings/SettingsLayout";
import PlanoContas from "@/pages/settings/PlanoContas";
import EstruturaDRE from "@/pages/settings/EstruturaDRE";
import EstruturaFluxo from "@/pages/settings/EstruturaFluxo";
import QueryTester from "@/pages/settings/QueryTester";
import { Toaster } from "@/components/ui/sonner";

import { FilterProvider } from "@/contexts/FilterContext";

// Wrapper para layout do Dashboard
const DashboardWrapper = () => (
  <FilterProvider>
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  </FilterProvider>
);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFCFC]">
        <div className="w-10 h-10 border-4 border-rodovia-verde border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="bottom-right" richColors closeButton />
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/" replace />} 
        />
        
        {session ? (
          <>
            {/* Rotas do Dashboard (Com Layout Principal) */}
            <Route element={<DashboardWrapper />}>
              <Route path="/" element={<MasterDashboard />} />
              <Route path="/dre" element={<DREDashboard />} />
              <Route path="/cash-flow" element={<CashFlowDashboard />} />
            </Route>

            {/* Rotas de Configuração (Layout Exclusivo) */}
            <Route path="/configuracao" element={<SettingsLayout />}>
              <Route index element={<Navigate to="plano-contas" replace />} />
              <Route path="plano-contas" element={<PlanoContas />} />
              <Route path="estrutura-dre" element={<EstruturaDRE />} />
              <Route path="estrutura-fluxo" element={<EstruturaFluxo />} />
              <Route path="query-tester" element={<QueryTester />} />
            </Route>

            {/* 404 dentro do Dashboard */}
            <Route path="*" element={
              <DashboardLayout>
                <div className="p-8 text-center font-serif text-xl italic text-rodovia-azul">Página não encontrada</div>
              </DashboardLayout>
            } />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}
