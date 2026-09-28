package com.shopstream.service;

import com.shopstream.domain.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service("ruleBasedStrategy")
public class RuleBasedStrategy implements CommerceAdvisor {

    @Override
    public PricingSuggestion suggestPricing(Product product, TriggerReason triggerReason) {
        PricingSuggestion suggestion = new PricingSuggestion();
        suggestion.setProduct(product);
        suggestion.setCurrentPrice(product.getCurrentPrice());
        suggestion.setTriggerReason(triggerReason);
        suggestion.setConfidence(1.0);

        // Rule-based pricing strategy:
        // if stock < reorder threshold, recommend 10% price increase
        // if demand velocity > 2 * category average (assuming 50 for simplicity here), recommend 5% increase
        // otherwise HOLD
        
        int categoryAverageVelocity = 50; // Mock average

        if (product.getStockLevel() < product.getReorderThreshold()) {
            suggestion.setRecommendedPrice(product.getCurrentPrice().multiply(BigDecimal.valueOf(1.10)));
            suggestion.setChangeDirection(ChangeDirection.INCREASE);
            suggestion.setReasoning("Rule-based: Stock is below reorder threshold. Increasing price by 10% to protect inventory.");
        } else if (product.getDemandVelocity() > (2 * categoryAverageVelocity)) {
            suggestion.setRecommendedPrice(product.getCurrentPrice().multiply(BigDecimal.valueOf(1.05)));
            suggestion.setChangeDirection(ChangeDirection.INCREASE);
            suggestion.setReasoning("Rule-based: Demand velocity is high. Increasing price by 5%.");
        } else {
            suggestion.setRecommendedPrice(product.getCurrentPrice());
            suggestion.setChangeDirection(ChangeDirection.HOLD);
            suggestion.setReasoning("Rule-based: Stock and demand are stable. Holding price.");
        }

        return suggestion;
    }

    @Override
    public ReorderSuggestion suggestReorder(Product product, TriggerReason triggerReason) {
        ReorderSuggestion suggestion = new ReorderSuggestion();
        suggestion.setProduct(product);
        suggestion.setCurrentStock(product.getStockLevel());
        suggestion.setTriggerReason(triggerReason);
        suggestion.setConfidence(1.0);

        // Rule-based reorder strategy: 
        // recommend quantity = (reorder threshold * 3) - current stock, minimum 1
        int quantity = (product.getReorderThreshold() * 3) - product.getStockLevel();
        if (quantity < 1) {
            quantity = 1;
        }
        
        suggestion.setRecommendedQuantity(quantity);
        suggestion.setSuggestedLeadTimeDays(7);
        suggestion.setReasoning("Rule-based: Reordering to reach 3x threshold.");

        return suggestion;
    }

    @Override
    public String getStrategyName() {
        return "RuleBased";
    }
}
