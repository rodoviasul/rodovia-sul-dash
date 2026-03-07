import axios from 'axios';
import { executeLocalQuery } from './duckdb';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'x-api-token': import.meta.env.VITE_API_TOKEN,
  },
});

export interface ContaERP {
  concod: string;
  condescr: string;
  contip: string; // D, R, C, E, T
  congrupo: string;
  congrupores: string;
  convariavel: string; // V ou F
}

export const getContasERP = async (): Promise<ContaERP[]> => {
  const useLocal = !!(import.meta.env.VITE_S3_ACCESS_KEY_ID && import.meta.env.VITE_S3_SECRET_ACCESS_KEY);

  if (useLocal) {
    try {
      const result = await executeLocalQuery("SELECT * FROM tabcontas");
      return result.data as ContaERP[];
    } catch (err) {
      console.warn('Falha ao carregar contas localmente:', err);
      // Se falhar local, tenta API como fallback
    }
  }

  // Fallback para API (caso não tenha config local ou falhe)
  const response = await api.get('/tabcontas', {
    params: {
      limit: 9999,
    },
  });
  
  // A API retorna { table: "...", count: N, data: [...] }
  return response.data.data || []; 
};

/**
 * Executa uma query SQL arbitrária no DuckDB via API ou Localmente (DuckDB-Wasm)
 */
export const executeQuery = async (sql: string): Promise<{ data: any[], columns?: { name: string, type: string }[] }> => {
  const useLocal = !!(import.meta.env.VITE_S3_ACCESS_KEY_ID && import.meta.env.VITE_S3_SECRET_ACCESS_KEY);

  if (useLocal) {
    try {
      return await executeLocalQuery(sql);
    } catch (err) {
      console.warn('Falha na query local, tentando via API...', err);
      // Fallback para API
    }
  }

  const response = await axios.post('/api/v1/query', {}, {
    params: { query: sql },
    headers: {
      'accept': 'application/json',
      'x-api-token': import.meta.env.VITE_API_TOKEN,
    }
  });
  
  return { data: response.data.data || [] };
};

export default api;
