import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  RotateCw, 
  Bot, 
  User, 
  Check, 
  LogOut, 
  Settings as SettingsIcon,
  Sliders
} from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  strategy?: string;
  onToggleStrategy?: () => void;
  pendingCount?: number;
}

export function Header({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  strategy = 'AI',
  onToggleStrategy,
  pendingCount = 0
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Context */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 -mt-0.5">{subtitle}</p>}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
          />
        </form>

        {/* Runtime Strategy Switcher Badge */}
        {onToggleStrategy && (
          <button
            onClick={onToggleStrategy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-all cursor-pointer"
            title="Click to toggle between AI and Rule-Based Strategy at runtime"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            <span>Engine:</span>
            <strong className="text-indigo-600 uppercase font-mono">{strategy}</strong>
            <Sliders className="w-3 h-3 text-slate-400 ml-1" />
          </button>
        )}

        {/* Manual Refresh Button */}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isRefreshing}
            title="Refresh live catalog and suggestions"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        )}

        {/* Notification Bell */}
        <button
          onClick={() => navigate('/suggestions')}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Review Pending Suggestions"
        >
          <Bell className="w-4 h-4" />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              M
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">Merchandiser</span>
              <span className="text-[10px] text-slate-500">Ops Lead</span>
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-dropdown border border-slate-200/80 py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">
                Merchandising Console
              </div>
              <button
                onClick={() => { setIsUserMenuOpen(false); navigate('/settings'); }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <SettingsIcon className="w-3.5 h-3.5" /> Settings & Guardrails
              </button>
              <button
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-red-600"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
