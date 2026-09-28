package com.shopstream.service;

import com.shopstream.domain.Product;
import com.shopstream.domain.ProductStatus;
import com.shopstream.domain.TriggerReason;
import com.shopstream.repository.ProductRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ProductService(ProductRepository productRepository, ApplicationEventPublisher eventPublisher) {
        this.productRepository = productRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public Product updateStock(Long productId, Integer quantityChange) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.setStockLevel(product.getStockLevel() + quantityChange);
        
        if (product.getStockLevel() <= 0) {
            product.setStockLevel(0);
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        } else {
             // Reset from OUT_OF_STOCK if positive
            if (product.getStatus() == ProductStatus.OUT_OF_STOCK) {
                product.setStatus(ProductStatus.ACTIVE);
            }
        }

        Product savedProduct = productRepository.save(product);

        checkInventorySignals(savedProduct);

        return savedProduct;
    }

    @Transactional
    public Product simulateOrder(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getStockLevel() > 0) {
            product.setStockLevel(product.getStockLevel() - 1);
            product.setDemandVelocity(product.getDemandVelocity() + 1);
            
            if (product.getStockLevel() == 0) {
                product.setStatus(ProductStatus.OUT_OF_STOCK);
            }
        }
        
        Product savedProduct = productRepository.save(product);
        checkInventorySignals(savedProduct);

        return savedProduct;
    }
    
    private void checkInventorySignals(Product product) {
        // Trigger A: Inventory Low
        if (product.getStockLevel() < product.getReorderThreshold()) {
            eventPublisher.publishEvent(new InventorySignalEvent(product, TriggerReason.INVENTORY_LOW));
        }
        
        // Trigger B: Demand Spike (e.g. > 3x category average of 50 -> 150)
        // Simplified category average for now
        int categoryAverage = 50; 
        if (product.getDemandVelocity() > (3 * categoryAverage)) {
            eventPublisher.publishEvent(new InventorySignalEvent(product, TriggerReason.DEMAND_SPIKE));
        }
    }
}
