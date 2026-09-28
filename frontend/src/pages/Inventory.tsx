import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ArrowUpDown,
  Plus,
  Minus
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../components/ui/Toast';
import { productsApi } from '../api/products';
import { Product } from '../types';

export function Inventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'LOW' | 'HEALTHY' | 'OUT'>('ALL');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts(),
    refetchInterval: 4000,
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, delta }: { id: number; delta: number }) => productsApi.updateStock(id, delta),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast({
        type: 'info',
        title: 'Inventory Updated',
        message: `${data.name} stock adjusted to ${data.stockLevel} units.`,
      });
    },
  });

  const criticalCount = products.filter((p) => p.stockLevel <= p.reorderThreshold && p.stockLevel > 0).length;
  const outCount = products.filter((p) => p.stockLevel === 0).length;
  const healthyCount = products.filter((p) => p.stockLevel > p.reorderThreshold).length;
  const totalUnits = products.reduce((sum, p) => sum + p.stockLevel, 0);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'OUT') return p.stockLevel === 0;
    if (filter === 'CRITICAL') return p.stockLevel <= p.reorderThreshold && p.stockLevel > 0;
    if (filter === 'LOW') return p.stockLevel <= p.reorderThreshold * 1.5 && p.stockLevel > p.reorderThreshold;
    if (filter === 'HEALTHY') return p.stockLevel > p.reorderThreshold * 1.5;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Inventory Monitoring & Reorder Safety
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Surveillance of stock-out risks, threshold margins, and simulated inbound deliveries.
        </p>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Inventory Units
          </span>
          <strong className="text-2xl font-mono font-bold text-slate-900 mt-2 block">
            {totalUnits.toLocaleString()} units
          </strong>
          <span className="text-xs text-slate-400 mt-1 block">Across {products.length} SKUs</span>
        </Card>

        <Card className="border-red-200/80 bg-red-50/20">
          <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider block">
            Critical Low Stock
          </span>
          <strong className="text-2xl font-mono font-bold text-red-600 mt-2 block">
            {criticalCount} SKUs
          </strong>
          <span className="text-xs text-red-500 mt-1 block">&le; Safety reorder threshold</span>
        </Card>

        <Card className="border-amber-200/80 bg-amber-50/20">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            Out of Stock
          </span>
          <strong className="text-2xl font-mono font-bold text-amber-700 mt-2 block">
            {outCount} SKUs
          </strong>
          <span className="text-xs text-amber-600 mt-1 block">Zero inventory available</span>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/20">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
            Healthy Runway
          </span>
          <strong className="text-2xl font-mono font-bold text-emerald-700 mt-2 block">
            {healthyCount} SKUs
          </strong>
          <span className="text-xs text-emerald-600 mt-1 block">&gt; Threshold safety buffer</span>
        </Card>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'CRITICAL', label: '🔴 Critical Stock' },
            { id: 'LOW', label: '⚠️ Low Stock' },
            { id: 'HEALTHY', label: '✓ Healthy' },
            { id: 'OUT', label: 'Stockout (0)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filter === tab.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKU or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Inventory Visual Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Threshold Point</th>
                <th className="py-3 px-4 min-w-[220px]">Stock Fill & Runway Level</th>
                <th className="py-3 px-4">Safety Status</th>
                <th className="py-3 px-4 text-right">Inbound / Outbound Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const targetMax = p.reorderThreshold * 3;
                const percentage = Math.min(100, Math.round((p.stockLevel / targetMax) * 100));

                let barColor = "bg-emerald-500";
                let statusLabel = "Healthy Runway";
                let statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";

                if (p.stockLevel === 0) {
                  barColor = "bg-red-500";
                  statusLabel = "OUT OF STOCK";
                  statusColor = "text-red-700 bg-red-50 border-red-200";
                } else if (p.stockLevel <= p.reorderThreshold) {
                  barColor = "bg-red-500";
                  statusLabel = "CRITICAL BELOW THRESHOLD";
                  statusColor = "text-red-700 bg-red-50 border-red-200";
                } else if (p.stockLevel <= p.reorderThreshold * 1.5) {
                  barColor = "bg-amber-500";
                  statusLabel = "LOW STOCK WARNING";
                  statusColor = "text-amber-800 bg-amber-50 border-amber-200";
                }

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{p.sku} &bull; {p.category}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                      {p.reorderThreshold} units safety
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="font-bold text-slate-800">{p.stockLevel} units</span>
                          <span className="text-slate-400">{percentage}% of 3x buffer</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${Math.max(4, percentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stockMutation.mutate({ id: p.id, delta: -5 })}
                          isLoading={stockMutation.isPending && stockMutation.variables?.id === p.id}
                          title="Simulate sale of 5 units"
                        >
                          <Minus className="w-3 h-3 text-red-500" /> -5
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stockMutation.mutate({ id: p.id, delta: 15 })}
                          isLoading={stockMutation.isPending && stockMutation.variables?.id === p.id}
                          title="Receive inbound delivery of +15 units"
                        >
                          <Plus className="w-3 h-3 text-emerald-600" /> +15 Inbound
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
