package com.shopstream.service;

import com.shopstream.domain.*;
import com.shopstream.repository.PricingSuggestionRepository;
import com.shopstream.repository.ProductRepository;
import com.shopstream.repository.ReorderSuggestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AgenticLoopService {

    private static final Logger log = LoggerFactory.getLogger(AgenticLoopService.class);

    private final CommerceAdvisor commerceAdvisor;
    private final PricingSuggestionRepository pricingSuggestionRepository;
    private final ReorderSuggestionRepository reorderSuggestionRepository;
    private final ProductRepository productRepository;

    public AgenticLoopService(CommerceAdvisor commerceAdvisor, 
                              PricingSuggestionRepository pricingSuggestionRepository, 
                              ReorderSuggestionRepository reorderSuggestionRepository,
                              ProductRepository productRepository) {
        this.commerceAdvisor = commerceAdvisor;
        this.pricingSuggestionRepository = pricingSuggestionRepository;
        this.reorderSuggestionRepository = reorderSuggestionRepository;
        this.productRepository = productRepository;
    }

    /**
     * Agentic recommendation loop:
     * Observe (stock/velocity signal) -> Reason (AI/Rule) -> Act (queue suggestions) -> Checkpoint (Human approval)
     */
    @Async
    @EventListener
    @Transactional
    public void handleInventorySignal(InventorySignalEvent event) {
        Product product = event.getProduct();
        TriggerReason triggerReason = event.getTriggerReason();

        log.info("[Agentic Loop] Trigger received: {} for Product SKU: {} (Stock: {}, Velocity: {})",
                triggerReason, product.getSku(), product.getStockLevel(), product.getDemandVelocity());

        // Check if there is already a PENDING pricing suggestion for this product and trigger
        Optional<PricingSuggestion> existingPricing = pricingSuggestionRepository
                .findFirstByProductIdAndStatusAndTriggerReason(product.getId(), SuggestionStatus.PENDING, triggerReason);
        
        if (existingPricing.isEmpty()) {
            log.info("[Agentic Loop] Generating Pricing Suggestion via strategy: {}...", commerceAdvisor.getStrategyName());
            PricingSuggestion pricingSuggestion = commerceAdvisor.suggestPricing(product, triggerReason);
            pricingSuggestionRepository.save(pricingSuggestion);

            // Update product lifecycle state to PRICE_REVIEW_PENDING
            product.setStatus(ProductStatus.PRICE_REVIEW_PENDING);
            productRepository.save(product);
            log.info("[Agentic Loop] Pricing suggestion created with id: {}", pricingSuggestion.getId());
        } else {
            log.info("[Agentic Loop] Duplicate PENDING pricing suggestion exists for SKU: {}. Skipping.", product.getSku());
        }

        // Check if there is already a PENDING reorder suggestion for this product and trigger
        Optional<ReorderSuggestion> existingReorder = reorderSuggestionRepository
                .findFirstByProductIdAndStatusAndTriggerReason(product.getId(), SuggestionStatus.PENDING, triggerReason);

        if (existingReorder.isEmpty()) {
            log.info("[Agentic Loop] Generating Reorder Suggestion via strategy: {}...", commerceAdvisor.getStrategyName());
            ReorderSuggestion reorderSuggestion = commerceAdvisor.suggestReorder(product, triggerReason);
            reorderSuggestionRepository.save(reorderSuggestion);
            log.info("[Agentic Loop] Reorder suggestion created with id: {}", reorderSuggestion.getId());
        } else {
            log.info("[Agentic Loop] Duplicate PENDING reorder suggestion exists for SKU: {}. Skipping.", product.getSku());
        }
    }
}
