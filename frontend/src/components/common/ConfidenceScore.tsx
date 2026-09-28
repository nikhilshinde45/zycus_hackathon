import { cn } from '../../lib/utils';

export function ConfidenceScore({ score, className }: { score: number; className?: string }) {
  const percentage = Math.round(score * 100);
  
  let color = "bg-indigo-600";
  let textColor = "text-indigo-600";
  if (percentage >= 85) {
    color = "bg-emerald-500";
    textColor = "text-emerald-700 font-semibold";
  } else if (percentage >= 70) {
    color = "bg-indigo-500";
    textColor = "text-indigo-700";
  } else {
    color = "bg-amber-500";
    textColor = "text-amber-700";
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <span className="text-slate-500 font-medium">Confidence:</span>
      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn("font-mono text-xs", textColor)}>{percentage}%</span>
    </div>
  );
}
