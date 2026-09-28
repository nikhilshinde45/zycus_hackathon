import { apiClient } from './client';
import { Product, PricingSuggestion, ReorderSuggestion } from '../types';

export const productsApi = {
  getProducts: async (params?: { category?: string; status?: string }): Promise<Product[]> => {
    const res = await apiClient.get<Product[]>('/products', { params });
    return res.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const res = await apiClient.get<Product>(`/products/${id}`);
    return res.data;
  },

  createProduct: async (product: Partial<Product>): Promise<Product> => {
    const res = await apiClient.post<Product>('/products', product);
    return res.data;
  },

  updateStock: async (id: number, quantityChange: number): Promise<Product> => {
    const res = await apiClient.patch<Product>(`/products/${id}/stock`, null, {
      params: { quantityChange },
    });
    return res.data;
  },

  simulateSale: async (id: number): Promise<Product> => {
    const res = await apiClient.post<Product>(`/products/${id}/orders`);
    return res.data;
  },

  requestPricingSuggestion: async (id: number): Promise<PricingSuggestion> => {
    const res = await apiClient.post<PricingSuggestion>(`/products/${id}/suggest-pricing`);
    return res.data;
  },

  requestReorderSuggestion: async (id: number): Promise<ReorderSuggestion> => {
    const res = await apiClient.post<ReorderSuggestion>(`/products/${id}/suggest-reorder`);
    return res.data;
  },
};
