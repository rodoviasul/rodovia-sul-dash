import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getContasERP, ContaERP } from '../services/api';

const CACHE_KEY_ERP = 'rodovia_sul_erp_contas';
const CACHE_KEY_TIMESTAMP = 'rodovia_sul_erp_last_sync';

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
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      let contasERP: ContaERP[] = [];
      const cachedERP = localStorage.getItem(CACHE_KEY_ERP);
      const cachedTime = localStorage.getItem(CACHE_KEY_TIMESTAMP);

      // 1. Lógica de Cache para o ERP
      if (!forceRefresh && cachedERP && cachedTime) {
        try {
          contasERP = JSON.parse(cachedERP);
          setLastSync(cachedTime);
        } catch (e) {
          console.error('Erro ao ler cache:', e);
          contasERP = await getContasERP();
        }
      } else {
        // Busca dados frescos do ERP
        contasERP = await getContasERP();
        const now = new Date().toLocaleString('pt-BR');
        localStorage.setItem(CACHE_KEY_ERP, JSON.stringify(contasERP));
        localStorage.setItem(CACHE_KEY_TIMESTAMP, now);
        setLastSync(now);
      }

      // 2. Busca configurações do Supabase (Sempre busca o mapeamento mais recente)
      const { data: configs, error: sbError } = await supabase
        .from('config_contas_gerencial')
        .select('*')
        .limit(10000);

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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return { 
    contas, 
    loading, 
    error, 
    lastSync,
    salvarConfiguracao, 
    refresh: () => fetchData(true) 
  };
};
