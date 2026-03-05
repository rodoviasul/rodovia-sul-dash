import { useState, useEffect } from 'react';

type Theme = 'light';

export function useTheme() {
  // Sempre retorna light conforme solicitado
  const theme: Theme = 'light';

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.setItem('theme', 'light');
  }, []);

  const toggleTheme = () => {
    // No-op: Dark mode removido
  };

  return {
    theme,
    toggleTheme,
    isDark: false
  };
} 
