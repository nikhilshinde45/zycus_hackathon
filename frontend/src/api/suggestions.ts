import { apiClient } from './client';
import { PricingSuggestion, ReorderSuggestion, SuggestionStatus, UnifiedSuggestion } from '../types';

export const suggestionsApi = {
  getPricingSuggestions: async (status?: SuggestionStatus): Promise<PricingSuggestion[]> => {
    const res = await apiClient.get<PricingSuggestion[]>('/pricing-suggestions', {
      params: status ? { status } : undefined,
    });
    return res.data;
  },

  getReorderSuggestions: async (status?: SuggestionStatus): Promise<ReorderSuggestion[]> => {
    const res = await apiClient.get<ReorderSuggestion[]>('/reorder-suggestions', {
      params: status ? { status } : undefined,
    });
    return res.data;
  },

  getAllUnifiedSuggestions: async (status?: SuggestionStatus): Promise<UnifiedSuggestion[]> => {
    const [pricing, reorders] = await Promise.all([
      suggestionsApi.getPricingSuggestions(status),
      suggestionsApi.getReorderSuggestions(status),
    ]);

    const unifiedPricing: UnifiedSuggestion[] = pricing.map((p) => ({
      id: p.id,
      type: 'PRICING',
      product: p.product,
      currentPrice: p.currentPrice,
      recommendedPrice: p.recommendedPrice,
      changeDirection: p.changeDirection,
      confidence: p.confidence,
      reasoning: p.reasoning,
      status: p.status,
      triggerReason: p.triggerReason,
      createdAt: p.createdAt,
    }));

    const unifiedReorders: UnifiedSuggestion[] = reorders.map((r) => ({
      id: r.id,
      type: 'REORDER',
      product: r.product,
      currentStock: r.currentStock,
      recommendedQuantity: r.recommendedQuantity,
      suggestedLeadTimeDays: r.suggestedLeadTimeDays,
      confidence: r.confidence,
      reasoning: r.reasoning,
      status: r.status,
      triggerReason: r.triggerReason,
      createdAt: r.createdAt,
    }));

    return [...unifiedPricing, ...unifiedReorders].sort((a, b) => b.id - a.id);
  },

  updatePricingSuggestion: async (id: number, status: SuggestionStatus): Promise<PricingSuggestion> => {
    const res = await apiClient.patch<PricingSuggestion>(`/pricing-suggestions/${id}`, null, {
      params: { status },
    });
    return res.data;
  },

  updateReorderSuggestion: async (id: number, status: SuggestionStatus): Promise<ReorderSuggestion> => {
    const res = await apiClient.patch<ReorderSuggestion>(`/reorder-suggestions/${id}`, null, {
      params: { status },
    });
    return res.data;
  },
};
