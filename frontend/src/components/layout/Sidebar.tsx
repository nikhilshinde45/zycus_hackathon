import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  Sparkles, 
  BarChart3, 
  History, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingCount?: number;
}

export function Sidebar({ isCollapsed, onToggleCollapse, pendingCount = 0 }: SidebarProps) {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Inventory', path: '/inventory', icon: Boxes },
    { 
      name: 'Suggestions', 
      path: '/suggestions', 
      icon: Sparkles, 
      badge: pendingCount > 0 ? pendingCount : undefined 
    },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Activity', path: '/activity', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "bg-white border-r border-slate-200/80 transition-all duration-300 flex flex-col justify-between z-30 select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 flex-shrink-0">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-slate-900">ShopStream</span>
                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Advisor Ops</span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1">{item.name}</span>}
                {item.badge != null && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold transition-all",
                      isCollapsed
                        ? "absolute top-1.5 right-1.5 bg-amber-500 text-white w-4 h-4 p-0 flex items-center justify-center text-[10px]"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Engine Status Badge in Footer */}
      {!isCollapsed && (
        <div className="p-4 m-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800">Autonomous Loop</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Reactive signals &bull; AI Evaluation &bull; Merchandiser Control
          </p>
        </div>
      )}
    </aside>
  );
}
