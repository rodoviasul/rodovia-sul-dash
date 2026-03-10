import { useState, useEffect } from 'react';
import { useContas } from './useContas';
import { useDominios } from './useDominios';
import { executeLocalQuery, registerTable } from '../services/duckdb';

export interface DFCFlowData {
  periodo: string;
  banco_id: number;
  banco_nome: string;
  tipo_fluxo: string;
  entradas: number;
  saidas: number;
  liquido: number;
}

export interface DFCBankBalance {
  banco_id: number;
  banco_nome: string;
  saldo_inicial: number;
}

export const useDFCQuery = (startDate: string, endDate: string) => {
  const { contas, loading: loadingContas } = useContas();
  const { tiposFluxo, loading: loadingDominios } = useDominios();
  const [flows, setFlows] = useState<DFCFlowData[]>([]);
  const [initialBalances, setInitialBalances] = useState<DFCBankBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runQuery = async () => {
      if (loadingContas || loadingDominios) return;

      try {
        setLoading(true);
        setError(null);

        // 1. Register Virtual Tables
        const configContasData = contas.map(c => ({
          concod: c.concod,
          fluxo_tipo_id: c.fluxo_tipo_id,
          dre_sinal: c.dre_sinal
        }));

        await registerTable('virtual_config_contas_dfc', configContasData);
        await registerTable('virtual_tipos_fluxo', tiposFluxo);

        // 2. Query Construction
        
        // Initial Balances Query
        const balanceQuery = `
          WITH unified_movs AS (
              SELECT reclan AS lan, recconta AS conta, recvalor AS valor FROM tabreceb
              UNION ALL
              SELECT deslan AS lan, desconta AS conta, desvalor AS valor FROM tabdespesas
          ),
          classified_movs AS (
              SELECT
                  m.movdatacxa as data,
                  m.movbanco as banco_id,
                  CASE 
                    WHEN conf.dre_sinal IS NOT NULL THEN (m.movvalor * conf.dre_sinal)
                    ELSE 0 
                  END as valor_assinado
              FROM tabmovimento m
              LEFT JOIN unified_movs u ON m.movlanc = u.lan
              LEFT JOIN virtual_config_contas_dfc conf ON u.conta = conf.concod
          )
          SELECT 
              b.codigo as banco_id,
              b.banco as banco_nome,
              COALESCE(b.saldoini, 0) + COALESCE(h.total, 0) as saldo_inicial
          FROM tabbancos b
          LEFT JOIN (
              SELECT banco_id, SUM(valor_assinado) as total 
              FROM classified_movs 
              WHERE data < '${startDate}'
              GROUP BY banco_id
          ) h ON b.codigo = h.banco_id
        `;

        // Flows Query
        const flowsQuery = `
          WITH unified_movs AS (
              SELECT reclan AS lan, recconta AS conta, recvalor AS valor FROM tabreceb
              UNION ALL
              SELECT deslan AS lan, desconta AS conta, desvalor AS valor FROM tabdespesas
          ),
          classified_movs AS (
              SELECT
                  m.movdatacxa as data,
                  m.movbanco as banco_id,
                  m.movvalor as valor_abs,
                  COALESCE(tf.nome, 'Operacional') as tipo_fluxo,
                  CASE 
                    WHEN conf.dre_sinal IS NOT NULL THEN (m.movvalor * conf.dre_sinal)
                    ELSE 0 
                  END as valor_assinado,
                  CASE 
                    WHEN conf.dre_sinal = 1 THEN 'C'
                    WHEN conf.dre_sinal = -1 THEN 'D'
                    ELSE 'X' 
                  END as direction
              FROM tabmovimento m
              LEFT JOIN unified_movs u ON m.movlanc = u.lan
              LEFT JOIN virtual_config_contas_dfc conf ON u.conta = conf.concod
              LEFT JOIN virtual_tipos_fluxo tf ON conf.fluxo_tipo_id = tf.id
          )
          SELECT
              strftime(data, '%Y-%m') as periodo,
              m.banco_id,
              b.banco as banco_nome,
              tipo_fluxo,
              SUM(CASE WHEN direction = 'C' THEN valor_abs ELSE 0 END) as entradas,
              SUM(CASE WHEN direction = 'D' THEN valor_abs ELSE 0 END) as saidas,
              SUM(valor_assinado) as liquido
          FROM classified_movs m
          LEFT JOIN tabbancos b ON m.banco_id = b.codigo
          WHERE data BETWEEN '${startDate}' AND '${endDate}'
          GROUP BY 1, 2, 3, 4
          ORDER BY 1, 2
        `;

        const [balanceResult, flowsResult] = await Promise.all([
            executeLocalQuery(balanceQuery),
            executeLocalQuery(flowsQuery)
        ]);

        setInitialBalances(balanceResult.data);
        setFlows(flowsResult.data);

      } catch (err: any) {
        console.error("Erro DFC:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    runQuery();
  }, [contas, tiposFluxo, loadingContas, loadingDominios, startDate, endDate]);

  return { flows, initialBalances, loading, error };
};
