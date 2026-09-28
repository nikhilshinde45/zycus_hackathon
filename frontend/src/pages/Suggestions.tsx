import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, 
  Search, 
  Filter, 
  TrendingUp, 
  Package, 
  Check, 
  X, 
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfidenceScore } from '../components/common/ConfidenceScore';
import { AIInsight } from '../components/common/AIInsight';
import { ApprovalDialog } from '../components/common/ApprovalDialog';
import { useToast } from '../components/ui/Toast';
import { suggestionsApi } from '../api/suggestions';
import { UnifiedSuggestion, SuggestionStatus } from '../types';
import { formatCurrency } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Suggestions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'ALL' | 'HIGH_PRIORITY' | 'PRICING' | 'REORDER' | 'LOW_STOCK' | 'SPIKE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection states
  const [activeDrawerItem, setActiveDrawerItem] = useState<UnifiedSuggestion | null>(null);
  const [dialogSuggestion, setDialogSuggestion] = useState<UnifiedSuggestion | null>(null);
  const [dialogAction, setDialogAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch suggestions
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['suggestions', statusFilter],
    queryFn: () => suggestionsApi.getAllUnifiedSuggestions(statusFilter),
    refetchInterval: 4000,
  });

  // Decision Mutation
  const decisionMutation = useMutation({
    mutationFn: async ({ id, type, status }: { id: number; type: 'PRICING' | 'REORDER'; status: 'ACCEPTED' | 'REJECTED' }) => {
      if (type === 'PRICING') {
        return suggestionsApi.updatePricingSuggestion(id, status);
      }
      return suggestionsApi.updateReorderSuggestion(id, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setIsDialogOpen(false);
      setActiveDrawerItem(null);
      toast({
        type: variables.status === 'ACCEPTED' ? 'success' : 'info',
        title: variables.status === 'ACCEPTED' ? 'Recommendation Approved' : 'Recommendation Rejected',
        message: variables.status === 'ACCEPTED'
          ? 'Changes applied and committed to active commerce catalog.'
          : 'Suggestion marked as rejected and archived.',
      });
    },
    onError: () => {
      toast({
        type: 'error',
        title: 'Execution Error',
        message: 'Could not process recommendation. Please retry.',
      });
    },
  });

  const handleOpenDialog = (s: UnifiedSuggestion, action: 'APPROVE' | 'REJECT', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDialogSuggestion(s);
    setDialogAction(action);
    setIsDialogOpen(true);
  };

  const handleConfirmDecision = () => {
    if (!dialogSuggestion) return;
    decisionMutation.mutate({
      id: dialogSuggestion.id,
      type: dialogSuggestion.type,
      status: dialogAction === 'APPROVE' ? 'ACCEPTED' : 'REJECTED',
    });
  };

  // Filtering
  const filteredSuggestions = suggestions.filter((item) => {
    const matchesSearch =
      item.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reasoning.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'HIGH_PRIORITY') return item.confidence >= 0.85;
    if (activeTab === 'PRICING') return item.type === 'PRICING';
    if (activeTab === 'REORDER') return item.type === 'REORDER';
    if (activeTab === 'LOW_STOCK') return item.triggerReason === 'INVENTORY_LOW';
    if (activeTab === 'SPIKE') return item.triggerReason === 'DEMAND_SPIKE';

    return true;
  });

  // Mock price trend for detail modal
  const priceHistoryData = [
    { period: '4w ago', price: activeDrawerItem?.currentPrice ? activeDrawerItem.currentPrice * 0.95 : 100 },
    { period: '3w ago', price: activeDrawerItem?.currentPrice ? activeDrawerItem.currentPrice * 0.98 : 100 },
    { period: '2w ago', price: activeDrawerItem?.currentPrice || 100 },
    { period: 'Last wk', price: activeDrawerItem?.currentPrice || 100 },
    { period: 'Proposed', price: activeDrawerItem?.recommendedPrice || activeDrawerItem?.currentPrice || 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Suggestions Approval Queue</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {suggestions.length} {statusFilter.toLowerCase()}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review and checkpoint AI-generated price optimizations and replenishment purchase orders.
          </p>
        </div>

        {/* Status Mode Toggle */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-subtle text-xs">
          {(['PENDING', 'ACCEPTED', 'REJECTED'] as SuggestionStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                statusFilter === st ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'HIGH_PRIORITY', label: '🔥 High Priority' },
            { id: 'PRICING', label: '🏷️ Price Adjustments' },
            { id: 'REORDER', label: '🚚 Replenishment' },
            { id: 'LOW_STOCK', label: '⚠️ Low Stock' },
            { id: 'SPIKE', label: '⚡ Demand Spikes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter suggestions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Suggestion Cards Grid */}
      {filteredSuggestions.length === 0 ? (
        <Card className="py-16 text-center">
          <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3 opacity-60" />
          <h3 className="font-bold text-slate-800 text-sm">No suggestions match criteria</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            All pending items in this category have been evaluated or no signals have crossed thresholds.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSuggestions.map((item) => {
            const isPricing = item.type === 'PRICING';
            const priceDiff = (item.recommendedPrice || 0) - (item.currentPrice || 0);
            const priceDiffPercent = item.currentPrice
              ? ((priceDiff / item.currentPrice) * 100).toFixed(1)
              : '0';

            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => setActiveDrawerItem(item)}
                className="bg-white rounded-xl border border-slate-200/90 shadow-subtle p-5 hover:border-indigo-300 hover:shadow-card transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusBadge trigger={item.triggerReason} />
                    <div className="flex items-center gap-1.5">
                      <StatusBadge origin={item.triggerReason === 'MANUAL' ? 'MANUAL' : 'AUTO'} />
                      {item.confidence >= 0.85 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                          HIGH PRIORITY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & SKU */}
                  <div className="mb-3">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {item.product?.name}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {item.product?.sku} &bull; {item.product?.category}
                    </div>
                  </div>

                  {/* Inventory Signals Box */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs mb-3 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Stock</span>
                      <strong className={item.product?.stockLevel <= item.product?.reorderThreshold ? 'text-red-600' : 'text-slate-700'}>
                        {item.product?.stockLevel}u
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Threshold</span>
                      <strong className="text-slate-700">{item.product?.reorderThreshold}u</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">24h Velocity</span>
                      <strong className="text-indigo-600">+{item.product?.demandVelocity}</strong>
                    </div>
                  </div>

                  {/* Proposed Operational Action */}
                  <div className="p-3 rounded-lg bg-indigo-50/40 border border-indigo-100 mb-3">
                    {isPricing ? (
                      <div>
                        <div className="text-[10px] text-indigo-700 font-semibold uppercase tracking-wider mb-1">
                          Recommended Price Adjustment
                        </div>
                        <div className="flex items-baseline justify-between font-mono">
                          <span className="text-xs text-slate-500 line-through">
                            {formatCurrency(item.currentPrice)}
                          </span>
                          <span className="text-base font-bold text-indigo-900">
                            {formatCurrency(item.recommendedPrice)}
                          </span>
                          <span className={`text-xs font-bold ${priceDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {priceDiff >= 0 ? '+' : ''}{priceDiffPercent}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider mb-1">
                          Recommended Replenishment PO
                        </div>
                        <div className="flex items-baseline justify-between font-mono">
                          <span className="text-xs text-slate-500">Buffer Target: 3x</span>
                          <span className="text-base font-bold text-emerald-700">
                            +{item.recommendedQuantity} units
                          </span>
                          <span className="text-xs text-slate-500">
                            ({item.suggestedLeadTimeDays || 7}d lead)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Reasoning */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {item.reasoning}
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <ConfidenceScore score={item.confidence} />

                  {statusFilter === 'PENDING' ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={(e) => handleOpenDialog(item, 'APPROVE', e)}
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => handleOpenDialog(item, 'REJECT', e)}
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  ) : (
                    <StatusBadge status={item.status} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggestion Detail Modal / Drawer */}
      {activeDrawerItem && (
        <Modal
          isOpen={!!activeDrawerItem}
          onClose={() => setActiveDrawerItem(null)}
          title={activeDrawerItem.product?.name || "Recommendation Context"}
          description={`${activeDrawerItem.product?.sku} • Category: ${activeDrawerItem.product?.category}`}
          className="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Top Insight */}
            <AIInsight
              reasoning={activeDrawerItem.reasoning}
              confidence={activeDrawerItem.confidence}
            />

            {/* Inventory & Demand Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Inventory State
                </span>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Current Stock:</span>
                    <strong className="text-slate-900">{activeDrawerItem.product?.stockLevel} units</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Safety Threshold:</span>
                    <strong className="text-slate-700">{activeDrawerItem.product?.reorderThreshold} units</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Run-rate Status:</span>
                    <span className="text-red-600 font-bold font-sans">CRITICAL LOW</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Demand & Velocity
                </span>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">24h Orders:</span>
                    <strong className="text-indigo-600">+{activeDrawerItem.product?.demandVelocity}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Peer Category Avg:</span>
                    <strong className="text-slate-700">~45 orders</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Surge Multiplier:</span>
                    <strong className="text-amber-600 font-sans">2.4x Velocity</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Adjustment History Chart if pricing */}
            {activeDrawerItem.type === 'PRICING' && (
              <div>
                <span className="text-xs font-bold text-slate-700 mb-2 block">
                  Price History & Recommendation Impact
                </span>
                <div className="h-44 w-full bg-slate-50/50 rounded-lg p-2 border border-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistoryData}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="period" fontSize={10} stroke="#94a3b8" />
                      <YAxis fontSize={10} stroke="#94a3b8" domain={['auto', 'auto']} />
                      <Tooltip formatter={(v: any) => [formatCurrency(v), 'Price']} />
                      <Line type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            {statusFilter === 'PENDING' && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveDrawerItem(null)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleOpenDialog(activeDrawerItem, 'REJECT')}
                >
                  Reject Suggestion
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleOpenDialog(activeDrawerItem, 'APPROVE')}
                >
                  Approve & Commit
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ApprovalDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmDecision}
        suggestion={dialogSuggestion}
        action={dialogAction}
        isLoading={decisionMutation.isPending}
      />
    </div>
  );
}
