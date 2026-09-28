import React, { useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suggestionsApi } from '../../api/suggestions';
import { engineApi } from '../../api/engine';
import { useToast } from '../ui/Toast';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  Sparkles, 
  BarChart3, 
  History 
} from 'lucide-react';

export function AppShell() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Queries for global pending counts and strategy
  const { data: pendingSuggestions = [] } = useQuery({
    queryKey: ['suggestions', 'PENDING'],
    queryFn: () => suggestionsApi.getAllUnifiedSuggestions('PENDING'),
    refetchInterval: 5000,
  });

  const { data: engineData, refetch: refetchStrategy } = useQuery({
    queryKey: ['engineStrategy'],
    queryFn: engineApi.getStrategy,
  });

  const strategyMutation = useMutation({
    mutationFn: (next: 'AI' | 'RULE_BASED') => engineApi.setStrategy(next),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['engineStrategy'] });
      toast({
        type: 'info',
        title: 'Strategy Updated',
        message: `Commerce Engine switched to ${data.activeStrategy} without service interruption.`,
      });
    },
    onError: () => {
      toast({
        type: 'error',
        title: 'Strategy Switch Error',
        message: 'Unable to toggle commerce engine strategy.',
      });
    },
  });

  const activeStrategy = engineData?.activeStrategy || 'AI';

  const handleToggleStrategy = () => {
    const next = activeStrategy === 'AI' ? 'RULE_BASED' : 'AI';
    strategyMutation.mutate(next);
  };

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['suggestions'] }),
      queryClient.invalidateQueries({ queryKey: ['analytics'] }),
      refetchStrategy(),
    ]);
    toast({
      type: 'success',
      title: 'Catalog Synced',
      message: 'Latest inventory signals and recommendations retrieved.',
    });
  };

  // Determine current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/products/')) return 'Product Analytics';
    if (path === '/products') return 'Catalog & Inventory Management';
    if (path === '/inventory') return 'Inventory Health & Reorder Safety';
    if (path === '/suggestions') return 'Merchandising Recommendations Queue';
    if (path === '/analytics') return 'Commerce Operations Analytics';
    if (path === '/activity') return 'Operational Audit Timeline';
    if (path === '/settings') return 'Strategy & Guardrails Settings';
    return 'Merchandising Operations Center';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        pendingCount={pendingSuggestions.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={getPageTitle()}
          subtitle="Real-time Reactive Commerce & Replenishment Advisor"
          onRefresh={handleRefresh}
          strategy={activeStrategy}
          onToggleStrategy={handleToggleStrategy}
          pendingCount={pendingSuggestions.length}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden border-t border-slate-200 bg-white h-16 flex items-center justify-around px-2 z-20">
          <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center text-[10px] ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            Dashboard
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => `flex flex-col items-center text-[10px] ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
            <Package className="w-5 h-5 mb-0.5" />
            Products
          </NavLink>
          <NavLink to="/suggestions" className={({ isActive }) => `relative flex flex-col items-center text-[10px] ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
            <Sparkles className="w-5 h-5 mb-0.5" />
            Suggestions
            {pendingSuggestions.length > 0 && (
              <span className="absolute -top-1 right-2 bg-amber-500 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                {pendingSuggestions.length}
              </span>
            )}
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => `flex flex-col items-center text-[10px] ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
            <Boxes className="w-5 h-5 mb-0.5" />
            Inventory
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `flex flex-col items-center text-[10px] ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
            <BarChart3 className="w-5 h-5 mb-0.5" />
            Analytics
          </NavLink>
        </div>
      </div>
    </div>
  );
}
