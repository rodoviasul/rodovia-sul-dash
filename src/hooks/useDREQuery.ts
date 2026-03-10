import { useState, useEffect } from 'react';
import { useContas } from './useContas';
import { useDominios } from './useDominios';
import { executeLocalQuery, registerTable } from '../services/duckdb';

export interface DREIndicador {
  periodo: string;
  receita_bruta: number;
  deducoes: number;
  receita_liquida: number;
  custo_fixo: number;
  custo_variavel: number;
  despesa_fixa: number;
  despesa_variavel: number;
  margem_bruta: number;
  margem_contribuicao: number;
  ebitda: number;
  res_financeiro_liq: number;
  res_antes_nr: number;
  resultado_liquido: number;
}

export const useDREQuery = (startDate: string, endDate: string) => {
  const { contas, loading: loadingContas } = useContas();
  const { categoriasDRE, subcategoriasDRE, loading: loadingDominios } = useDominios();
  const [data, setData] = useState<DREIndicador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runQuery = async () => {
      // Aguarda o carregamento das configs do Supabase
      if (loadingContas || loadingDominios) return;

      try {
        setLoading(true);
        setError(null);

        // 1. Registra tabelas virtuais do Supabase no DuckDB
        // Prepara config_contas simplificada para evitar objetos complexos
        const configContasData = contas.map(c => ({
          concod: c.concod,
          dre_categoria_id: c.dre_categoria_id,
          dre_subcategoria_id: c.dre_subcategoria_id,
          dre_sinal: c.dre_sinal
        }));

        // Registra as tabelas em memória
        await registerTable('virtual_config_contas', configContasData);
        await registerTable('virtual_categorias_dre', categoriasDRE);
        await registerTable('virtual_subcategorias_dre', subcategoriasDRE);

        // 2. Query SQL Adaptada para calcular indicadores
        // Cruza dados do Parquet (S3) com as tabelas virtuais (Supabase)
        const query = `
          WITH unified_movs AS (
              SELECT reclan AS lan, recconta AS conta, recvalor AS valor FROM tabreceb
              UNION ALL
              SELECT deslan AS lan, desconta AS conta, desvalor AS valor FROM tabdespesas
          ),
          raw_data AS (
              SELECT
                  -- m.movfilial as filial, -- Removido temporariamente
                  strftime(m.movdatacxa, '%Y-%m') as periodo,
                  cat.ordem as categoria_ordem,
                  -- Multiplica pelo sinal configurado (1 para receita, -1 para despesa)
                  SUM(u.valor * COALESCE(conf.dre_sinal, 1)) as valor_categoria
              FROM tabmovimento AS m
              INNER JOIN unified_movs u ON m.movlanc = u.lan
              -- JOIN com as tabelas virtuais registradas
              LEFT JOIN virtual_config_contas conf ON u.conta = conf.concod
              LEFT JOIN virtual_subcategorias_dre sub ON conf.dre_subcategoria_id = sub.id
              LEFT JOIN virtual_categorias_dre cat ON sub.categoria_id = cat.id
              WHERE m.movdatacxa BETWEEN '${startDate}' AND '${endDate}'
                AND cat.dre = true
              GROUP BY 1, 2
          ),
          pivoted AS (
              SELECT
                  -- filial,
                  periodo,
                  sum(case when categoria_ordem = 1 then valor_categoria else 0 end) as receita_bruta,
                  sum(case when categoria_ordem = 2 then valor_categoria else 0 end) as deducoes,
                  sum(case when categoria_ordem = 4 then valor_categoria else 0 end) as custo_fixo,
                  sum(case when categoria_ordem = 5 then valor_categoria else 0 end) as custo_variavel,
                  sum(case when categoria_ordem = 7 then valor_categoria else 0 end) as despesa_variavel,
                  sum(case when categoria_ordem = 9 then valor_categoria else 0 end) as despesa_fixa,
                  sum(case when categoria_ordem = 11 then valor_categoria else 0 end) as rec_financeira,
                  sum(case when categoria_ordem = 12 then valor_categoria else 0 end) as desp_financeira,
                  sum(case when categoria_ordem = 15 then valor_categoria else 0 end) as rec_nao_operacional,
                  sum(case when categoria_ordem = 16 then valor_categoria else 0 end) as desp_nao_operacional
              FROM raw_data
              GROUP BY 1
          )
          SELECT
              -- filial,
              periodo,
              ROUND(receita_bruta, 2) as receita_bruta,
              ROUND(deducoes, 2) as deducoes,
              ROUND(ABS(custo_fixo), 2) as custo_fixo,
              ROUND(ABS(custo_variavel), 2) as custo_variavel,
              ROUND(ABS(despesa_fixa), 2) as despesa_fixa,
              ROUND(ABS(despesa_variavel), 2) as despesa_variavel,
              -- 1. Receita Líquida (Receita Bruta + Deduções, pois Deduções já é negativo)
              ROUND(receita_bruta + deducoes, 2) as receita_liquida,
              
              -- 2. Margem Bruta (Receita Líquida + Custos, pois Custos já são negativos)
              ROUND((receita_bruta + deducoes) + custo_fixo + custo_variavel, 2) as margem_bruta,
              
              -- 3. Margem de Contribuição (Margem Bruta + Despesa Variável)
              ROUND(((receita_bruta + deducoes) + custo_fixo + custo_variavel) + despesa_variavel, 2) as margem_contribuicao,
              
              -- 4. EBITDA Gerencial (Margem Contribuição + Despesa Fixa)
              ROUND((((receita_bruta + deducoes) + custo_fixo + custo_variavel) + despesa_variavel) + despesa_fixa, 2) as ebitda,
              
              -- 5. Resultado Financeiro Líquido (Receita Financeira + Despesa Financeira)
              ROUND(rec_financeira + desp_financeira, 2) as res_financeiro_liq,
              
              -- 6. Resultado Antes de Não Recorrentes (EBITDA + Financeiro)
              ROUND(((((receita_bruta + deducoes) + custo_fixo + custo_variavel) + despesa_variavel) + despesa_fixa) + (rec_financeira + desp_financeira), 2) as res_antes_nr,
              
              -- 7. Resultado Líquido do Período (Final)
              ROUND((((((receita_bruta + deducoes) + custo_fixo + custo_variavel) + despesa_variavel) + despesa_fixa) + (rec_financeira + desp_financeira)) + rec_nao_operacional + desp_nao_operacional, 2) as resultado_liquido
          FROM pivoted
          ORDER BY periodo
        `;

        const result = await executeLocalQuery(query);
        setData(result.data as DREIndicador[]);

      } catch (err: any) {
        console.error("Erro ao executar query DRE:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    runQuery();
  }, [contas, categoriasDRE, subcategoriasDRE, loadingContas, loadingDominios, startDate, endDate]);

  return { data, loading, error };
};
