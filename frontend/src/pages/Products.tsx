import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Search, 
  SlidersHorizontal, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../components/ui/Toast';
import { productsApi } from '../api/products';
import { Product, ProductCategory, ProductStatus } from '../types';
import { formatCurrency } from '../lib/utils';

export function Products() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', categoryFilter],
    queryFn: () => productsApi.getProducts({ category: categoryFilter || undefined }),
    refetchInterval: 5000,
  });

  // Action Mutations
  const saleMutation = useMutation({
    mutationFn: (id: number) => productsApi.simulateSale(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast({
        type: 'info',
        title: 'Sale Simulated',
        message: `${data.name} sold 1 unit. Stock is now ${data.stockLevel}. Signals analyzed asynchronously.`,
      });
    },
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, delta }: { id: number; delta: number }) => productsApi.updateStock(id, delta),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast({
        type: 'info',
        title: 'Stock Updated',
        message: `Updated stock level to ${data.stockLevel}. Agentic loop evaluated.`,
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (id: number) => productsApi.requestPricingSuggestion(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast({
        type: 'success',
        title: 'Manual AI Review Initiated',
        message: `New suggestion created for ${data.product?.name}. Tagged as MANUAL REQUEST in review queue.`,
      });
    },
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'LOW_STOCK') return p.stockLevel <= p.reorderThreshold && p.stockLevel > 0;
    if (statusFilter === 'OUT_OF_STOCK') return p.stockLevel === 0;
    if (statusFilter === 'SPIKE') return p.demandVelocity > 100;
    if (statusFilter === 'REVIEW_PENDING') return p.status === 'PRICE_REVIEW_PENDING';

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Catalog & Inventory Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock run-rate, 24h sales velocity, and on-demand AI pricing advisor controls.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="ELECTRONICS">Electronics</option>
            <option value="APPAREL">Apparel</option>
            <option value="HOME">Home Goods</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Health Statuses</option>
            <option value="LOW_STOCK">⚠️ Low Stock Alerts</option>
            <option value="OUT_OF_STOCK">🔴 Out of Stock</option>
            <option value="SPIKE">🔥 Demand Spike</option>
            <option value="REVIEW_PENDING">⏳ Price Review Pending</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredProducts.length} of {products.length} SKUs
        </div>
      </div>

      {/* Products Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3.5 px-4">Product & SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Threshold</th>
                <th className="py-3.5 px-4">24h Velocity</th>
                <th className="py-3.5 px-4">Lifecycle</th>
                <th className="py-3.5 px-4 text-right">Demo Simulator & AI Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLow = p.stockLevel <= p.reorderThreshold && p.stockLevel > 0;
                const isOut = p.stockLevel === 0;
                const isSpike = p.demandVelocity > 100;

                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/products/${p.id}`)}
                    className="hover:bg-indigo-50/20 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                        {p.name}
                        <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{p.sku}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatCurrency(p.currentPrice)}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`font-bold ${
                          isOut ? 'text-red-700' : isLow ? 'text-red-600' : 'text-slate-800'
                        }`}
                      >
                        {p.stockLevel} units
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {p.reorderThreshold} units
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className={isSpike ? 'text-amber-700 font-bold' : 'text-slate-600'}>
                        +{p.demandVelocity} orders
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} />
                    </td>

                    {/* Operational Demo Actions */}
                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => saleMutation.mutate(p.id)}
                          isLoading={saleMutation.isPending && saleMutation.variables === p.id}
                          title="Simulate single sale (decrements stock by 1 and updates velocity)"
                        >
                          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>Sell 1</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stockMutation.mutate({ id: p.id, delta: -5 })}
                          isLoading={stockMutation.isPending && stockMutation.variables?.id === p.id}
                          title="Reduce stock by 5 units"
                        >
                          -5 Stock
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => reviewMutation.mutate(p.id)}
                          isLoading={reviewMutation.isPending && reviewMutation.variables === p.id}
                          className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                          title="Trigger on-demand AI review (tagged as MANUAL REQUEST in queue)"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>AI Review</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
