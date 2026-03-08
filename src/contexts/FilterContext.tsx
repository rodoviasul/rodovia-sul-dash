import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextType {
  period: string;
  month: string;
  setPeriod: (period: string) => void;
  setMonth: (month: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function FilterProvider({ children }: { children: ReactNode }) {
  // Estado inicial recuperado do localStorage ou data atual
  const [period, setPeriodState] = useState(() => {
    const stored = localStorage.getItem("dash_period");
    if (stored) return stored;
    return new Date().getFullYear().toString();
  });

  const [month, setMonthState] = useState(() => {
    const stored = localStorage.getItem("dash_month");
    if (stored) return stored;
    return MONTH_LABELS[new Date().getMonth()];
  });

  const setPeriod = (value: string) => {
    setPeriodState(value);
    localStorage.setItem("dash_period", value);
  };

  const setMonth = (value: string) => {
    setMonthState(value);
    localStorage.setItem("dash_month", value);
  };

  return (
    <FilterContext.Provider value={{ period, month, setPeriod, setMonth }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
