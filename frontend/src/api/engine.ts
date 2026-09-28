import { apiClient } from './client';

export const engineApi = {
  getStrategy: async (): Promise<{ activeStrategy: string }> => {
    const res = await apiClient.get<{ activeStrategy: string }>('/engine/strategy');
    return res.data;
  },

  setStrategy: async (strategy: 'AI' | 'RULE_BASED'): Promise<{ activeStrategy: string; status: string }> => {
    const res = await apiClient.post<{ activeStrategy: string; status: string }>(
      '/engine/strategy',
      null,
      { params: { strategy } }
    );
    return res.data;
  },
};
