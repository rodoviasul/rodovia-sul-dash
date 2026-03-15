import { useState, useEffect } from 'react';
import { useContas } from './useContas';
import { useDominios } from './useDominios';
import { executeLocalQuery, registerTable } from '../services/duckdb';

export interface DFCFlowData {
  periodo: string;
  banco_id: number;
  banco_nome: string;
  concod: string | null;
  condescr: string | null;
  tipo_fluxo: string;
  contip: string | null;
  entradas: number;
  saidas: number;
  liquido: number;
  movlanc?: number;
  movdata?: string;
  movobs?: string;
  banlistager?: string;
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
          dre_sinal: c.dre_sinal,
          contip: c.contip // Adicionado para identificar Transferências de Saída
        }));

        await registerTable('virtual_config_contas_dfc', configContasData);
        await registerTable('virtual_tipos_flow', tiposFluxo);

        // 2. Query Construction
        
        // Definição da CTE classified_movs que será usada em ambas as queries
        // Definição da CTE classified_movs que será usada em ambas as queries
        const classifiedMovsCTE = `
          classified_movs AS (
              SELECT
                  m.movdata as data,
                  m.movbanco as banco_id,
                  b.banlistager,
                  COALESCE(u.recvalor, m.movvalor) as valor_abs,
                  u.recconta as concod,
                  c.condescr,
                  c.contip,
                  m.movlanc,
                  m.movdata as movdata_orig,
                  m.movobs,
                  CASE 
                    WHEN (m.movtipolan = 'E' AND CAST(m.movfornec AS TEXT) LIKE '%956%') THEN 'TRANSFERÊNCIA'
                    WHEN u.recconta = '61' THEN 'NÃO CLASSIFICADO'
                    WHEN tf.nome IS NOT NULL THEN tf.nome
                    WHEN c.contip IN ('R', 'E') THEN 'OPERACIONAL'
                    ELSE 'NÃO CLASSIFICADO'
                  END as tipo_fluxo,
                  (COALESCE(u.recvalor, m.movvalor) * CASE WHEN u.recconta IN ('217', '227') THEN -1 ELSE 1 END) as valor_assinado,
                  CASE 
                    WHEN u.recconta IN ('217', '227') THEN 'D_REFUND'
                    WHEN (c.contip IN ('R', 'E') OR u.recconta IS NULL) OR (CAST(m.movfornec AS TEXT) LIKE '%956%') THEN 'C'
                    ELSE 'C_REFUND' 
                  END as direction
              FROM tabmovimento m
              LEFT JOIN tabbancos b ON m.movbanco = b.codigo
              LEFT JOIN tabreceb u ON m.movlanc = u.reclan
              LEFT JOIN tabcontas c ON u.recconta = c.concod
              LEFT JOIN virtual_config_contas_dfc conf ON u.recconta = conf.concod
              LEFT JOIN virtual_tipos_flow tf ON conf.fluxo_tipo_id = tf.id
              WHERE m.movtipolan = 'E'

              UNION ALL

              SELECT
                  m.movdatacxa as data,
                  m.movbanco as banco_id,
                  b.banlistager,
                  CASE WHEN c.contip = 'T' THEN m.movvalor ELSE COALESCE(u.desvalor, m.movvalor) END as valor_abs,
                  u.desconta as concod,
                  c.condescr,
                  c.contip,
                  m.movlanc,
                  m.movdata as movdata_orig,
                  m.movobs,
                  CASE 
                    WHEN (m.movtipolan = 'S' AND c.contip = 'T') THEN 'TRANSFERÊNCIA'
                    WHEN tf.nome IS NOT NULL THEN tf.nome
                    WHEN c.contip IN ('D', 'S', 'P', 'T', 'C') THEN 'OPERACIONAL'
                    ELSE 'NÃO CLASSIFICADO'
                  END as tipo_fluxo,
                  (CASE WHEN c.contip = 'T' THEN m.movvalor ELSE COALESCE(u.desvalor, m.movvalor) END * -1) as valor_assinado,
                  CASE 
                    WHEN (c.contip IN ('D', 'S', 'P', 'T', 'C') OR u.desconta IS NULL) OR (c.contip = 'T') THEN 'D'
                    ELSE 'D_REFUND' 
                  END as direction
              FROM tabmovimento m
              LEFT JOIN tabbancos b ON m.movbanco = b.codigo
              LEFT JOIN tabdespesas u ON m.movlanc = u.deslan
              LEFT JOIN tabcontas c ON u.desconta = c.concod
              LEFT JOIN virtual_config_contas_dfc conf ON u.desconta = conf.concod
              LEFT JOIN virtual_tipos_flow tf ON conf.fluxo_tipo_id = tf.id
              WHERE m.movtipolan = 'S'

              UNION ALL

              -- Duplicação para Entradas Extras com 956 (Solicitado pelo usuário)
              -- Permite que o valor apareça em 'OPERACIONAL' mas não afeta o saldo (valor_assinado = 0)
              SELECT
                  m.movdata as data,
                  m.movbanco as banco_id,
                  b.banlistager,
                  COALESCE(u.recvalor, m.movvalor) as valor_abs,
                  u.recconta as concod,
                  c.condescr,
                  c.contip,
                  m.movlanc,
                  m.movdata as movdata_orig,
                  m.movobs,
                  'OPERACIONAL' as tipo_fluxo,
                  0 as valor_assinado, 
                  'C_956_DUPLICATE' as direction
              FROM tabmovimento m
              LEFT JOIN tabbancos b ON m.movbanco = b.codigo
              JOIN tabreceb u ON m.movlanc = u.reclan
              JOIN tabcontas c ON u.recconta = c.concod
              WHERE m.movtipolan = 'E' 
                AND CAST(m.movfornec AS TEXT) LIKE '%956%'
                AND c.contip IN ('R', 'E')

              UNION ALL

              SELECT 
                  m.movdata as data,
                  m.movbanco as banco_id,
                  b.banlistager,
                  (m.movvalor - COALESCE(res.total_rec, 0)) as valor_abs,
                  'DIF' as concod,
                  'DIFERENÇA ENTRE CAIXA E TÍTULO' as condescr,
                  NULL as contip,
                  m.movlanc,
                  m.movdata as movdata_orig,
                  m.movobs,
                  'DIFERENÇA' as tipo_fluxo,
                  (m.movvalor - COALESCE(res.total_rec, 0)) as valor_assinado,
                  'C' as direction
              FROM tabmovimento m
              LEFT JOIN tabbancos b ON m.movbanco = b.codigo
              LEFT JOIN (
                  SELECT 
                      reclan, 
                      SUM(recvalor) as total_rec
                  FROM tabreceb 
                  GROUP BY reclan
              ) res ON m.movlanc = res.reclan
              WHERE m.movtipolan = 'E'
              AND CAST(m.movfornec AS TEXT) NOT LIKE '%956%'
              AND m.movvalor <> (SELECT SUM(recvalor) FROM tabreceb WHERE reclan = m.movlanc)
              AND NOT EXISTS (SELECT 1 FROM tabreceb WHERE reclan = m.movlanc AND recconta = '61')

              UNION ALL

              SELECT 
                  m.movdatacxa as data,
                  m.movbanco as banco_id,
                  b.banlistager,
                  (m.movvalor - COALESCE(res.total_des, 0)) as valor_abs,
                  'DIF' as concod,
                  'DIFERENÇA ENTRE CAIXA E TÍTULO' as condescr,
                  NULL as contip,
                  m.movlanc,
                  m.movdata as movdata_orig,
                  m.movobs,
                  'DIFERENÇA' as tipo_fluxo,
                  -(m.movvalor - COALESCE(res.total_des, 0)) as valor_assinado,
                  'D' as direction
              FROM tabmovimento m
              LEFT JOIN tabbancos b ON m.movbanco = b.codigo
              LEFT JOIN (
                  SELECT 
                      deslan, 
                      SUM(desvalor) as total_des
                  FROM tabdespesas 
                  GROUP BY deslan
              ) res ON m.movlanc = res.deslan
              WHERE m.movtipolan = 'S'
              AND CAST(m.movfornec AS TEXT) NOT LIKE '%956%'
              AND m.movvalor <> COALESCE(res.total_des, 0)
              AND NOT EXISTS (SELECT 1 FROM tabdespesas WHERE deslan = m.movlanc AND desconta = '61')
          )
        `;

        const balanceQuery = `WITH ${classifiedMovsCTE} SELECT 
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
          WHERE b.banlistager = 'S'`;

        const flowsQuery = `WITH ${classifiedMovsCTE} SELECT
              strftime(data, '%Y-%m') as periodo,
              m.banco_id,
              b.banco as banco_nome,
              m.concod,
              m.condescr,
              tipo_fluxo,
              m.contip,
              SUM(CASE WHEN direction IN ('C', 'C_956_DUPLICATE') THEN valor_abs WHEN direction = 'D_REFUND' THEN -valor_abs ELSE 0 END) as entradas,
              SUM(CASE WHEN direction = 'D' THEN valor_abs WHEN direction = 'C_REFUND' THEN -valor_abs ELSE 0 END) as saidas,
              SUM(valor_assinado) as liquido,
              MAX(movlanc) as movlanc,
              FIRST(movdata_orig) as movdata,
              MAX(movobs) as movobs,
              MAX(m.banlistager) as banlistager
          FROM classified_movs m
          LEFT JOIN tabbancos b ON m.banco_id = b.codigo
          WHERE data BETWEEN '${startDate}' AND '${endDate}'
          GROUP BY 1, 2, 3, 4, 5, 6, 7, (CASE WHEN tipo_fluxo = 'DIFERENÇA' THEN movlanc ELSE NULL END)
          ORDER BY 1, 2, 4`;

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
