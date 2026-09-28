import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { UnifiedSuggestion } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  suggestion: UnifiedSuggestion | null;
  action: 'APPROVE' | 'REJECT';
  isLoading?: boolean;
}

export function ApprovalDialog({ isOpen, onClose, onConfirm, suggestion, action, isLoading }: ApprovalDialogProps) {
  if (!suggestion) return null;

  const isPricing = suggestion.type === 'PRICING';
  const isApprove = action === 'APPROVE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? "Approve Recommendation?" : "Reject Recommendation?"}
      description={
        isApprove
          ? "This will commit the operational changes directly into active commerce state."
          : "This recommendation will be archived and will not affect prices or inventory."
      }
    >
      <div className="space-y-4">
        {/* Item Summary Card */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-2">
          <div className="flex justify-between font-medium">
            <span className="text-slate-500">Product:</span>
            <span className="font-semibold text-slate-800">{suggestion.product?.name} ({suggestion.product?.sku})</span>
          </div>

          {isPricing && (
            <div className="flex justify-between items-center py-1 border-t border-slate-200/50">
              <span className="text-slate-500">Price Adjustment:</span>
              <span className="font-mono text-sm font-bold text-indigo-700">
                {formatCurrency(suggestion.currentPrice)} &rarr; {formatCurrency(suggestion.recommendedPrice)}
              </span>
            </div>
          )}

          {!isPricing && (
            <div className="flex justify-between items-center py-1 border-t border-slate-200/50">
              <span className="text-slate-500">Replenishment Order:</span>
              <span className="font-mono text-sm font-bold text-emerald-700">
                +{suggestion.recommendedQuantity} units ({suggestion.suggestedLeadTimeDays || 7} days lead time)
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500">
          {isApprove
            ? "Are you sure you want to proceed with executing this recommendation?"
            : "Are you sure you want to dismiss this suggestion?"}
        </p>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? "success" : "destructive"}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {isApprove ? "Confirm Approval" : "Confirm Rejection"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
