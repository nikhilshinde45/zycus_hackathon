package com.shopstream.service;

import com.shopstream.domain.PricingSuggestion;
import com.shopstream.domain.Product;
import com.shopstream.domain.ReorderSuggestion;
import com.shopstream.domain.TriggerReason;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicReference;

@Service
@Primary
public class DynamicCommerceAdvisorRouter implements CommerceAdvisor {

    private static final Logger log = LoggerFactory.getLogger(DynamicCommerceAdvisorRouter.class);

    @Value("${shopstream.engine.active-strategy:AI}")
    private String defaultStrategy;

    private final RuleBasedStrategy ruleBasedStrategy;
    private final AiStrategy aiStrategy;

    private final AtomicReference<String> activeStrategyName = new AtomicReference<>("AI");

    public DynamicCommerceAdvisorRouter(RuleBasedStrategy ruleBasedStrategy, AiStrategy aiStrategy) {
        this.ruleBasedStrategy = ruleBasedStrategy;
        this.aiStrategy = aiStrategy;
    }

    @PostConstruct
    public void init() {
        if ("RULE_BASED".equalsIgnoreCase(defaultStrategy) || "ruleBased".equalsIgnoreCase(defaultStrategy)) {
            activeStrategyName.set("RULE_BASED");
        } else {
            activeStrategyName.set("AI");
        }
        log.info("Initialized Commerce Engine with active strategy: {}", activeStrategyName.get());
    }

    public void setActiveStrategy(String strategy) {
        if ("AI".equalsIgnoreCase(strategy)) {
            activeStrategyName.set("AI");
        } else {
            activeStrategyName.set("RULE_BASED");
        }
        log.info("Commerce Engine switched active strategy to: {}", activeStrategyName.get());
    }

    public String getActiveStrategyName() {
        return activeStrategyName.get();
    }

    private CommerceAdvisor getDelegate() {
        if ("AI".equalsIgnoreCase(activeStrategyName.get())) {
            return aiStrategy;
        }
        return ruleBasedStrategy;
    }

    @Override
    public PricingSuggestion suggestPricing(Product product, TriggerReason triggerReason) {
        return getDelegate().suggestPricing(product, triggerReason);
    }

    @Override
    public ReorderSuggestion suggestReorder(Product product, TriggerReason triggerReason) {
        return getDelegate().suggestReorder(product, triggerReason);
    }

    @Override
    public String getStrategyName() {
        return activeStrategyName.get();
    }
}
