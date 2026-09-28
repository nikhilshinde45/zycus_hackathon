package com.shopstream.controller;

import com.shopstream.domain.*;
import com.shopstream.repository.PricingSuggestionRepository;
import com.shopstream.repository.ProductRepository;
import com.shopstream.repository.ReorderSuggestionRepository;
import com.shopstream.service.CommerceAdvisor;
import com.shopstream.service.ProductService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductRepository productRepository;
    private final ProductService productService;
    private final CommerceAdvisor commerceAdvisor;
    private final PricingSuggestionRepository pricingSuggestionRepository;
    private final ReorderSuggestionRepository reorderSuggestionRepository;

    public ProductController(ProductRepository productRepository, 
                             ProductService productService,
                             CommerceAdvisor commerceAdvisor,
                             PricingSuggestionRepository pricingSuggestionRepository,
                             ReorderSuggestionRepository reorderSuggestionRepository) {
        this.productRepository = productRepository;
        this.productService = productService;
        this.commerceAdvisor = commerceAdvisor;
        this.pricingSuggestionRepository = pricingSuggestionRepository;
        this.reorderSuggestionRepository = reorderSuggestionRepository;
    }

    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        if (product.getStatus() == null) {
            product.setStatus(ProductStatus.ACTIVE);
        }
        return productRepository.save(product);
    }

    @GetMapping
    public List<Product> getProducts(
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) ProductCategory category) {
        
        if (status != null && category != null) {
            return productRepository.findByStatusAndCategory(status, category);
        } else if (status != null) {
            return productRepository.findByStatus(status);
        } else if (category != null) {
            return productRepository.findByCategory(category);
        }
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    @PatchMapping("/{id}/stock")
    public Product updateStock(@PathVariable Long id, @RequestParam Integer quantityChange) {
        return productService.updateStock(id, quantityChange);
    }

    @PostMapping("/{id}/orders")
    public Product simulateSale(@PathVariable Long id) {
        return productService.simulateOrder(id);
    }

    @PostMapping("/{id}/suggest-pricing")
    public PricingSuggestion suggestPricingOnDemand(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        PricingSuggestion suggestion = commerceAdvisor.suggestPricing(product, TriggerReason.MANUAL);
        
        // Update product lifecycle status to PRICE_REVIEW_PENDING
        product.setStatus(ProductStatus.PRICE_REVIEW_PENDING);
        productRepository.save(product);

        return pricingSuggestionRepository.save(suggestion);
    }

    @PostMapping("/{id}/suggest-reorder")
    public ReorderSuggestion suggestReorderOnDemand(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        ReorderSuggestion suggestion = commerceAdvisor.suggestReorder(product, TriggerReason.MANUAL);
        return reorderSuggestionRepository.save(suggestion);
    }

    /**
     * Bonus Endpoint: SSE Token Stream of AI Reasoning before the suggestion lands
     */
    @PostMapping(value = "/{id}/suggest-pricing/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamPricingSuggestion(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        
        SseEmitter emitter = new SseEmitter(60000L);
        
        Executors.newSingleThreadExecutor().submit(() -> {
            try {
                emitter.send(SseEmitter.event().name("status").data("Analyzing stock level and velocity signals..."));
                Thread.sleep(300);

                PricingSuggestion suggestion = commerceAdvisor.suggestPricing(product, TriggerReason.MANUAL);
                
                String reasoning = suggestion.getReasoning();
                String[] words = reasoning.split(" ");
                for (String word : words) {
                    emitter.send(SseEmitter.event().name("token").data(word + " "));
                    Thread.sleep(40);
                }

                product.setStatus(ProductStatus.PRICE_REVIEW_PENDING);
                productRepository.save(product);
                pricingSuggestionRepository.save(suggestion);

                emitter.send(SseEmitter.event().name("complete").data(suggestion));
                emitter.complete();
            } catch (Exception ex) {
                try {
                    emitter.send(SseEmitter.event().name("error").data(ex.getMessage()));
                } catch (IOException ignored) {}
                emitter.completeWithError(ex);
            }
        });

        return emitter;
    }
}
