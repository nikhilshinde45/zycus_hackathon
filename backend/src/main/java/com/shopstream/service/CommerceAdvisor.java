package com.shopstream.service;

import com.shopstream.domain.PricingSuggestion;
import com.shopstream.domain.Product;
import com.shopstream.domain.ReorderSuggestion;
import com.shopstream.domain.TriggerReason;

public interface CommerceAdvisor {
    PricingSuggestion suggestPricing(Product product, TriggerReason triggerReason);
    ReorderSuggestion suggestReorder(Product product, TriggerReason triggerReason);
    String getStrategyName();
}
