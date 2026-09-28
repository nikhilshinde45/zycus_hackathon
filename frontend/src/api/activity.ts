import { ActivityEvent } from '../types';

export const activityApi = {
  getRecentEvents: async (): Promise<ActivityEvent[]> => {
    return [
      {
        id: 'act-1',
        timestamp: 'Just now',
        type: 'INVENTORY',
        title: 'Inventory Signal Triggered',
        description: 'Aura Pro Wireless Headphones dropped to 14 units (Threshold: 15). Agentic loop initiated.',
        productSku: 'ELEC-001',
        productName: 'Aura Pro Wireless Headphones',
      },
      {
        id: 'act-2',
        timestamp: '8 minutes ago',
        type: 'PRICING_SUGGESTION',
        title: 'AI Pricing Suggestion Created',
        description: 'Recommended price increase to $219.99 (+10%) to protect inventory run-rate.',
        productSku: 'ELEC-001',
        productName: 'Aura Pro Wireless Headphones',
      },
      {
        id: 'act-3',
        timestamp: '25 minutes ago',
        type: 'REORDER_SUGGESTION',
        title: 'Replenishment Order Drafted',
        description: 'Suggested reorder of 31 units with 7-day estimated supplier lead time.',
        productSku: 'ELEC-001',
        productName: 'Aura Pro Wireless Headphones',
      },
      {
        id: 'act-4',
        timestamp: '1 hour ago',
        type: 'SALE',
        title: 'Demand Spike Registered',
        description: 'Vintage Washed Oversized Hoodie recorded 185 orders in 24h (>3x category peer average).',
        productSku: 'APP-001',
        productName: 'Vintage Washed Oversized Hoodie',
      },
      {
        id: 'act-5',
        timestamp: '3 hours ago',
        type: 'APPROVAL',
        title: 'Merchandiser Price Approval',
        description: 'Approved clearance price adjustment on Nordic Minimalist LED Desk Lamp to $89.00.',
        productSku: 'HOME-002',
        productName: 'Nordic Minimalist LED Desk Lamp',
      },
    ];
  },
};
