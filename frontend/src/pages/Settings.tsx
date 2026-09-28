import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sliders, 
  Bot, 
  ShieldAlert, 
  Bell, 
  Save, 
  CheckCircle2 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { engineApi } from '../api/engine';

const settingsSchema = z.object({
  activeStrategy: z.enum(['AI', 'RULE_BASED']),
  defaultThreshold: z.number().min(1, 'Must be at least 1 unit').max(100),
  criticalThreshold: z.number().min(1).max(50),
  maxPriceIncreasePct: z.number().min(1).max(100),
  maxPriceDecreasePct: z.number().min(1).max(80),
  minimumMarginPct: z.number().min(5).max(70),
  notifyLowInventory: z.boolean(),
  notifyDemandSpikes: z.boolean(),
  notifyDailyDigest: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: engineData } = useQuery({
    queryKey: ['engineStrategy'],
    queryFn: engineApi.getStrategy,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      activeStrategy: (engineData?.activeStrategy as 'AI' | 'RULE_BASED') || 'AI',
      defaultThreshold: 15,
      criticalThreshold: 5,
      maxPriceIncreasePct: 20,
      maxPriceDecreasePct: 25,
      minimumMarginPct: 15,
      notifyLowInventory: true,
      notifyDemandSpikes: true,
      notifyDailyDigest: false,
    },
  });

  const currentStrategy = watch('activeStrategy');

  const strategyMutation = useMutation({
    mutationFn: (strategy: 'AI' | 'RULE_BASED') => engineApi.setStrategy(strategy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engineStrategy'] });
      toast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Engine configuration and guardrails updated successfully.',
      });
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    strategyMutation.mutate(data.activeStrategy);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Strategy & Guardrails Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure autonomous commerce thresholds, pricing bounds, and runtime engine strategies.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Commerce Engine Strategy */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <Bot className="w-4 h-4 text-indigo-600" /> Active Commerce Strategy
              </CardTitle>
              <CardDescription>
                Toggle the decision engine at runtime without restarting servers or services.
              </CardDescription>
            </div>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                currentStrategy === 'AI'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">AI Commerce Advisor</span>
                  <input
                    type="radio"
                    value="AI"
                    {...register('activeStrategy')}
                    className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Deep context-aware analysis via LLM gateway. Synthesizes stock run-rate, peer category averages, and trigger conditions.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded w-fit">
                Graceful fallback to Rule-Based enabled
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                currentStrategy === 'RULE_BASED'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">Rule-Based Deterministic</span>
                  <input
                    type="radio"
                    value="RULE_BASED"
                    {...register('activeStrategy')}
                    className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Deterministic math baseline. If stock &lt; threshold, recommend 10% price increase; if velocity &gt; 2x avg, recommend 5%. Reorder target: 3x threshold.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit">
                Zero external dependencies
              </div>
            </label>
          </div>
        </Card>

        {/* Section 2: Pricing Guardrails */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <ShieldAlert className="w-4 h-4 text-emerald-600" /> Pricing Safety Guardrails
              </CardTitle>
              <CardDescription>
                Algorithmic boundaries preventing erratic price shifts even if recommended by models.
              </CardDescription>
            </div>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Max Price Increase Cap (%)
              </label>
              <input
                type="number"
                {...register('maxPriceIncreasePct', { valueAsNumber: true })}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Upper bound per single cycle</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Max Clearance Discount (%)
              </label>
              <input
                type="number"
                {...register('maxPriceDecreasePct', { valueAsNumber: true })}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Maximum downward elasticity</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Margin Safety Floor (%)
              </label>
              <input
                type="number"
                {...register('minimumMarginPct', { valueAsNumber: true })}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Sprint 2 CostPrice buffer</span>
            </div>
          </div>
        </Card>

        {/* Section 3: Notification Preferences */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <Bell className="w-4 h-4 text-amber-500" /> Operational Notifications
              </CardTitle>
              <CardDescription>
                Channels alerted when inventory signals or high-velocity spikes occur.
              </CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Critical Low Stock Push</span>
                <span className="text-[11px] text-slate-500">Alert immediately when stock drops below threshold</span>
              </div>
              <input
                type="checkbox"
                {...register('notifyLowInventory')}
                className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Demand Surge Signals</span>
                <span className="text-[11px] text-slate-500">Alert when 24h order velocity exceeds 3x category average</span>
              </div>
              <input
                type="checkbox"
                {...register('notifyDemandSpikes')}
                className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </label>
          </div>
        </Card>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={strategyMutation.isPending || isSubmitting}
          >
            <Save className="w-4 h-4 mr-1.5" /> Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
