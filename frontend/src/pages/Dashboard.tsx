import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  RotateCw,
  Zap,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfidenceScore } from '../components/common/ConfidenceScore';
import { ApprovalDialog } from '../components/common/ApprovalDialog';
import { useToast } from '../components/ui/Toast';
import { productsApi } from '../api/products';
import { suggestionsApi } from '../api/suggestions';
import { analyticsApi } from '../api/analytics';
import { UnifiedSuggestion, Product } from '../types';
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
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedSuggestion, setSelectedSuggestion] = useState<UnifiedSuggestion | null>(null);
  const [dialogAction, setDialogAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chartMetric, setChartMetric] = useState<'units' | 'value'>('units');

  // Load live data
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts(),
    refetchInterval: 5000,
  });

  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['suggestions', 'PENDING'],
    queryFn: () => suggestionsApi.getAllUnifiedSuggestions('PENDING'),
    refetchInterval: 4000,
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsApi.getSummary,
  });

  // Decision mutations
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
      toast({
        type: variables.status === 'ACCEPTED' ? 'success' : 'info',
        title: variables.status === 'ACCEPTED' ? 'Recommendation Approved' : 'Recommendation Rejected',
        message: variables.status === 'ACCEPTED'
          ? 'Operational changes successfully applied to active catalog state.'
          : 'Recommendation dismissed from pending review queue.',
      });
    },
    onError: () => {
      toast({
        type: 'error',
        title: 'Action Failed',
        message: 'Could not process recommendation. Please retry.',
      });
    },
  });

  // Simulate Sale mutation for quick demo flow
  const saleMutation = useMutation({
    mutationFn: (productId: number) => productsApi.simulateSale(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast({
        type: 'info',
        title: 'Sale Simulated (1 Unit)',
        message: `${data.name} stock decremented to ${data.stockLevel}. Agentic signals evaluated asynchronously.`,
      });
    },
  });

  // Calculation for attention cards
  const criticalProducts = products.filter((p) => p.stockLevel <= p.reorderThreshold);
  const spikeProducts = products.filter((p) => p.demandVelocity > 100);

  // Mock historical timeseries for chart
  const inventoryChartData = [
    { day: 'Mon', units: 620, value: 48500, lowStock: 3 },
    { day: 'Tue', units: 580, value: 45200, lowStock: 4 },
    { day: 'Wed', units: 540, value: 42100, lowStock: 6 },
    { day: 'Thu', units: 490, value: 38900, lowStock: 7 },
    { day: 'Fri', units: 470, value: 37400, lowStock: 8 },
    { day: 'Sat', units: 510, value: 40500, lowStock: 5 },
    { day: 'Sun', units: 485, value: 39200, lowStock: 6 },
  ];

  const velocityChartData = [
    { time: '00:00', velocity: 18, baseline: 25 },
    { time: '04:00', velocity: 12, baseline: 25 },
    { time: '08:00', velocity: 34, baseline: 25 },
    { time: '12:00', velocity: 68, baseline: 25 },
    { time: '16:00', velocity: 185, baseline: 25 }, // Spike peak
    { time: '20:00', velocity: 95, baseline: 25 },
    { time: 'Now', velocity: 48, baseline: 25 },
  ];

  const openDecisionDialog = (suggestion: UnifiedSuggestion, action: 'APPROVE' | 'REJECT') => {
    setSelectedSuggestion(suggestion);
    setDialogAction(action);
    setIsDialogOpen(true);
  };

  const handleConfirmDecision = () => {
    if (!selectedSuggestion) return;
    decisionMutation.mutate({
      id: selectedSuggestion.id,
      type: selectedSuggestion.type,
      status: dialogAction === 'APPROVE' ? 'ACCEPTED' : 'REJECTED',
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Good morning, Merchandiser 👋
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening across your catalog today. The agentic commerce loop is active and observing stock & velocity signals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Updated live (5s poll)</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries();
              toast({ title: 'Refreshing catalog metrics...' });
            }}
          >
            <RotateCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Products */}
        <Card className="hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Products Monitored
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {products.length}
            </span>
            <span className="text-xs font-medium text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +4.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active SKUs under AI surveillance</p>
        </Card>

        {/* Low-Stock Products */}
        <Card className="hover:border-red-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-red-600 font-mono">
              {criticalProducts.length}
            </span>
            <span className="text-xs font-medium text-amber-600 flex items-center">
              Threshold &lt; safety
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires replenishment review</p>
        </Card>

        {/* Pending Suggestions */}
        <Card className="hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Suggestions
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 font-mono">
              {suggestions.length}
            </span>
            <span className="text-xs font-medium text-indigo-600">
              {suggestions.filter((s) => s.confidence >= 0.85).length} High Priority
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting merchandising sign-off</p>
        </Card>

        {/* Potential Revenue Impact */}
        <Card className="hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Potential Impact
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(analytics?.estimatedRevenueImpact || 18420)}
            </span>
            <span className="text-xs font-medium text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +12.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Projected 30-day dynamic margin</p>
        </Card>
      </div>

      {/* Needs Your Attention Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h3 className="text-base font-bold text-slate-900">Needs Your Attention</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
              {criticalProducts.length + spikeProducts.length} High Priority Signals
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/suggestions')}>
            View all suggestions &rarr;
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {criticalProducts.slice(0, 3).map((prod) => (
            <div
              key={prod.id}
              className="p-5 rounded-xl border border-red-200/80 bg-gradient-to-br from-red-50/50 via-white to-white shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1.5 uppercase tracking-wide">
                    🔴 Critical Inventory Alert
                  </span>
                  <span className="font-mono text-xs text-slate-500">{prod.sku}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{prod.name}</h4>
                <div className="mt-3 grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-white/80 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stock</span>
                    <strong className="text-red-600 font-mono text-sm">{prod.stockLevel} units</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Threshold</span>
                    <strong className="text-slate-700 font-mono text-sm">{prod.reorderThreshold}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Velocity</span>
                    <strong className="text-indigo-600 font-mono text-sm">+{prod.demandVelocity}/24h</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate('/suggestions')}
                  className="w-full text-xs"
                >
                  Review AI Suggestion
                </Button>
              </div>
            </div>
          ))}

          {/* Quick Demo Sale Trigger Card */}
          <div className="p-5 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">
                <Zap className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
                <span>Live Hackathon Demo Trigger</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Simulate a customer order to test the instant stock decrement and autonomous agentic loop.
              </p>
              <div className="mt-3 p-2.5 rounded-lg bg-white border border-indigo-100 text-xs font-mono">
                Aura Pro Headphones (ELEC-001)
              </div>
            </div>

            <div className="mt-4 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                onClick={() => {
                  const target = products.find((p) => p.sku === 'ELEC-001') || products[0];
                  if (target) saleMutation.mutate(target.id);
                }}
                isLoading={saleMutation.isPending}
              >
                ⚡ Simulate Sale (Order 1 Unit)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Health Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Inventory Health Trends</CardTitle>
              <p className="text-xs text-slate-400">Total units vs low-stock threshold risk</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setChartMetric('units')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  chartMetric === 'units' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-600'
                }`}
              >
                Units
              </button>
              <button
                onClick={() => setChartMetric('value')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  chartMetric === 'value' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-600'
                }`}
              >
                Valuation ($)
              </button>
            </div>
          </CardHeader>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={inventoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="invGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(value: any) => [chartMetric === 'units' ? `${value} units` : formatCurrency(value), 'Total Inventory']}
                />
                <Area
                  type="monotone"
                  dataKey={chartMetric === 'units' ? 'units' : 'value'}
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#invGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Demand Velocity Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Demand Velocity & Spike Thresholds</CardTitle>
              <p className="text-xs text-slate-400">Current velocity vs 3x category surge baseline</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                <span className="w-2.5 h-0.5 bg-indigo-600" /> Velocity
              </span>
              <span className="flex items-center gap-1.5 text-amber-500 font-semibold">
                <span className="w-2.5 h-0.5 bg-amber-500" /> Spike Alarm
              </span>
            </div>
          </CardHeader>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(val: any) => [`${val} orders/24h`, 'Demand Velocity']}
                />
                <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Spike (75)', fill: '#d97706', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="velocity"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#4f46e5' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Pending Suggestions Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Recent Commerce Recommendations</CardTitle>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {suggestions.length} Pending
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/suggestions')}>
            Open Approval Queue &rarr;
          </Button>
        </CardHeader>

        {suggestions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
            <p className="font-semibold text-slate-700 text-sm">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">There are no pending recommendations requiring attention.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Trigger Reason</th>
                  <th className="py-3 px-3">Action Recommended</th>
                  <th className="py-3 px-3">Confidence</th>
                  <th className="py-3 px-3">Origin</th>
                  <th className="py-3 px-3 text-right">Merchandiser Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suggestions.slice(0, 5).map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{item.product?.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.product?.sku}</div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge trigger={item.triggerReason} />
                    </td>
                    <td className="py-3 px-3 font-medium">
                      {item.type === 'PRICING' ? (
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-slate-400">{formatCurrency(item.currentPrice)}</span>
                          <span className="text-slate-400">&rarr;</span>
                          <strong className="text-indigo-600">{formatCurrency(item.recommendedPrice)}</strong>
                        </div>
                      ) : (
                        <div className="font-mono">
                          <strong className="text-emerald-600">+{item.recommendedQuantity} units</strong>
                          <span className="text-slate-400 text-[10px] ml-1">({item.suggestedLeadTimeDays || 7}d lead)</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <ConfidenceScore score={item.confidence} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge origin={item.triggerReason === 'MANUAL' ? 'MANUAL' : 'AUTO'} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => openDecisionDialog(item, 'APPROVE')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDecisionDialog(item, 'REJECT')}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <ApprovalDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmDecision}
        suggestion={selectedSuggestion}
        action={dialogAction}
        isLoading={decisionMutation.isPending}
      />
    </div>
  );
}
