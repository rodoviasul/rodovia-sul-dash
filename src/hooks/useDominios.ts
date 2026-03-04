import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Tipos para DRE
export interface CategoriaDRE {
  id: string;
  nome: string;
  ordem: number;
}

export interface SubcategoriaDRE {
  id: string;
  categoria_id: string;
  nome: string;
}

// Tipos para Fluxo de Caixa
export interface TipoFluxo {
  id: string;
  nome: string;
  ordem: number;
}

export interface CategoriaFluxo {
  id: string;
  tipo_id: string;
  nome: string;
  ordem: number;
}

export const useDominios = () => {
  // Estados DRE
  const [categoriasDRE, setCategoriasDRE] = useState<CategoriaDRE[]>([]);
  const [subcategoriasDRE, setSubcategoriasDRE] = useState<SubcategoriaDRE[]>([]);
  
  // Estados Fluxo
  const [tiposFluxo, setTiposFluxo] = useState<TipoFluxo[]>([]);
  const [categoriasFluxo, setCategoriasFluxo] = useState<CategoriaFluxo[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDominios = async () => {
      try {
        setLoading(true);
        
        // 1. DRE
        const { data: dreCats } = await supabase.from('fin_categorias_dre').select('*').order('ordem');
        const { data: dreSub } = await supabase.from('fin_subcategorias_dre').select('*').order('nome');

        // 2. Fluxo
        const { data: fluxoTipos } = await supabase.from('fin_fluxo_tipos').select('*').order('ordem');
        const { data: fluxoCats } = await supabase.from('fin_fluxo_categorias').select('*').order('ordem');

        setCategoriasDRE(dreCats || []);
        setSubcategoriasDRE(dreSub || []);
        setTiposFluxo(fluxoTipos || []);
        setCategoriasFluxo(fluxoCats || []);

      } catch (error) {
        console.error('Erro ao carregar domínios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDominios();
  }, []);

  // Helpers
  const getSubcategoriasDRE = (categoriaId: string) => {
    return subcategoriasDRE.filter(s => s.categoria_id === categoriaId);
  };

  const getCategoriasFluxo = (tipoId: string) => {
    return categoriasFluxo.filter(c => c.tipo_id === tipoId);
  };

  return { 
    categoriasDRE, 
    subcategoriasDRE, 
    tiposFluxo, 
    categoriasFluxo,
    getSubcategoriasDRE,
    getCategoriasFluxo,
    loading 
  };
};
