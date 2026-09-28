import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Sparkles, 
  Package, 
  DollarSign, 
  Boxes, 
  Zap, 
  Activity, 
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { AIInsight } from '../components/common/AIInsight';
import { useToast } from '../components/ui/Toast';
import { productsApi } from '../api/products';
import { suggestionsApi } from '../api/suggestions';
import { formatCurrency } from '../lib/utils';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const productId = Number(id);

  // Fetch product data
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getProductById(productId),
    enabled: !isNaN(productId),
  });

  // Fetch pending suggestions for this product
  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions', 'PENDING'],
    queryFn: () => suggestionsApi.getAllUnifiedSuggestions('PENDING'),
  });

  const productSuggestions = suggestions.filter((s) => s.product?.id === productId);

  // Mutation to request on-demand AI recommendation
  const requestAiMutation = useMutation({
    mutationFn: () => productsApi.requestPricingSuggestion(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast({
        type: 'success',
        title: 'AI Recommendation Generated',
        message: `Recommendation created for ${product?.name}. Tagged as MANUAL REQUEST in review queue.`,
      });
    },
    onError: () => {
      toast({
        type: 'error',
        title: 'AI Advisor Error',
        message: 'Could not generate recommendation. Please retry.',
      });
    },
  });

  if (isLoading || !product) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p>Loading product analytics...</p>
      </div>
    );
  }

  // Mock time-series charts data for this SKU
  const stockHistory = [
    { day: 'Day 1', stock: product.stockLevel + 12 },
    { day: 'Day 2', stock: product.stockLevel + 9 },
    { day: 'Day 3', stock: product.stockLevel + 7 },
    { day: 'Day 4', stock: product.stockLevel + 4 },
    { day: 'Day 5', stock: product.stockLevel + 2 },
    { day: 'Day 6', stock: product.stockLevel + 1 },
    { day: 'Today', stock: product.stockLevel },
  ];

  const demandHistory = [
    { hour: '04:00', orders: 2 },
    { hour: '08:00', orders: 5 },
    { hour: '12:00', orders: 12 },
    { hour: '16:00', orders: 18 },
    { hour: '20:00', orders: 22 },
    { hour: 'Now', orders: product.demandVelocity },
  ];

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Products
        </Button>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-mono text-slate-500">{product.sku}</span>
      </div>

      {/* Main Header Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {product.name}
              </h2>
              <StatusBadge status={product.status} />
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-mono">
              <span>SKU: {product.sku}</span>
              <span>&bull;</span>
              <span>Category: {product.category}</span>
              {product.supplierId && (
                <>
                  <span>&bull;</span>
                  <span>Supplier ID: #{product.supplierId} (Sprint 2)</span>
                </>
              )}
            </div>
          </div>

          {/* On-demand AI request button */}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => requestAiMutation.mutate()}
              isLoading={requestAiMutation.isPending}
              className="shadow-md"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-indigo-200" />
              <span>Request AI Recommendation</span>
            </Button>
          </div>
        </div>

        {/* Operational Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">Current Selling Price</span>
            <strong className="text-lg font-mono font-bold text-slate-900">
              {formatCurrency(product.currentPrice)}
            </strong>
            {product.costPrice && (
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                Cost: {formatCurrency(product.costPrice)} (Sprint 2)
              </span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">Available Stock</span>
            <strong
              className={`text-lg font-mono font-bold ${
                product.stockLevel <= product.reorderThreshold ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {product.stockLevel} units
            </strong>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Reorder point: {product.reorderThreshold} units
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">24h Sales Velocity</span>
            <strong className="text-lg font-mono font-bold text-indigo-700">
              +{product.demandVelocity} orders
            </strong>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Category average: ~45 orders
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">Safety Status</span>
            <strong className="text-sm font-semibold text-slate-800 flex items-center gap-1 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {product.stockLevel <= product.reorderThreshold ? 'Replenish Urgently' : 'Optimal Runway'}
            </strong>
          </div>
        </div>
      </Card>

      {/* Active AI Suggestions for this Product */}
      {productSuggestions.length > 0 && (
        <Card className="border-indigo-200 bg-indigo-50/20">
          <CardHeader>
            <CardTitle>
              <Sparkles className="w-4 h-4 text-indigo-600" /> Active Pending Recommendations ({productSuggestions.length})
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate('/suggestions')}>
              Review in Approval Queue &rarr;
            </Button>
          </CardHeader>

          <div className="space-y-3">
            {productSuggestions.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-white border border-indigo-100 shadow-subtle">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge trigger={s.triggerReason} />
                    <StatusBadge origin={s.triggerReason === 'MANUAL' ? 'MANUAL' : 'AUTO'} />
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {s.type === 'PRICING' ? `Adjust Price &rarr; ${formatCurrency(s.recommendedPrice)}` : `Reorder +${s.recommendedQuantity} units`}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">{s.reasoning}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Depletion History</CardTitle>
          </CardHeader>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockHistory}>
                <defs>
                  <linearGradient id="prodStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(v: any) => [`${v} units`, 'Stock Level']} />
                <Area type="monotone" dataKey="stock" stroke="#ef4444" strokeWidth={2} fill="url(#prodStock)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly Demand Velocity</CardTitle>
          </CardHeader>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(v: any) => [`${v} orders`, 'Velocity']} />
                <Line type="monotone" dataKey="orders" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
