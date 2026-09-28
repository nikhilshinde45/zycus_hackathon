export type ProductCategory = 'ELECTRONICS' | 'APPAREL' | 'HOME';

export type ProductStatus = 'ACTIVE' | 'PRICE_REVIEW_PENDING' | 'OUT_OF_STOCK';

export type SuggestionStatus = 
  | 'PENDING' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'EXECUTED' 
  | 'EXPIRED' 
  | 'CANCELLED';

export type TriggerReason = 
  | 'INITIAL' 
  | 'INVENTORY_LOW' 
  | 'DEMAND_SPIKE' 
  | 'MANUAL'
  | 'STOCKOUT';

export type ChangeDirection = 'INCREASE' | 'DECREASE' | 'HOLD';

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: ProductCategory;
  currentPrice: number;
  stockLevel: number;
  reorderThreshold: number;
  demandVelocity: number;
  status: ProductStatus;
  costPrice?: number;
  supplierId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingSuggestion {
  id: number;
  product: Product;
  currentPrice: number;
  recommendedPrice: number;
  changeDirection: ChangeDirection;
  confidence: number;
  reasoning: string;
  status: SuggestionStatus;
  triggerReason: TriggerReason;
  createdAt: string;
}

export interface ReorderSuggestion {
  id: number;
  product: Product;
  currentStock: number;
  recommendedQuantity: number;
  suggestedLeadTimeDays: number;
  confidence: number;
  reasoning: string;
  status: SuggestionStatus;
  triggerReason: TriggerReason;
  createdAt: string;
}

export interface UnifiedSuggestion {
  id: number;
  type: 'PRICING' | 'REORDER';
  product: Product;
  currentPrice?: number;
  recommendedPrice?: number;
  currentStock?: number;
  recommendedQuantity?: number;
  suggestedLeadTimeDays?: number;
  changeDirection?: ChangeDirection;
  confidence: number;
  reasoning: string;
  status: SuggestionStatus;
  triggerReason: TriggerReason;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'INVENTORY' | 'PRICING_SUGGESTION' | 'REORDER_SUGGESTION' | 'APPROVAL' | 'REJECTION' | 'SALE';
  title: string;
  description: string;
  productSku?: string;
  productName?: string;
}

export interface AnalyticsSummary {
  totalMonitoredProducts: number;
  lowStockCount: number;
  pendingReviewsCount: number;
  estimatedRevenueImpact: number;
  averageConfidence: number;
  approvalRate: number;
}
