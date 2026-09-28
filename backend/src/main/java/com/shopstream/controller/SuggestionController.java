package com.shopstream.controller;

import com.shopstream.domain.*;
import com.shopstream.repository.PricingSuggestionRepository;
import com.shopstream.repository.ProductRepository;
import com.shopstream.repository.ReorderSuggestionRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class SuggestionController {

    private final PricingSuggestionRepository pricingSuggestionRepository;
    private final ReorderSuggestionRepository reorderSuggestionRepository;
    private final ProductRepository productRepository;

    public SuggestionController(PricingSuggestionRepository pricingSuggestionRepository,
                                ReorderSuggestionRepository reorderSuggestionRepository,
                                ProductRepository productRepository) {
        this.pricingSuggestionRepository = pricingSuggestionRepository;
        this.reorderSuggestionRepository = reorderSuggestionRepository;
        this.productRepository = productRepository;
    }

    @GetMapping("/pricing-suggestions")
    public List<PricingSuggestion> getPricingSuggestions(@RequestParam(required = false) SuggestionStatus status) {
        if (status != null) {
            return pricingSuggestionRepository.findByStatus(status);
        }
        return pricingSuggestionRepository.findAll();
    }

    @GetMapping("/reorder-suggestions")
    public List<ReorderSuggestion> getReorderSuggestions(@RequestParam(required = false) SuggestionStatus status) {
        if (status != null) {
            return reorderSuggestionRepository.findByStatus(status);
        }
        return reorderSuggestionRepository.findAll();
    }

    @PatchMapping("/pricing-suggestions/{id}")
    public PricingSuggestion handlePricingSuggestion(
            @PathVariable Long id, 
            @RequestParam(required = false) SuggestionStatus status,
            @RequestBody(required = false) Map<String, String> body) {
        
        SuggestionStatus finalStatus = resolveStatus(status, body);
        PricingSuggestion suggestion = pricingSuggestionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pricing suggestion not found: " + id));
        suggestion.setStatus(finalStatus);

        Product product = suggestion.getProduct();
        if (finalStatus == SuggestionStatus.ACCEPTED && product != null) {
            product.setCurrentPrice(suggestion.getRecommendedPrice());
        }

        // Restore lifecycle: if no remaining pending pricing suggestions, transition out of PRICE_REVIEW_PENDING
        if (product != null) {
            if (product.getStockLevel() <= 0) {
                product.setStatus(ProductStatus.OUT_OF_STOCK);
            } else {
                product.setStatus(ProductStatus.ACTIVE);
            }
            productRepository.save(product);
        }

        return pricingSuggestionRepository.save(suggestion);
    }

    @PatchMapping("/reorder-suggestions/{id}")
    public ReorderSuggestion handleReorderSuggestion(
            @PathVariable Long id, 
            @RequestParam(required = false) SuggestionStatus status,
            @RequestBody(required = false) Map<String, String> body) {
        
        SuggestionStatus finalStatus = resolveStatus(status, body);
        ReorderSuggestion suggestion = reorderSuggestionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reorder suggestion not found: " + id));
        suggestion.setStatus(finalStatus);

        Product product = suggestion.getProduct();
        if (finalStatus == SuggestionStatus.ACCEPTED && product != null) {
            // simulate inbound shipment
            product.setStockLevel(product.getStockLevel() + suggestion.getRecommendedQuantity());
            if (product.getStatus() == ProductStatus.OUT_OF_STOCK && product.getStockLevel() > 0) {
                product.setStatus(ProductStatus.ACTIVE);
            }
            productRepository.save(product);
        }

        return reorderSuggestionRepository.save(suggestion);
    }

    private SuggestionStatus resolveStatus(SuggestionStatus paramStatus, Map<String, String> body) {
        if (paramStatus != null) {
            return paramStatus;
        }
        if (body != null && body.containsKey("status")) {
            return SuggestionStatus.valueOf(body.get("status").toUpperCase());
        }
        throw new IllegalArgumentException("Suggestion status (ACCEPTED or REJECTED) must be provided");
    }
}
