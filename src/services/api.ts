import axios from 'axios';

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
  // Solicitando limit=9999 para garantir o carregamento de todas as contas
  const response = await api.get('/tabcontas', {
    params: {
      limit: 9999,
    },
  });
  
  // A API retorna { table: "...", count: N, data: [...] }
  return response.data.data || []; 
};

export default api;
