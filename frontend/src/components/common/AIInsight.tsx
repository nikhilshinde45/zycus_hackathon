import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ConfidenceScore } from './ConfidenceScore';

interface AIInsightProps {
  reasoning: string;
  confidence: number;
  className?: string;
}

export function AIInsight({ reasoning, confidence, className }: AIInsightProps) {
  return (
    <div className={cn("p-4 rounded-xl bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-white border border-indigo-100/80 shadow-subtle", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>AI Commerce Advisor</span>
        </div>
        <ConfidenceScore score={confidence} />
      </div>
      <p className="text-xs text-slate-700 leading-relaxed font-sans">
        {reasoning}
      </p>
    </div>
  );
}
