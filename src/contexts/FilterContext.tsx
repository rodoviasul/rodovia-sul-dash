import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextType {
  period: string;
  month: string;
  setPeriod: (period: string) => void;
  setMonth: (month: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  // Estado inicial recuperado do localStorage ou padrão
  const [period, setPeriodState] = useState(() => localStorage.getItem("dash_period") || "2026");
  const [month, setMonthState] = useState(() => localStorage.getItem("dash_month") || "Jan");

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
