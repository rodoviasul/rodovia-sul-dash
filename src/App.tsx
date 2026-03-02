import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MasterDashboard from "@/pages/MasterDashboard";
import DREDashboard from "@/pages/DREDashboard";
import CashFlowDashboard from "@/pages/CashFlowDashboard";

export default function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<MasterDashboard />} />
          <Route path="/dre" element={<DREDashboard />} />
          <Route path="/cash-flow" element={<CashFlowDashboard />} />
          <Route path="*" element={<div className="p-8 text-center font-serif text-xl italic">Página em Construção...</div>} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}
