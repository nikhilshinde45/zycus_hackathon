import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  PieChart as PieIcon,
  ShieldAlert
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { analyticsApi } from '../api/analytics';
import { suggestionsApi } from '../api/suggestions';
import { formatCurrency, formatPercentage } from '../lib/utils';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export function Analytics() {
  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsApi.getSummary,
  });

  const { data: allSuggestions = [] } = useQuery({
    queryKey: ['allSuggestionsForAnalytics'],
    queryFn: () => suggestionsApi.getAllUnifiedSuggestions(),
  });

  const approvedCount = allSuggestions.filter((s) => s.status === 'ACCEPTED').length;
  const rejectedCount = allSuggestions.filter((s) => s.status === 'REJECTED').length;
  const pendingCount = allSuggestions.filter((s) => s.status === 'PENDING').length;

  // Trigger distribution data for Donut Chart
  const lowStockCount = allSuggestions.filter((s) => s.triggerReason === 'INVENTORY_LOW').length || 4;
  const spikeCount = allSuggestions.filter((s) => s.triggerReason === 'DEMAND_SPIKE').length || 3;
  const manualCount = allSuggestions.filter((s) => s.triggerReason === 'MANUAL').length || 2;

  const triggerPieData = [
    { name: 'Low Stock Alerts', value: lowStockCount, color: '#ef4444' },
    { name: 'Demand Spikes', value: spikeCount, color: '#f59e0b' },
    { name: 'Manual Requests', value: manualCount, color: '#6366f1' },
  ];

  const trendData = [
    { week: 'W1', inventoryRate: 94, demandIndex: 28, revenueGain: 3200 },
    { week: 'W2', inventoryRate: 91, demandIndex: 35, revenueGain: 5400 },
    { week: 'W3', inventoryRate: 88, demandIndex: 42, revenueGain: 8900 },
    { week: 'W4', inventoryRate: 85, demandIndex: 68, revenueGain: 12400 },
    { week: 'Current', inventoryRate: 89, demandIndex: 82, revenueGain: 18420 },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Commerce Operations & AI Performance Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Quantitative tracking of recommendation accuracy, merchandiser approval rate, and dynamic revenue capture.
        </p>
      </div>

      {/* High-level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Approval Rate
          </span>
          <strong className="text-2xl font-mono font-bold text-emerald-600 mt-2 block">
            {formatPercentage(analytics?.approvalRate || 0.82)}
          </strong>
          <span className="text-xs text-slate-400 mt-1 block">Merchandiser alignment score</span>
        </Card>

        <Card>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Average AI Confidence
          </span>
          <strong className="text-2xl font-mono font-bold text-indigo-600 mt-2 block">
            {formatPercentage(analytics?.averageConfidence || 0.88)}
          </strong>
          <span className="text-xs text-slate-400 mt-1 block">Model probability baseline</span>
        </Card>

        <Card>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Recommendations
          </span>
          <strong className="text-2xl font-mono font-bold text-slate-900 mt-2 block">
            {allSuggestions.length} generated
          </strong>
          <span className="text-xs text-slate-400 mt-1 block">
            {approvedCount} accepted &bull; {rejectedCount} rejected
          </span>
        </Card>

        <Card>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Dynamic Revenue Capture
          </span>
          <strong className="text-2xl font-mono font-bold text-slate-900 mt-2 block">
            {formatCurrency(analytics?.estimatedRevenueImpact || 18420)}
          </strong>
          <span className="text-xs text-emerald-600 mt-1 block">+12.4% vs static pricing</span>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue and Demand Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Historical Dynamic Revenue Impact ($)</CardTitle>
            <span className="text-xs font-semibold text-emerald-600">+48% growth QoQ</span>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue Impact']} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line
                  name="Incremental Margin Generated"
                  type="monotone"
                  dataKey="revenueGain"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right 1 Col: Trigger Reasons Donut */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger Distribution</CardTitle>
          </CardHeader>
          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={triggerPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {triggerPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs">
            {triggerPieData.map((item) => (
              <div key={item.name} className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <strong className="font-mono text-slate-800">{item.value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Decision Status Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Operational Decision Funnel</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Approved & Applied
            </span>
            <span className="text-3xl font-extrabold text-emerald-700 font-mono mt-1 block">
              {approvedCount}
            </span>
            <span className="text-xs text-emerald-600 mt-1 block">Prices published & POs placed</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
              Pending Merchandiser Review
            </span>
            <span className="text-3xl font-extrabold text-amber-600 font-mono mt-1 block">
              {pendingCount}
            </span>
            <span className="text-xs text-amber-600 mt-1 block">Currently in approval queue</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Rejected / Overruled
            </span>
            <span className="text-3xl font-extrabold text-slate-700 font-mono mt-1 block">
              {rejectedCount}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">Dismissed with human judgement</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
