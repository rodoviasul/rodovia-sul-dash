import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MasterDashboard from "@/pages/MasterDashboard";
import DREDashboard from "@/pages/DREDashboard";
import CashFlowDashboard from "@/pages/CashFlowDashboard";
import Login from "@/pages/Login";
import { Toaster } from "@/components/ui/sonner";

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
        
        <Route
          path="/*"
          element={
            session ? (
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<MasterDashboard />} />
                  <Route path="/dre" element={<DREDashboard />} />
                  <Route path="/cash-flow" element={<CashFlowDashboard />} />
                  <Route path="*" element={<div className="p-8 text-center font-serif text-xl italic text-rodovia-azul">Página não encontrada</div>} />
                </Routes>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}
