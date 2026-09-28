import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  History, 
  Sparkles, 
  Boxes, 
  CheckCircle2, 
  Zap, 
  Search,
  Filter
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { activityApi } from '../api/activity';
import { ActivityEvent } from '../types';

export function Activity() {
  const [filter, setFilter] = useState<'ALL' | 'INVENTORY' | 'RECOMMENDATION' | 'APPROVAL'>('ALL');
  const [search, setSearch] = useState('');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['activityEvents'],
    queryFn: activityApi.getRecentEvents,
  });

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.productSku && e.productSku.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'INVENTORY') return e.type === 'INVENTORY' || e.type === 'SALE';
    if (filter === 'RECOMMENDATION') return e.type === 'PRICING_SUGGESTION' || e.type === 'REORDER_SUGGESTION';
    if (filter === 'APPROVAL') return e.type === 'APPROVAL' || e.type === 'REJECTION';

    return true;
  });

  const getEventIcon = (type: ActivityEvent['type']) => {
    if (type === 'PRICING_SUGGESTION' || type === 'REORDER_SUGGESTION') {
      return (
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    }
    if (type === 'INVENTORY' || type === 'SALE') {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
          <Boxes className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Operational Audit & Activity Timeline
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Chronological record of stock threshold signals, AI evaluations, and human merchandiser decisions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'INVENTORY', label: '📦 Inventory & Orders' },
            { id: 'RECOMMENDATION', label: '✨ AI Suggestions' },
            { id: 'APPROVAL', label: '✓ Approvals & Human Actions' },
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
            placeholder="Search activity log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Activity Timeline List */}
      <Card className="p-6">
        <div className="relative pl-6 space-y-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {filteredEvents.map((event) => (
            <div key={event.id} className="relative flex items-start gap-4">
              {/* Timeline marker icon */}
              <div className="relative z-10 -ml-6">{getEventIcon(event.type)}</div>

              {/* Event Content Box */}
              <div className="flex-1 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{event.title}</h4>
                    {event.productSku && (
                      <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {event.productSku}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-400">{event.timestamp}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-sans mt-1">
                  {event.description}
                </p>

                {event.productName && (
                  <div className="mt-2 text-[11px] text-slate-400 font-medium">
                    Target SKU: <span className="text-slate-700">{event.productName}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
