import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getContasERP, ContaERP } from '../services/api';

export interface ContaUnificada extends ContaERP {
  // Configuração (IDs Relacionais)
  dre_categoria_id: string | null;
  dre_subcategoria_id: string | null;
  dre_sinal: number | null;
  fluxo_tipo_id: string | null;
  fluxo_categoria_id: string | null;
  
  // Flag para UI
  precisa_configurar: boolean;
}

export const useContas = () => {
  const [contas, setContas] = useState<ContaUnificada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Busca dados do ERP (API Legada)
      const contasERP = await getContasERP();

      // 2. Busca configurações do Supabase (Inteligência)
      const { data: configs, error: sbError } = await supabase
        .from('config_contas_gerencial')
        .select('*');

      if (sbError) throw sbError;

      // 3. Cria um Map para busca rápida (O(1)) das configurações
      const configMap = new Map(configs?.map((c) => [c.concod, c]));

      // 4. Junta tudo (Left Join na memória)
      const unificadas: ContaUnificada[] = contasERP.map((erp) => {
        const config = configMap.get(erp.concod);
        
        // Verifica se tem configuração válida (categoria e subcategoria preenchidas)
        const temConfig = !!(config && config.dre_categoria_id && config.dre_subcategoria_id);

        return {
          ...erp,
          dre_categoria_id: config?.dre_categoria_id || null,
          dre_subcategoria_id: config?.dre_subcategoria_id || null,
          dre_sinal: config?.dre_sinal || (erp.contip === 'R' || erp.contip === 'E' ? 1 : -1),
          fluxo_tipo_id: config?.fluxo_tipo_id || null,
          fluxo_categoria_id: config?.fluxo_categoria_id || null,
          precisa_configurar: !temConfig,
        };
      });

      setContas(unificadas);
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
      setError('Falha ao carregar dados. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Função para salvar uma configuração individual
  const salvarConfiguracao = async (conta: ContaUnificada, novosDados: Partial<ContaUnificada>) => {
    try {
      const payload = {
        concod: conta.concod,
        dre_categoria_id: novosDados.dre_categoria_id,
        dre_subcategoria_id: novosDados.dre_subcategoria_id,
        dre_sinal: novosDados.dre_sinal,
        fluxo_tipo_id: novosDados.fluxo_tipo_id,
        fluxo_categoria_id: novosDados.fluxo_categoria_id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('config_contas_gerencial')
        .upsert(payload);

      if (error) throw error;

      // Atualiza estado local para refletir na hora (UI Otimista)
      setContas((prev) =>
        prev.map((c) =>
          c.concod === conta.concod ? { ...c, ...novosDados, precisa_configurar: false } : c
        )
      );
      
      return true;
    } catch (err) {
      console.error('Erro ao salvar:', err);
      return false;
    }
  };

  return { contas, loading, error, salvarConfiguracao, refresh: fetchData };
};
